package com.notes.repository;

import com.notes.model.AbstractNote;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface contract for Note persistence.
 * Demonstrates Abstraction and Dependency Inversion.
 */
public interface NoteRepository {

    /**
     * Persists or updates a note.
     */
    AbstractNote save(AbstractNote note);

    /**
     * Finds a note by its unique identifier.
     */
    Optional<AbstractNote> findById(String id);

    /**
     * Retrieves all notes in storage.
     */
    List<AbstractNote> findAll();

    /**
     * Deletes a note by its unique identifier.
     * @return true if note was found and deleted, false otherwise
     */
    boolean deleteById(String id);

    /**
     * Returns total count of notes.
     */
    long count();

    /**
     * Deletes all notes (primarily for testing and resets).
     */
    void deleteAll();
}
