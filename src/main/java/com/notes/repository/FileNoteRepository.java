package com.notes.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.notes.exception.StorageException;
import com.notes.model.*;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Thread-safe, JSON file-backed implementation of NoteRepository.
 * Notes are cached in-memory and atomically flushed to disk.
 */
@Repository
public class FileNoteRepository implements NoteRepository {

    private final Path storagePath;
    private final ObjectMapper objectMapper;
    private final Map<String, AbstractNote> cache = new ConcurrentHashMap<>();
    private final ReentrantReadWriteLock lock = new ReentrantReadWriteLock();

    public FileNoteRepository(@Value("${app.notes.storage-file:data/notes.json}") String storageFilePath) {
        this.storagePath = Path.of(storageFilePath);
        this.objectMapper = new ObjectMapper();
    }

    @PostConstruct
    public void init() {
        loadFromFile();
    }

    @Override
    public AbstractNote save(AbstractNote note) {
        lock.writeLock().lock();
        try {
            cache.put(note.getId(), note);
            flushToFile();
            return note;
        } finally {
            lock.writeLock().unlock();
        }
    }

    @Override
    public Optional<AbstractNote> findById(String id) {
        lock.readLock().lock();
        try {
            return Optional.ofNullable(cache.get(id));
        } finally {
            lock.readLock().unlock();
        }
    }

    @Override
    public List<AbstractNote> findAll() {
        lock.readLock().lock();
        try {
            return new ArrayList<>(cache.values());
        } finally {
            lock.readLock().unlock();
        }
    }

    @Override
    public boolean deleteById(String id) {
        lock.writeLock().lock();
        try {
            AbstractNote removed = cache.remove(id);
            if (removed != null) {
                flushToFile();
                return true;
            }
            return false;
        } finally {
            lock.writeLock().unlock();
        }
    }

    @Override
    public long count() {
        lock.readLock().lock();
        try {
            return cache.size();
        } finally {
            lock.readLock().unlock();
        }
    }

    @Override
    public void deleteAll() {
        lock.writeLock().lock();
        try {
            cache.clear();
            flushToFile();
        } finally {
            lock.writeLock().unlock();
        }
    }

    private void loadFromFile() {
        lock.writeLock().lock();
        try {
            if (!Files.exists(storagePath)) {
                if (storagePath.getParent() != null) {
                    Files.createDirectories(storagePath.getParent());
                }
                return;
            }

            File file = storagePath.toFile();
            if (file.length() == 0) {
                return;
            }

            JsonNode rootNode = objectMapper.readTree(file);
            if (rootNode == null || !rootNode.isArray()) {
                return;
            }

            cache.clear();
            for (JsonNode noteNode : rootNode) {
                AbstractNote note = deserializeNote(noteNode);
                if (note != null) {
                    cache.put(note.getId(), note);
                }
            }
        } catch (IOException e) {
            throw new StorageException("Failed to read notes from storage file: " + storagePath, e);
        } finally {
            lock.writeLock().unlock();
        }
    }

