package com.notes.dto;

import com.notes.model.NoteType;
import com.notes.model.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

/**
 * Request payload for creating a new note.
 */
public class CreateNoteRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Note type is required")
    private NoteType type;

    private String content;
    private List<String> checklistItems;
    private String pin;
    private LocalDateTime dueDate;
    private Priority priority;
    private Set<String> tags;

    public CreateNoteRequest() {
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public NoteType getType() {
        return type;
    }

    public void setType(NoteType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public List<String> getChecklistItems() {
        return checklistItems;
    }

    public void setChecklistItems(List<String> checklistItems) {
        this.checklistItems = checklistItems;
    }

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }

    public LocalDateTime getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDateTime dueDate) {
        this.dueDate = dueDate;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public Set<String> getTags() {
        return tags;
    }

    public void setTags(Set<String> tags) {
        this.tags = tags;
    }
}
