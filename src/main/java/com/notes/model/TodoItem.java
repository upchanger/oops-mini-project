package com.notes.model;

import com.notes.exception.ValidationException;

import java.util.Objects;

/**
 * Encapsulated checklist item composing a ChecklistNote.
 */
public class TodoItem {

    private String text;
    private boolean completed;

    public TodoItem(String text) {
        this(text, false);
    }

    public TodoItem(String text, boolean completed) {
        setText(text);
        this.completed = completed;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        if (text == null || text.trim().isEmpty()) {
            throw new ValidationException("Checklist item text cannot be empty.");
        }
        this.text = text.trim();
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }

    public void toggle() {
        this.completed = !this.completed;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        TodoItem todoItem = (TodoItem) o;
        return completed == todoItem.completed && Objects.equals(text, todoItem.text);
    }

    @Override
    public int hashCode() {
        return Objects.hash(text, completed);
    }

    @Override
    public String toString() {
        return (completed ? "[x] " : "[ ] ") + text;
    }
}
