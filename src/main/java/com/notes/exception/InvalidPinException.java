package com.notes.exception;

/**
 * Thrown when an incorrect PIN is provided to access an encrypted note.
 */
public class InvalidPinException extends NoteApplicationException {

    public InvalidPinException(String message) {
        super(message);
    }
}
