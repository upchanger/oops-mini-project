package com.notes.exception;

/**
 * Thrown when a requested note ID is not found.
 */
public class NoteNotFoundException extends NoteApplicationException {

    public NoteNotFoundException(String id) {
        super("Note not found with ID: " + id);
    }
}
