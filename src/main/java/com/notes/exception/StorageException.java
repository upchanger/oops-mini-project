package com.notes.exception;

/**
 * Thrown when persistence read or write operations encounter an I/O failure.
 */
public class StorageException extends NoteApplicationException {

    public StorageException(String message, Throwable cause) {
        super(message, cause);
    }

    public StorageException(String message) {
        super(message);
    }
}
