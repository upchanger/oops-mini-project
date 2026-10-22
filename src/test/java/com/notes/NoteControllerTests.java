package com.notes;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.notes.dto.CreateNoteRequest;
import com.notes.dto.UnlockRequest;
import com.notes.model.NoteType;
import com.notes.model.Priority;
import com.notes.repository.NoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DisplayName("REST API Controller Integration Tests")
class NoteControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private NoteRepository noteRepository;

    @BeforeEach
    void cleanUp() {
        noteRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/notes creates a Text Note and returns 201 Created")
    void testCreateTextNote() throws Exception {
        CreateNoteRequest req = new CreateNoteRequest();
        req.setTitle("Spring Boot REST Note");
        req.setType(NoteType.TEXT);
        req.setContent("Testing REST API integration");
        req.setTags(Set.of("spring", "java"));

        mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Spring Boot REST Note"))
                .andExpect(jsonPath("$.type").value("TEXT"))
                .andExpect(jsonPath("$.content").value("Testing REST API integration"));
    }

    @Test
    @DisplayName("POST /api/notes creates a Checklist Note and POST /api/notes/{id}/toggle toggles item")
    void testCreateAndToggleChecklist() throws Exception {
        CreateNoteRequest req = new CreateNoteRequest();
        req.setTitle("Release Checklist");
        req.setType(NoteType.CHECKLIST);
        req.setChecklistItems(List.of("Run tests", "Build jar", "Deploy"));
        req.setTags(Set.of("devops"));

        String response = mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("CHECKLIST"))
                .andExpect(jsonPath("$.totalCount").value(3))
                .andExpect(jsonPath("$.completedCount").value(0))
                .andReturn().getResponse().getContentAsString();

        String noteId = objectMapper.readTree(response).get("id").asText();

        // Toggle item at index 0
        mockMvc.perform(post("/api/notes/" + noteId + "/toggle?index=0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedCount").value(1))
                .andExpect(jsonPath("$.progressPercentage").value(closeTo(33.33, 0.5)));
    }

    @Test
    @DisplayName("Encrypted Note: POST /api/notes/{id}/unlock authenticates PIN")
    void testUnlockEncryptedNote() throws Exception {
        CreateNoteRequest req = new CreateNoteRequest();
        req.setTitle("Secret Credentials");
        req.setType(NoteType.ENCRYPTED);
        req.setContent("Database Password: Password123!");
        req.setPin("9876");
        req.setTags(Set.of("security"));

        String response = mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.locked").value(true))
                .andReturn().getResponse().getContentAsString();

        String noteId = objectMapper.readTree(response).get("id").asText();

        // Unauthorized PIN attempt
        mockMvc.perform(post("/api/notes/" + noteId + "/unlock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UnlockRequest("0000"))))
                .andExpect(status().isUnauthorized());

        // Correct PIN attempt
        mockMvc.perform(post("/api/notes/" + noteId + "/unlock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UnlockRequest("9876"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UNLOCKED"))
                .andExpect(jsonPath("$.content").value("Database Password: Password123!"));
    }

    @Test
    @DisplayName("GET /api/notes/{id}/export downloads Markdown file")
    void testExportNote() throws Exception {
        CreateNoteRequest req = new CreateNoteRequest();
        req.setTitle("Exportable Design");
        req.setType(NoteType.TEXT);
        req.setContent("Architecture blueprint in Markdown");
        req.setTags(Set.of("architecture"));

        String response = mockMvc.perform(post("/api/notes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        String noteId = objectMapper.readTree(response).get("id").asText();

        mockMvc.perform(get("/api/notes/" + noteId + "/export?format=markdown"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", containsString("Exportable_Design.md")))
                .andExpect(content().string(containsString("# Exportable Design")));
    }
}
