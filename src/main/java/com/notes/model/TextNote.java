package com.notes.model;

import java.time.LocalDateTime;
import java.util.Set;

/**
 * Standard text and markdown note implementation.
 */
public class TextNote extends AbstractNote {

    private String content;

    public TextNote(String id, String title, String content, LocalDateTime createdAt, LocalDateTime updatedAt, Set<String> tags) {
        super(id, title, createdAt, updatedAt, tags);
        this.content = (content == null) ? "" : content;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = (content == null) ? "" : content;
        touch();
    }

    public int getWordCount() {
        if (content == null || content.trim().isEmpty()) {
            return 0;
        }
        return content.trim().split("\\s+").length;
    }

    public int getCharacterCount() {
        return content == null ? 0 : content.length();
    }

    @Override
    public NoteType getType() {
        return NoteType.TEXT;
    }

    @Override
    public String render() {
        return content;
    }

    @Override
    public boolean matches(String query) {
        if (query == null || query.isBlank()) return true;
        String q = query.toLowerCase();
        return getTitle().toLowerCase().contains(q)
                || content.toLowerCase().contains(q)
                || getTags().stream().anyMatch(t -> t.toLowerCase().contains(q));
    }

    @Override
    public String getSummary() {
        if (content.length() <= 120) {
            return content;
        }
        return content.substring(0, 117) + "...";
    }
}
