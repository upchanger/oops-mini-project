package com.notes.dto;

import com.notes.model.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Clean presentation DTO returned to client/frontend.
 */
public class NoteResponse {

    private String id;
    private String title;
    private NoteType type;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Set<String> tags;
    private String summary;
    private String content;

    // Checklist-specific fields
    private List<TodoItem> items;
    private Double progressPercentage;
    private Integer completedCount;
    private Integer totalCount;

    // Reminder-specific fields
    private LocalDateTime dueDate;
    private Priority priority;
    private Boolean overdue;

    // Encrypted-specific fields
    private Boolean locked;

    public static NoteResponse fromNote(AbstractNote note) {
        NoteResponse dto = new NoteResponse();
        dto.id = note.getId();
        dto.title = note.getTitle();
        dto.type = note.getType();
        dto.createdAt = note.getCreatedAt();
        dto.updatedAt = note.getUpdatedAt();
        dto.tags = note.getTags();
        dto.summary = note.getSummary();

        switch (note.getType()) {
            case TEXT -> {
                TextNote textNote = (TextNote) note;
                dto.content = textNote.getContent();
            }
            case CHECKLIST -> {
                ChecklistNote checklistNote = (ChecklistNote) note;
                dto.items = checklistNote.getItems();
                dto.progressPercentage = checklistNote.getProgressPercentage();
                dto.completedCount = checklistNote.getCompletedCount();
                dto.totalCount = checklistNote.getTotalCount();
                dto.content = checklistNote.render();
            }
            case ENCRYPTED -> {
                dto.locked = true;
                dto.content = "[Encrypted Content - Enter PIN to view]";
            }
            case REMINDER -> {
                ReminderNote reminderNote = (ReminderNote) note;
                dto.content = reminderNote.getContent();
                dto.dueDate = reminderNote.getDueDate();
                dto.priority = reminderNote.getPriority();
                dto.overdue = reminderNote.isOverdue();
            }
        }
        return dto;
    }

    public String getId() { return id; }
    public String getTitle() { return title; }
    public NoteType getType() { return type; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Set<String> getTags() { return tags; }
    public String getSummary() { return summary; }
    public String getContent() { return content; }
    public List<TodoItem> getItems() { return items; }
    public Double getProgressPercentage() { return progressPercentage; }
    public Integer getCompletedCount() { return completedCount; }
    public Integer getTotalCount() { return totalCount; }
    public LocalDateTime getDueDate() { return dueDate; }
    public Priority getPriority() { return priority; }
    public Boolean getOverdue() { return overdue; }
    public Boolean getLocked() { return locked; }
}
