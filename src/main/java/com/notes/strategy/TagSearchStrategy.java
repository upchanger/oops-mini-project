package com.notes.strategy;

import com.notes.model.AbstractNote;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Filters notes that contain a specific tag.
 */
@Component("tagSearchStrategy")
public class TagSearchStrategy implements SearchStrategy {

    @Override
    public List<AbstractNote> search(List<AbstractNote> notes, String criteria) {
        if (notes == null) return Collections.emptyList();
        if (criteria == null || criteria.isBlank()) return notes;

        String tagToMatch = criteria.trim().toLowerCase();
        // Remove leading '#' if user supplied it
        if (tagToMatch.startsWith("#")) {
            tagToMatch = tagToMatch.substring(1);
        }

        final String finalTag = tagToMatch;
        return notes.stream()
                .filter(note -> note.hasTag(finalTag))
                .toList();
    }
}
