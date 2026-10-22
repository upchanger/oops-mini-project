# AGENTS.md

> **AI Coding Agent Guidelines & Context for Spring Boot Web-Based Java OOP Note-Making Application**

This file provides context, architectural constraints, conventions, and operational workflows for any AI coding agent working in this repository.

---

## 1. Project Overview & Architecture

- **Objective**: Build an enterprise-grade, extensible Note-Making Application in **Java 21** using **Spring Boot** that demonstrates mastery of **Object-Oriented Programming (OOP)**, clean architecture, and modern user experience.
- **Full-Stack Architecture**:
  - **Backend (Spring Boot & Java 21)**:
    - Domain models (`TextNote`, `ChecklistNote`, `EncryptedNote`, `ReminderNote`).
    - Creational factory (`NoteFactory`) for decoupled instantiation.
    - Pluggable search and sort strategies (`SearchStrategy`, `SortStrategy`).
    - Repository layer (`NoteRepository`, `FileNoteRepository`) with thread-safe JSON persistence.
    - REST Controllers (`NoteController`) exposing clean JSON API endpoints (`/api/notes`, `/api/tags`, etc.).
  - **Frontend (Web Application)**:
    - Located in `src/main/resources/static/` (`index.html`, `style.css`, `app.js`).
    - Automatically served by Spring Boot at `http://localhost:8080`.
    - Crafted according to [`frontend-design`](file:///c:/Users/dhanv/Desktop/VS%20code/oops%20mini%20project/skills.md) principles (slate theme, curated tokens, active verbs, <80ch reading width, interactive progress bars, PIN unlocking dialog).

---

## 2. Core Architectural & OOP Rules

All code contributions must strictly adhere to these Object-Oriented principles:

### A. Encapsulation
- All class fields **must be `private`**.
- Provide accessors (`getters`) and mutators (`setters`) only when needed.
- Enforce validation in constructors and setters (e.g., non-empty titles, valid dates, valid checklist states).
- Protect mutable collections (e.g., return `Collections.unmodifiableList(...)` or defensive copies).
- Timestamps (`createdAt`, `updatedAt`) must not be arbitrarily mutable.

### B. Inheritance
- The base class `AbstractNote` contains common attributes (`id`, `title`, `createdAt`, `updatedAt`, `tags`) and template methods.
- Specialized note types extend `AbstractNote` and introduce only state and behaviors unique to their variant.

### C. Polymorphism
- Define abstract/polymorphic contracts in `AbstractNote` such as `render()`, `matches(String query)`, and `getSummary()`.
- Use interface polymorphism for storage (`NoteRepository`), searching (`SearchStrategy`), and exporting (`Exportable`).
- Never use cascading `if (note instanceof TextNote) ... else if ...` checks when polymorphic method dispatch can solve the problem.

### D. Abstraction & Dependency Inversion (SOLID)
- High-level services (`NoteService`) must depend strictly on interfaces (`NoteRepository`, `SearchStrategy`), not concrete implementations.
- Leverage Spring's Dependency Injection to inject interfaces rather than concrete classes.
- Adhere to the Single Responsibility Principle: Models hold state and domain logic, Repositories handle persistence, Services orchestrate business logic, and Controllers handle HTTP requests and JSON translation.

---

## 3. Directory & Package Structure

```
c:\Users\dhanv\Desktop\VS code\oops mini project\
 ├── pom.xml                     # Maven build descriptor (Java 21, Spring Boot 4)
 ├── mvnw, mvnw.cmd              # Maven Wrapper
 ├── .mvn/                       # Maven Wrapper configuration
 ├── src/
 │    ├── main/
 │    │    ├── java/com/notes/
 │    │    │    ├── NotesApplication.java       # Spring Boot Main Entry Point
 │    │    │    ├── model/                      # Domain Models (AbstractNote, TextNote, ChecklistNote, EncryptedNote, ReminderNote, TodoItem)
 │    │    │    ├── factory/                    # NoteFactory
 │    │    │    ├── repository/                 # NoteRepository interface & FileNoteRepository
 │    │    │    ├── service/                    # NoteService, ExportService
 │    │    │    ├── strategy/                   # SearchStrategy, SortStrategy implementations
 │    │    │    ├── controller/                 # NoteController (REST API)
 │    │    │    ├── dto/                        # Request/Response DTOs
 │    │    │    └── exception/                  # Custom exceptions & GlobalExceptionHandler
 │    │    └── resources/
 │    │         ├── application.properties      # Port & persistence configurations
 │    │         └── static/                     # Web Frontend (index.html, style.css, app.js)
 │    └── test/
 │         └── java/com/notes/                  # Unit and Integration Tests
 ├── data/                                      # Local persistent storage (data/notes.json)
 ├── skills.md                                  # Detailed project skills and design standards
 ├── AGENTS.md                                  # This instructions file
 └── README.md                                  # Project documentation
```

---

## 4. Environment & Tooling

- **Java Version**: OpenJDK 21 LTS (Temurin-21).
- **Build & Run via Maven Wrapper (`mvnw.cmd`)**:
  ```powershell
  # Compile and run automated tests
  .\mvnw.cmd clean test

  # Run the Spring Boot Web Application
  .\mvnw.cmd spring-boot:run
  ```
  Then navigate to `http://localhost:8080`.
- **Dependencies**: Managed through `pom.xml` via Maven Wrapper.

---

## 5. UI Design Guidelines (`frontend-design` Standard)

When designing the web interface in `src/main/resources/static/`, adhere to:
1. **Curated Token Palette**: Dark slate `#0F172A`, card surface `#1E293B`, indigo accent `#6366F1`, sage green success `#10B981`, warm coral warning `#F43F5E`, muted text `#94A3B8`.
2. **Typography & Readability**: Limit line length to < 80 characters for note text. Clean, modern typography.
3. **Active Voice & Microcopy**: Use clear, informative action verbs ("Create Note", "Mark Complete", "Unlock Note", "Export Markdown").
4. **Structural Purpose**: Dynamic checklist progress meters, tag pill filters, search query highlighting.

---

## 6. How AI Agents Should Work on This Repository

1. **Before Modifying**: Consult [skills.md](file:///c:/Users/dhanv/Desktop/VS%20code/oops%20mini%20project/skills.md) and review existing models to preserve architectural consistency.
2. **When Writing Code**:
   - Always place new classes in their respective package under `src/main/java/com/notes/`.
   - Include meaningful JavaDoc comments on public interfaces and abstract methods.
   - Use custom exceptions (`NoteNotFoundException`, `ValidationException`, `InvalidPinException`) mapped via `@ControllerAdvice`.
3. **Verification**:
   - Always verify code compiles and tests pass using `.\mvnw.cmd clean test`.
