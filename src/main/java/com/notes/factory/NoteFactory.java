package com.notes.factory;

import com.notes.model.*;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Creational Factory Method Pattern implementation.
 * Decouples note instantiation and validation from service and client layers.
 */
public final class NoteFactory {

    private NoteFactory() {
        // Prevent instantiation
    }

    public static TextNote createTextNote(String title, String content, Set<String> tags) {
        String id = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        return new TextNote(id, title, content, now, now, tags);
    }

    public static ChecklistNote createChecklistNote(String title, List<String> items, Set<String> tags) {
        String id = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        List<TodoItem> todoItems = new ArrayList<>();
        if (items != null) {
            for (String itemText : items) {
                if (itemText != null && !itemText.trim().isEmpty()) {
                    todoItems.add(new TodoItem(itemText.trim()));
                }
            }
        }
        return new ChecklistNote(id, title, todoItems, now, now, tags);
    }

    public static EncryptedNote createEncryptedNote(String title, String content, String pin, Set<String> tags) {
        String id = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        return new EncryptedNote(id, title, content, pin, now, now, tags);
    }

    public static ReminderNote createReminderNote(String title, String content, LocalDateTime dueDate, Priority priority, Set<String> tags) {
        String id = UUID.randomUUID().toString();
        LocalDateTime now = LocalDateTime.now();
        return new ReminderNote(id, title, content, dueDate, priority, now, now, tags);
    }
}
