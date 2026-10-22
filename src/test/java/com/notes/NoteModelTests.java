package com.notes;

import com.notes.exception.InvalidPinException;
import com.notes.exception.ValidationException;
import com.notes.factory.NoteFactory;
import com.notes.model.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Object-Oriented Domain Model Tests")
class NoteModelTests {

    @Test
    @DisplayName("Encapsulation: Blank note title must throw ValidationException")
    void testBlankTitleThrowsValidationException() {
        assertThrows(ValidationException.class, () -> 
            NoteFactory.createTextNote("   ", "Sample Content", Set.of("test"))
        );
        assertThrows(ValidationException.class, () -> 
            NoteFactory.createTextNote(null, "Sample Content", Set.of("test"))
        );
    }

    @Test
    @DisplayName("Encapsulation: Tags collection must be unmodifiable")
    void testTagsCollectionImmutability() {
        TextNote note = NoteFactory.createTextNote("Architecture", "Clean Code", Set.of("java", "oop"));
        Set<String> tags = note.getTags();
        assertThrows(UnsupportedOperationException.class, () -> tags.add("illegal"));
    }

    @Test
    @DisplayName("Inheritance & Polymorphism: Subtypes render distinct content")
    void testPolymorphicRendering() {
        AbstractNote textNote = NoteFactory.createTextNote("Text Title", "Body Text", Set.of());
        AbstractNote checklistNote = NoteFactory.createChecklistNote("Tasks", List.of("Task 1", "Task 2"), Set.of());

        assertEquals(NoteType.TEXT, textNote.getType());
        assertEquals("Body Text", textNote.render());

        assertEquals(NoteType.CHECKLIST, checklistNote.getType());
        assertTrue(checklistNote.render().contains("Task 1"));
    }

    @Test
    @DisplayName("Composition: ChecklistNote correctly calculates progress percentage")
    void testChecklistProgressCalculation() {
        ChecklistNote checklist = NoteFactory.createChecklistNote(
                "Sprint Backlog",
                List.of("Setup repo", "Write models", "Run tests", "Deploy"),
                Set.of("dev")
        );

        assertEquals(0.0, checklist.getProgressPercentage());
        assertEquals(4, checklist.getTotalCount());
        assertEquals(0, checklist.getCompletedCount());

        checklist.toggleItem(0);
        checklist.toggleItem(1);

        assertEquals(50.0, checklist.getProgressPercentage());
        assertEquals(2, checklist.getCompletedCount());
    }

    @Test
    @DisplayName("Security & Encapsulation: EncryptedNote requires valid PIN to unlock")
    void testEncryptedNoteUnlock() {
        String secretText = "Top secret credentials: API_KEY_998877";
        EncryptedNote note = NoteFactory.createEncryptedNote("Vault", secretText, "4321", Set.of("secret"));

        // Content must be masked in standard render
        assertTrue(note.render().contains("[LOCKED CONTENT]"));

        // Wrong PIN must throw InvalidPinException
        assertThrows(InvalidPinException.class, () -> note.unlock("0000"));
        assertThrows(InvalidPinException.class, () -> note.unlock("1234"));

        // Correct PIN must decrypt exact text
        String unlocked = note.unlock("4321");
        assertEquals(secretText, unlocked);
    }

    @Test
    @DisplayName("Reminder Note: Detects overdue state correctly")
    void testReminderOverdueDetection() {
        LocalDateTime pastDate = LocalDateTime.now().minusHours(2);
        LocalDateTime futureDate = LocalDateTime.now().plusDays(2);

        ReminderNote overdueNote = NoteFactory.createReminderNote("Submit Assignment", "Upload zip", pastDate, Priority.HIGH, Set.of("urgent"));
        ReminderNote upcomingNote = NoteFactory.createReminderNote("Team Sync", "Weekly review", futureDate, Priority.MEDIUM, Set.of("work"));

        assertTrue(overdueNote.isOverdue());
        assertFalse(upcomingNote.isOverdue());
    }
}
