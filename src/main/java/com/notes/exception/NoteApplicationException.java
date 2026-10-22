package com.notes.exception;

/**
 * Base root unchecked exception for all Note domain errors.
 */
public class NoteApplicationException extends RuntimeException {

    public NoteApplicationException(String message) {
        super(message);
    }

    public NoteApplicationException(String message, Throwable cause) {
        super(message, cause);
    }
}
