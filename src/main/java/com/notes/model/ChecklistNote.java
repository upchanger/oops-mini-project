package com.notes.model;

import com.notes.exception.ValidationException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

/**
 * Checklist / Todo note variant composing a collection of TodoItem objects.
 * Demonstrates Composition over Inheritance and encapsulation of list modifications.
 */
public class ChecklistNote extends AbstractNote {

    private final List<TodoItem> items;

    public ChecklistNote(String id, String title, List<TodoItem> items, LocalDateTime createdAt, LocalDateTime updatedAt, Set<String> tags) {
        super(id, title, createdAt, updatedAt, tags);
        this.items = new ArrayList<>();
        if (items != null) {
            this.items.addAll(items);
        }
    }

    public List<TodoItem> getItems() {
        return Collections.unmodifiableList(items);
    }

    public void addItem(String text) {
        items.add(new TodoItem(text));
        touch();
    }

    public void addItem(TodoItem item) {
        if (item == null) {
            throw new ValidationException("Todo item cannot be null.");
        }
        items.add(item);
        touch();
    }

    public void toggleItem(int index) {
        if (index < 0 || index >= items.size()) {
            throw new ValidationException("Invalid checklist item index: " + index);
        }
        items.get(index).toggle();
        touch();
    }

    public void removeItem(int index) {
        if (index < 0 || index >= items.size()) {
            throw new ValidationException("Invalid checklist item index: " + index);
        }
        items.remove(index);
        touch();
    }

    public int getTotalCount() {
        return items.size();
    }

    public int getCompletedCount() {
        return (int) items.stream().filter(TodoItem::isCompleted).count();
    }

    public double getProgressPercentage() {
        if (items.isEmpty()) {
            return 0.0;
        }
        return ((double) getCompletedCount() / items.size()) * 100.0;
    }

    @Override
    public NoteType getType() {
        return NoteType.CHECKLIST;
    }

    @Override
    public String render() {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < items.size(); i++) {
            sb.append(i + 1).append(". ").append(items.get(i).toString()).append("\n");
        }
        return sb.toString();
    }

    @Override
    public boolean matches(String query) {
        if (query == null || query.isBlank()) return true;
        String q = query.toLowerCase();
        return getTitle().toLowerCase().contains(q)
                || items.stream().anyMatch(item -> item.getText().toLowerCase().contains(q))
                || getTags().stream().anyMatch(t -> t.toLowerCase().contains(q));
    }

    @Override
    public String getSummary() {
        int total = getTotalCount();
        int completed = getCompletedCount();
        return String.format("%d of %d completed (%.0f%%)", completed, total, getProgressPercentage());
    }
}
