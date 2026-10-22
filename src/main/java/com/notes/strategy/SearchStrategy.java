package com.notes.strategy;

import com.notes.model.AbstractNote;

import java.util.List;

/**
 * Strategy interface for searching and filtering notes.
 * Demonstrates the Strategy Pattern (behavioral OOP pattern).
 */
public interface SearchStrategy {

    /**
     * Filters the given notes list according to a search criteria string.
     */
    List<AbstractNote> search(List<AbstractNote> notes, String criteria);
}
