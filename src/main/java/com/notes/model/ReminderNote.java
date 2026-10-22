package com.notes.model;

import com.notes.exception.ValidationException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import java.util.Set;

/**
 * Reminder note with priority levels, scheduled due date, and overdue detection.
 */
public class ReminderNote extends AbstractNote {

    private static final DateTimeFormatter DUE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private String content;
    private LocalDateTime dueDate;
    private Priority priority;

    public ReminderNote(String id, String title, String content, LocalDateTime dueDate, Priority priority, LocalDateTime createdAt, LocalDateTime updatedAt, Set<String> tags) {
        super(id, title, createdAt, updatedAt, tags);
        this.content = (content == null) ? "" : content;
        setDueDate(dueDate);
        setPriority(priority);
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = (content == null) ? "" : content;
        touch();
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        if (dueDate == null) {
            throw new ValidationException("Due date for a reminder cannot be null.");
        }
        this.dueDate = dueDate;
        touch();
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = Objects.requireNonNullElse(priority, Priority.MEDIUM);
        touch();
    }

    public boolean isOverdue() {
        return LocalDateTime.now().isAfter(dueDate);
    }

    @Override
    public NoteType getType() {
        return NoteType.REMINDER;
    }

    @Override
    public String render() {
        StringBuilder sb = new StringBuilder();
        sb.append("Priority: ").append(priority).append("\n");
        sb.append("Due Date: ").append(dueDate.format(DUE_FORMAT));
        if (isOverdue()) {
            sb.append(" [OVERDUE]");
        }
        sb.append("\n\n").append(content);
        return sb.toString();
    }

    @Override
    public boolean matches(String query) {
        if (query == null || query.isBlank()) return true;
        String q = query.toLowerCase();
        return getTitle().toLowerCase().contains(q)
                || content.toLowerCase().contains(q)
                || priority.name().toLowerCase().contains(q)
                || getTags().stream().anyMatch(t -> t.toLowerCase().contains(q));
    }

    @Override
    public String getSummary() {
        String status = isOverdue() ? "OVERDUE" : "Due";
        return String.format("[%s: %s] %s - %s", priority, status, dueDate.format(DUE_FORMAT),
                (content.length() > 50 ? content.substring(0, 47) + "..." : content));
    }
}
