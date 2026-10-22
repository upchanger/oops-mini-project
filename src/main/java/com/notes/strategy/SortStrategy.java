package com.notes.strategy;

import com.notes.model.AbstractNote;
import com.notes.model.Priority;
import com.notes.model.ReminderNote;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Strategy contract for sorting note collections.
 */
public interface SortStrategy {

    List<AbstractNote> sort(List<AbstractNote> notes);

    // Common built-in sorting strategies
    SortStrategy BY_UPDATED_DESC = notes -> {
        List<AbstractNote> copy = new ArrayList<>(notes);
        copy.sort(Comparator.comparing(AbstractNote::getUpdatedAt).reversed());
        return copy;
    };

    SortStrategy BY_CREATED_DESC = notes -> {
        List<AbstractNote> copy = new ArrayList<>(notes);
        copy.sort(Comparator.comparing(AbstractNote::getCreatedAt).reversed());
        return copy;
    };

    SortStrategy BY_TITLE_ASC = notes -> {
        List<AbstractNote> copy = new ArrayList<>(notes);
        copy.sort(Comparator.comparing(AbstractNote::getTitle, String.CASE_INSENSITIVE_ORDER));
        return copy;
    };

    SortStrategy BY_PRIORITY = notes -> {
        List<AbstractNote> copy = new ArrayList<>(notes);
        copy.sort((n1, n2) -> {
            Priority p1 = (n1 instanceof ReminderNote r) ? r.getPriority() : Priority.LOW;
            Priority p2 = (n2 instanceof ReminderNote r) ? r.getPriority() : Priority.LOW;
            // Higher priority enum ordinal first (HIGH > MEDIUM > LOW)
            int priorityCompare = Integer.compare(p2.ordinal(), p1.ordinal());
            if (priorityCompare != 0) return priorityCompare;
            return n2.getUpdatedAt().compareTo(n1.getUpdatedAt());
        });
        return copy;
    };

    static SortStrategy fromString(String strategyName) {
        if (strategyName == null) return BY_UPDATED_DESC;
        return switch (strategyName.toLowerCase().trim()) {
            case "created" -> BY_CREATED_DESC;
            case "title" -> BY_TITLE_ASC;
            case "priority" -> BY_PRIORITY;
            default -> BY_UPDATED_DESC;
        };
    }
}
