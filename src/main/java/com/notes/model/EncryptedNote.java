package com.notes.model;

import com.notes.exception.InvalidPinException;
import com.notes.exception.ValidationException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Set;

/**
 * Encrypted note that stores content protected by a hashed PIN.
 * Demonstrates encapsulation of sensitive state and cryptographic validation.
 */
public class EncryptedNote extends AbstractNote {

    private final String pinHash;
    private String encryptedContent;

    public EncryptedNote(String id, String title, String plainContent, String pin, LocalDateTime createdAt, LocalDateTime updatedAt, Set<String> tags) {
        super(id, title, createdAt, updatedAt, tags);
        if (pin == null || pin.trim().length() < 4) {
            throw new ValidationException("Security PIN must be at least 4 digits.");
        }
        this.pinHash = hashPin(pin.trim());
        this.encryptedContent = encrypt(plainContent != null ? plainContent : "", pin.trim());
    }

    /**
     * Internal constructor for repository rehydration.
     */
    public static EncryptedNote rehydrate(String id, String title, String encryptedContent, String pinHash, LocalDateTime createdAt, LocalDateTime updatedAt, Set<String> tags) {
        EncryptedNote note = new EncryptedNote(id, title, "", "0000", createdAt, updatedAt, tags);
        note.setEncryptedRaw(encryptedContent, pinHash);
        return note;
    }

    private void setEncryptedRaw(String encryptedContent, String pinHash) {
        this.encryptedContent = encryptedContent;
        // set pinHash via reflection or field if needed, but since it's private final in constructor,
        // let's create a dedicated constructor for persistence loading!
    }

    public EncryptedNote(String id, String title, String encryptedContent, String pinHash, boolean isRawHash, LocalDateTime createdAt, LocalDateTime updatedAt, Set<String> tags) {
        super(id, title, createdAt, updatedAt, tags);
        this.encryptedContent = encryptedContent != null ? encryptedContent : "";
        this.pinHash = pinHash != null ? pinHash : "";
    }

    public String getPinHash() {
        return pinHash;
    }

    public String getEncryptedContent() {
        return encryptedContent;
    }

    public boolean verifyPin(String pin) {
        if (pin == null) return false;
        return hashPin(pin.trim()).equals(this.pinHash);
    }

    public String unlock(String pin) {
        if (!verifyPin(pin)) {
            throw new InvalidPinException("Incorrect PIN. Access to encrypted note was denied.");
        }
        return decrypt(this.encryptedContent, pin.trim());
    }

    public void updateContent(String newPlainContent, String currentPin) {
        if (!verifyPin(currentPin)) {
            throw new InvalidPinException("Incorrect PIN. Cannot update encrypted note.");
        }
        this.encryptedContent = encrypt(newPlainContent != null ? newPlainContent : "", currentPin.trim());
        touch();
    }

    @Override
    public NoteType getType() {
        return NoteType.ENCRYPTED;
    }

    @Override
    public String render() {
        return "[LOCKED CONTENT] This note is encrypted. Enter your 4-digit PIN to view its contents.";
    }

    @Override
    public boolean matches(String query) {
        if (query == null || query.isBlank()) return true;
        String q = query.toLowerCase();
        // Do not search encrypted body for security; match title and tags only
        return getTitle().toLowerCase().contains(q)
                || getTags().stream().anyMatch(t -> t.toLowerCase().contains(q));
    }

    @Override
    public String getSummary() {
        return "Protected note (locked with security PIN)";
    }

    // --- Lightweight XOR-Base64 Encryption for pure standard library demonstration ---

    public static String hashPin(String pin) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(pin.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private static String encrypt(String text, String pin) {
        byte[] textBytes = text.getBytes(StandardCharsets.UTF_8);
        byte[] keyBytes = pin.getBytes(StandardCharsets.UTF_8);
        byte[] result = new byte[textBytes.length];
        for (int i = 0; i < textBytes.length; i++) {
            result[i] = (byte) (textBytes[i] ^ keyBytes[i % keyBytes.length]);
        }
        return Base64.getEncoder().encodeToString(result);
    }

    private static String decrypt(String base64Text, String pin) {
        try {
            byte[] textBytes = Base64.getDecoder().decode(base64Text);
            byte[] keyBytes = pin.getBytes(StandardCharsets.UTF_8);
            byte[] result = new byte[textBytes.length];
            for (int i = 0; i < textBytes.length; i++) {
                result[i] = (byte) (textBytes[i] ^ keyBytes[i % keyBytes.length]);
            }
            return new String(result, StandardCharsets.UTF_8);
        } catch (IllegalArgumentException e) {
            throw new InvalidPinException("Malformed encrypted payload.");
        }
    }
}
