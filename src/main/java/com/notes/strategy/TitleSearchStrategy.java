package com.notes.strategy;

import com.notes.model.AbstractNote;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Searches notes strictly by title (case-insensitive).
 */
@Component("titleSearchStrategy")
public class TitleSearchStrategy implements SearchStrategy {

    @Override
    public List<AbstractNote> search(List<AbstractNote> notes, String criteria) {
        if (notes == null) return Collections.emptyList();
        if (criteria == null || criteria.isBlank()) return notes;

        String q = criteria.trim().toLowerCase();
        return notes.stream()
                .filter(note -> note.getTitle().toLowerCase().contains(q))
                .toList();
    }
}
