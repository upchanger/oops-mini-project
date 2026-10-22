package com.notes.strategy;

import com.notes.model.AbstractNote;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Full-text search strategy relying on polymorphic method dispatch on AbstractNote.matches().
 */
@Component("contentSearchStrategy")
@Primary
public class ContentSearchStrategy implements SearchStrategy {

    @Override
    public List<AbstractNote> search(List<AbstractNote> notes, String criteria) {
        if (notes == null) return Collections.emptyList();
        if (criteria == null || criteria.isBlank()) return notes;

        return notes.stream()
                .filter(note -> note.matches(criteria))
                .toList();
    }
}