    private void flushToFile() {
        try {
            if (storagePath.getParent() != null) {
                Files.createDirectories(storagePath.getParent());
            }

            ArrayNode arrayNode = objectMapper.createArrayNode();
            for (AbstractNote note : cache.values()) {
                arrayNode.add(serializeNote(note));
            }

            Path tempFile = null;
            try {
                tempFile = Files.createTempFile(storagePath.getParent(), "notes-tmp", ".json");
                objectMapper.writerWithDefaultPrettyPrinter().writeValue(tempFile.toFile(), arrayNode);
                try {
                    Files.move(tempFile, storagePath, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
                } catch (IOException moveEx) {
                    Files.move(tempFile, storagePath, StandardCopyOption.REPLACE_EXISTING);
                }
            } catch (IOException ex) {
                // Direct file write fallback for Windows concurrency and locking
                objectMapper.writerWithDefaultPrettyPrinter().writeValue(storagePath.toFile(), arrayNode);
            } finally {
                if (tempFile != null) {
                    try { Files.deleteIfExists(tempFile); } catch (IOException ignored) {}
                }
            }
        } catch (IOException e) {
            throw new StorageException("Failed to flush notes to storage file: " + storagePath, e);
        }
    }

    private ObjectNode serializeNote(AbstractNote note) {
        ObjectNode node = objectMapper.createObjectNode();
        node.put("id", note.getId());
        node.put("type", note.getType().name());
        node.put("title", note.getTitle());
        node.put("createdAt", note.getCreatedAt().toString());
        node.put("updatedAt", note.getUpdatedAt().toString());

        ArrayNode tagsArray = node.putArray("tags");
        for (String tag : note.getTags()) {
            tagsArray.add(tag);
        }

        switch (note.getType()) {
            case TEXT -> {
                TextNote textNote = (TextNote) note;
                node.put("content", textNote.getContent());
            }
            case CHECKLIST -> {
                ChecklistNote checklistNote = (ChecklistNote) note;
                ArrayNode itemsArray = node.putArray("items");
                for (TodoItem item : checklistNote.getItems()) {
                    ObjectNode itemNode = itemsArray.addObject();
                    itemNode.put("text", item.getText());
                    itemNode.put("completed", item.isCompleted());
                }
            }
            case ENCRYPTED -> {
                EncryptedNote encryptedNote = (EncryptedNote) note;
                node.put("encryptedContent", encryptedNote.getEncryptedContent());
                node.put("pinHash", encryptedNote.getPinHash());
            }
            case REMINDER -> {
                ReminderNote reminderNote = (ReminderNote) note;
                node.put("content", reminderNote.getContent());
                node.put("dueDate", reminderNote.getDueDate().toString());
                node.put("priority", reminderNote.getPriority().name());
            }
        }
        return node;
    }

    private AbstractNote deserializeNote(JsonNode node) {
        try {
            String id = node.get("id").asText();
            String typeStr = node.get("type").asText();
            String title = node.get("title").asText();
            LocalDateTime createdAt = LocalDateTime.parse(node.get("createdAt").asText());
            LocalDateTime updatedAt = LocalDateTime.parse(node.get("updatedAt").asText());

            Set<String> tags = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
            if (node.has("tags") && node.get("tags").isArray()) {
                for (JsonNode t : node.get("tags")) {
                    tags.add(t.asText());
                }
            }

            NoteType type = NoteType.valueOf(typeStr);
            return switch (type) {
                case TEXT -> {
                    String content = node.has("content") ? node.get("content").asText() : "";
                    yield new TextNote(id, title, content, createdAt, updatedAt, tags);
                }
                case CHECKLIST -> {
                    List<TodoItem> items = new ArrayList<>();
                    if (node.has("items") && node.get("items").isArray()) {
                        for (JsonNode itemNode : node.get("items")) {
                            String itemText = itemNode.get("text").asText();
                            boolean completed = itemNode.has("completed") && itemNode.get("completed").asBoolean();
                            items.add(new TodoItem(itemText, completed));
                        }
                    }
                    yield new ChecklistNote(id, title, items, createdAt, updatedAt, tags);
                }
                case ENCRYPTED -> {
                    String encryptedContent = node.has("encryptedContent") ? node.get("encryptedContent").asText() : "";
                    String pinHash = node.has("pinHash") ? node.get("pinHash").asText() : "";
                    yield new EncryptedNote(id, title, encryptedContent, pinHash, true, createdAt, updatedAt, tags);
                }
                case REMINDER -> {
                    String content = node.has("content") ? node.get("content").asText() : "";
                    LocalDateTime dueDate = LocalDateTime.parse(node.get("dueDate").asText());
                    Priority priority = Priority.valueOf(node.get("priority").asText());
                    yield new ReminderNote(id, title, content, dueDate, priority, createdAt, updatedAt, tags);
                }
            };
        } catch (Exception e) {
            // Skip corrupted node rather than aborting entirely
            return null;
        }
    }
}
