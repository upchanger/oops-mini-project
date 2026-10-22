package com.notes;

import com.notes.model.*;
import com.notes.repository.FileNoteRepository;
import com.notes.service.NoteService;
import com.notes.strategy.ContentSearchStrategy;
import com.notes.strategy.TagSearchStrategy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Service & Strategy Integration Tests")
class NoteServiceTests {

    private NoteService noteService;
    private FileNoteRepository repository;

    @BeforeEach
    void setUp(@TempDir Path tempDir) {
        Path tempStorage = tempDir.resolve("test-notes.json");
        repository = new FileNoteRepository(tempStorage.toString());
        repository.init();

        noteService = new NoteService(
                repository,
                new ContentSearchStrategy(),
                new TagSearchStrategy()
        );
    }

    @Test
    @DisplayName("Strategy Pattern: Search filters notes by title, content, and tags correctly")
    void testSearchStrategies() {
        noteService.createTextNote("Java Design Patterns", "Learn Factory and Strategy", Set.of("backend", "oop"));
        noteService.createChecklistNote("Grocery List", List.of("Milk", "Coffee beans"), Set.of("personal"));
        noteService.createReminderNote("Doctor Appointment", "Dentist checkup", LocalDateTime.now().plusDays(1), Priority.HIGH, Set.of("health"));

        // Search by title keyword
        List<AbstractNote> patternResults = noteService.getNotes("Design", null, "updated");
        assertEquals(1, patternResults.size());
        assertEquals("Java Design Patterns", patternResults.get(0).getTitle());

        // Search by content keyword
        List<AbstractNote> coffeeResults = noteService.getNotes("Coffee", null, "updated");
        assertEquals(1, coffeeResults.size());
        assertEquals("Grocery List", coffeeResults.get(0).getTitle());

        // Filter by tag
        List<AbstractNote> backendNotes = noteService.getNotes(null, "backend", "updated");
        assertEquals(1, backendNotes.size());
        assertEquals("Java Design Patterns", backendNotes.get(0).getTitle());
    }

    @Test
    @DisplayName("Persistence: Created notes survive repository re-initialization")
    void testFilePersistenceRoundtrip(@TempDir Path tempDir) {
        Path tempFile = tempDir.resolve("persist-notes.json");
        FileNoteRepository repo1 = new FileNoteRepository(tempFile.toString());
        repo1.init();

        NoteService service1 = new NoteService(repo1, new ContentSearchStrategy(), new TagSearchStrategy());
        TextNote note = service1.createTextNote("Persistent Title", "Persistent Body", Set.of("persist"));

        // Create second repository pointing to the same file
        FileNoteRepository repo2 = new FileNoteRepository(tempFile.toString());
        repo2.init();

        assertTrue(repo2.findById(note.getId()).isPresent());
        AbstractNote loaded = repo2.findById(note.getId()).get();
        assertEquals("Persistent Title", loaded.getTitle());
        assertEquals("Persistent Body", ((TextNote) loaded).getContent());
        assertTrue(loaded.hasTag("persist"));
    }
}
