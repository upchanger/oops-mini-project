package com.notes.exception;

/**
 * Thrown when domain validation fails (e.g. empty title, invalid date, malformed items).
 */
public class ValidationException extends NoteApplicationException {

    public ValidationException(String message) {
        super(message);
    }
}
