package com.notes.dto;

import java.util.Set;

/**
 * DTO for updating an existing note's title, content, pin, or tags.
 */
public class UpdateNoteRequest {

    private String title;
    private String content;
    private String pin;
    private Set<String> tags;

    public UpdateNoteRequest() {
    }

    public UpdateNoteRequest(String title, String content, String pin, Set<String> tags) {
        this.title = title;
        this.content = content;
        this.pin = pin;
        this.tags = tags;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getPin() {
        return pin;
    }

    public void setPin(String pin) {
        this.pin = pin;
    }

    public Set<String> getTags() {
        return tags;
    }

    public void setTags(Set<String> tags) {
        this.tags = tags;
    }
}
