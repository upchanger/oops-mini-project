package com.notes.service;

import com.notes.exception.NoteNotFoundException;
import com.notes.exception.ValidationException;
import com.notes.factory.NoteFactory;
import com.notes.model.*;
import com.notes.repository.NoteRepository;
import com.notes.strategy.ContentSearchStrategy;
import com.notes.strategy.SearchStrategy;
import com.notes.strategy.SortStrategy;
import com.notes.strategy.TagSearchStrategy;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * High-level business service orchestrating note operations.
 * Demonstrates the Dependency Inversion Principle: depends on NoteRepository interface.
 */
@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final SearchStrategy defaultSearchStrategy;
    private final TagSearchStrategy tagSearchStrategy;

    public NoteService(NoteRepository noteRepository,
                       ContentSearchStrategy defaultSearchStrategy,
                       TagSearchStrategy tagSearchStrategy) {
        this.noteRepository = noteRepository;
        this.defaultSearchStrategy = defaultSearchStrategy;
        this.tagSearchStrategy = tagSearchStrategy;
    }

    public List<AbstractNote> getNotes(String query, String tag, String sortOption) {
        List<AbstractNote> notes = noteRepository.findAll();

        // 1. Filter by tag if requested
        if (tag != null && !tag.isBlank()) {
            notes = tagSearchStrategy.search(notes, tag);
        }

        // 2. Filter by search query if requested
        if (query != null && !query.isBlank()) {
            notes = defaultSearchStrategy.search(notes, query);
        }

        // 3. Apply sorting strategy
        SortStrategy sortStrategy = SortStrategy.fromString(sortOption);
        return sortStrategy.sort(notes);
    }

    public AbstractNote getNoteById(String id) {
        return noteRepository.findById(id)
                .orElseThrow(() -> new NoteNotFoundException(id));
    }

    public TextNote createTextNote(String title, String content, Set<String> tags) {
        TextNote note = NoteFactory.createTextNote(title, content, tags);
        noteRepository.save(note);
        return note;
    }

    public ChecklistNote createChecklistNote(String title, List<String> items, Set<String> tags) {
        ChecklistNote note = NoteFactory.createChecklistNote(title, items, tags);
        noteRepository.save(note);
        return note;
    }

    public EncryptedNote createEncryptedNote(String title, String content, String pin, Set<String> tags) {
        EncryptedNote note = NoteFactory.createEncryptedNote(title, content, pin, tags);
        noteRepository.save(note);
        return note;
    }

    public ReminderNote createReminderNote(String title, String content, LocalDateTime dueDate, Priority priority, Set<String> tags) {
        ReminderNote note = NoteFactory.createReminderNote(title, content, dueDate, priority, tags);
        noteRepository.save(note);
        return note;
    }

    public void toggleChecklistItem(String noteId, int itemIndex) {
        AbstractNote note = getNoteById(noteId);
        if (!(note instanceof ChecklistNote checklistNote)) {
            throw new ValidationException("Note with ID " + noteId + " is not a checklist note.");
        }
        checklistNote.toggleItem(itemIndex);
        noteRepository.save(checklistNote);
    }

    public void addChecklistItem(String noteId, String itemText) {
        AbstractNote note = getNoteById(noteId);
        if (!(note instanceof ChecklistNote checklistNote)) {
            throw new ValidationException("Note with ID " + noteId + " is not a checklist note.");
        }
        checklistNote.addItem(itemText);
        noteRepository.save(checklistNote);
    }

    public String unlockNote(String noteId, String pin) {
        AbstractNote note = getNoteById(noteId);
        if (!(note instanceof EncryptedNote encryptedNote)) {
            throw new ValidationException("Note with ID " + noteId + " is not an encrypted note.");
        }
        return encryptedNote.unlock(pin);
    }

    public void updateNoteTitle(String noteId, String newTitle) {
        AbstractNote note = getNoteById(noteId);
        note.setTitle(newTitle);
        noteRepository.save(note);
    }

    public AbstractNote updateNote(String noteId, String newTitle, String newContent, String pin, Set<String> newTags) {
        AbstractNote note = getNoteById(noteId);
        if (newTitle != null && !newTitle.trim().isEmpty()) {
            note.setTitle(newTitle.trim());
        }
        if (newTags != null) {
            note.setTags(newTags);
        }
        if (note instanceof TextNote textNote) {
            if (newContent != null) {
                textNote.setContent(newContent);
            }
        } else if (note instanceof EncryptedNote encryptedNote) {
            if (newContent != null) {
                encryptedNote.updateContent(newContent, pin);
            }
        }
        noteRepository.save(note);
        return note;
    }

    public void deleteNote(String noteId) {
        if (!noteRepository.deleteById(noteId)) {
            throw new NoteNotFoundException(noteId);
        }
    }

    public Set<String> getAllTags() {
        return noteRepository.findAll().stream()
                .flatMap(note -> note.getTags().stream())
                .collect(Collectors.toCollection(() -> new TreeSet<>(String.CASE_INSENSITIVE_ORDER)));
    }

    public Map<String, Object> getStatistics() {
        List<AbstractNote> notes = noteRepository.findAll();
        Map<NoteType, Long> typeCounts = notes.stream()
                .collect(Collectors.groupingBy(AbstractNote::getType, Collectors.counting()));

        long overdueCount = notes.stream()
                .filter(n -> n instanceof ReminderNote r && r.isOverdue())
                .count();

        return Map.of(
                "totalNotes", notes.size(),
                "textNotes", typeCounts.getOrDefault(NoteType.TEXT, 0L),
                "checklistNotes", typeCounts.getOrDefault(NoteType.CHECKLIST, 0L),
                "encryptedNotes", typeCounts.getOrDefault(NoteType.ENCRYPTED, 0L),
                "reminderNotes", typeCounts.getOrDefault(NoteType.REMINDER, 0L),
                "overdueReminders", overdueCount,
                "totalTags", getAllTags().size()
        );
    }
}
