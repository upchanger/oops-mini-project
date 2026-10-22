package com.notes.controller;

import com.notes.dto.CreateNoteRequest;
import com.notes.dto.NoteResponse;
import com.notes.dto.UnlockRequest;
import com.notes.exception.ValidationException;
import com.notes.model.AbstractNote;
import com.notes.service.ExportService;
import com.notes.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * REST API controller exposing endpoints for the Note-Making Web Application.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class NoteController {

    private final NoteService noteService;
    private final ExportService exportService;

    public NoteController(NoteService noteService, ExportService exportService) {
        this.noteService = noteService;
        this.exportService = exportService;
    }

    @GetMapping("/notes")
    public List<NoteResponse> getNotes(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false, defaultValue = "updated") String sort) {
        return noteService.getNotes(query, tag, sort).stream()
                .map(NoteResponse::fromNote)
                .toList();
    }

    @GetMapping("/notes/{id}")
    public NoteResponse getNoteById(@PathVariable String id) {
        return NoteResponse.fromNote(noteService.getNoteById(id));
    }

    @PostMapping("/notes")
    public ResponseEntity<NoteResponse> createNote(@Valid @RequestBody CreateNoteRequest req) {
        AbstractNote createdNote = switch (req.getType()) {
            case TEXT -> noteService.createTextNote(req.getTitle(), req.getContent(), req.getTags());
            case CHECKLIST -> noteService.createChecklistNote(req.getTitle(), req.getChecklistItems(), req.getTags());
            case ENCRYPTED -> noteService.createEncryptedNote(req.getTitle(), req.getContent(), req.getPin(), req.getTags());
            case REMINDER -> {
                if (req.getDueDate() == null) {
                    throw new ValidationException("Reminder note requires a valid due date.");
                }
                yield noteService.createReminderNote(req.getTitle(), req.getContent(), req.getDueDate(), req.getPriority(), req.getTags());
            }
        };
        return ResponseEntity.status(HttpStatus.CREATED).body(NoteResponse.fromNote(createdNote));
    }

    @DeleteMapping("/notes/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable String id) {
        noteService.deleteNote(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/notes/{id}/toggle")
    public ResponseEntity<NoteResponse> toggleChecklistItem(
            @PathVariable String id,
            @RequestParam int index) {
        noteService.toggleChecklistItem(id, index);
        return ResponseEntity.ok(NoteResponse.fromNote(noteService.getNoteById(id)));
    }

    @PostMapping("/notes/{id}/items")
    public ResponseEntity<NoteResponse> addChecklistItem(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String itemText = body.get("text");
        if (itemText == null || itemText.trim().isEmpty()) {
            throw new ValidationException("Item text cannot be empty.");
        }
        noteService.addChecklistItem(id, itemText);
        return ResponseEntity.ok(NoteResponse.fromNote(noteService.getNoteById(id)));
    }

    @PostMapping("/notes/{id}/unlock")
    public ResponseEntity<Map<String, String>> unlockNote(
            @PathVariable String id,
            @Valid @RequestBody UnlockRequest req) {
        String decryptedContent = noteService.unlockNote(id, req.getPin());
        return ResponseEntity.ok(Map.of(
                "id", id,
                "content", decryptedContent,
                "status", "UNLOCKED"
        ));
    }

    @GetMapping("/notes/{id}/export")
    public ResponseEntity<String> exportNote(
            @PathVariable String id,
            @RequestParam(defaultValue = "markdown") String format) {
        AbstractNote note = noteService.getNoteById(id);
        String safeTitle = note.getTitle().replaceAll("[^a-zA-Z0-9_-]", "_");

        return switch (format.toLowerCase()) {
            case "html" -> {
                String content = exportService.exportToHtml(note);
                yield ResponseEntity.ok()
                        .contentType(MediaType.TEXT_HTML)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeTitle + ".html\"")
                        .body(content);
            }
            case "text", "txt" -> {
                String content = exportService.exportToPlainText(note);
                yield ResponseEntity.ok()
                        .contentType(MediaType.TEXT_PLAIN)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeTitle + ".txt\"")
                        .body(content);
            }
            default -> {
                String content = exportService.exportToMarkdown(note);
                yield ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType("text/markdown"))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + safeTitle + ".md\"")
                        .body(content);
            }
        };
    }

    @GetMapping("/tags")
    public Set<String> getTags() {
        return noteService.getAllTags();
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        return noteService.getStatistics();
    }
}
