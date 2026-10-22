package com.notes.model;

import com.notes.exception.ValidationException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Base abstract class defining common note attributes, template methods, and polymorphic hooks.
 * Demonstrates Encapsulation, Abstraction, and Inheritance foundations.
 */
public abstract class AbstractNote {

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final String id;
    private String title;
    private final LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private final Set<String> tags;

    protected AbstractNote(String id, String title, LocalDateTime createdAt, LocalDateTime updatedAt, Set<String> tags) {
        if (id == null || id.trim().isEmpty()) {
            throw new ValidationException("Note ID cannot be null or empty.");
        }
        this.id = id;
        setTitle(title);
        this.createdAt = Objects.requireNonNullElseGet(createdAt, LocalDateTime::now);
        this.updatedAt = Objects.requireNonNullElseGet(updatedAt, () -> this.createdAt);
        this.tags = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        if (tags != null) {
            tags.stream().filter(t -> t != null && !t.trim().isEmpty()).map(String::trim).forEach(this.tags::add);
        }
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            throw new ValidationException("Note title cannot be blank.");
        }
        this.title = title.trim();
        this.touch();
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    protected void touch() {
        this.updatedAt = LocalDateTime.now();
    }

    public Set<String> getTags() {
        return Collections.unmodifiableSet(tags);
    }

    public void addTag(String tag) {
        if (tag != null && !tag.trim().isEmpty()) {
            tags.add(tag.trim().toLowerCase());
            touch();
        }
    }

    public void removeTag(String tag) {
        if (tag != null && tags.remove(tag.trim().toLowerCase())) {
            touch();
        }
    }

    public boolean hasTag(String tag) {
        return tag != null && tags.contains(tag.trim().toLowerCase());
    }

    public void setTags(Set<String> newTags) {
        this.tags.clear();
        if (newTags != null) {
            newTags.stream()
                    .filter(t -> t != null && !t.trim().isEmpty())
                    .map(t -> t.trim().toLowerCase())
                    .forEach(this.tags::add);
        }
        touch();
    }

    /**
     * Polymorphic discriminator for Note variant.
     */
    public abstract NoteType getType();

    /**
     * Polymorphic method rendering the full visual presentation of the note.
     */
    public abstract String render();

    /**
     * Polymorphic search matching across note-specific content and metadata.
     */
    public abstract boolean matches(String query);

    /**
     * Polymorphic summary for cards and quick preview listings.
     */
    public abstract String getSummary();

    /**
     * Template Method pattern: Skeleton for formatting note details.
     */
    public final String displaySummary() {
        StringBuilder sb = new StringBuilder();
        sb.append("[").append(getType()).append("] ").append(title).append("\n");
        sb.append("Created: ").append(createdAt.format(FORMATTER));
        sb.append(" | Updated: ").append(updatedAt.format(FORMATTER)).append("\n");
        sb.append("Summary: ").append(getSummary()).append("\n");
        if (!tags.isEmpty()) {
            sb.append("Tags: #").append(String.join(" #", tags)).append("\n");
        }
        return sb.toString();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AbstractNote that = (AbstractNote) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
