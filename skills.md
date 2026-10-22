# Project Skills & Engineering Standards Manual

This document is the single source of truth for all engineering skills, design patterns, coding standards, and user-experience guidelines applied across the **Java OOP Note-Making Application**. Every AI agent and developer working on this codebase must strictly follow these instructions.

---

# TABLE OF CONTENTS
1. [Skill: Frontend Design (Aesthetic & UX Standard)](#1-skill-frontend-design)
2. [Skill: Java Object-Oriented Design (Core OOP Mastery)](#2-skill-java-object-oriented-design)
3. [Skill: SOLID & Clean Code Principles](#3-skill-solid--clean-code-principles)
4. [Skill: Gang of Four (GoF) Design Patterns](#4-skill-gang-of-four-gof-design-patterns)
5. [Skill: Java 21 Coding Standards & Idioms](#5-skill-java-21-coding-standards--idioms)
6. [Skill: OOP Polymorphism & Composition Best Practices](#6-skill-oop-polymorphism--composition-best-practices)
7. [Skill Verification & Quality Checklist](#7-skill-verification--quality-checklist)

---

# 1. Skill: Frontend Design

> **Origin**: `anthropics/skills@frontend-design`  
> **Application**: Interactive Console UI (CLI) & Desktop GUI (Swing)

### A. Ground the Design in the Subject Matter
- The application is a focused, distraction-free **Note & Thought Management System**.
- Every visual element must directly serve note organization, clarity of reading, and effortless task execution.
- Avoid generic SaaS boilerplate; make deliberate, opinionated choices about layout, spacing, and hierarchy.

### B. Curated Color Palette (Token System)
Avoid harsh primary colors (raw `#FF0000`, `#00FF00`, `#0000FF`). Establish a cohesive semantic token palette:
- **Base Canvas**: Slate dark `#1E1E2E` or calm off-white `#F8F9FA` for clean contrast.
- **Surface / Card**: `#282A36` (CLI: background tint / ANSI muted grey) for distinct section boundaries.
- **Primary Accent**: Muted indigo/violet `#7AA2F7` or `#6C5CE7` for active selections, focused borders, and primary actions.
- **Success / Complete**: Sage green `#9ECE6A` or `#55EFC4` for completed checklist items.
- **Warning / Overdue**: Amber/Warm Coral `#F7768E` or `#E17055` for overdue reminders and high-priority notes.
- **Muted Text / Metadata**: `#787C99` or `#636E72` for timestamps, tags, and secondary hints.

### C. Typography & Text Hierarchy
- **Line Length**: Keep note reading width strictly under **80 characters** to ensure optimal reading ergonomics.
- **Heading Scale**: Establish distinct hierarchy:
  - App Title / Screen Header: Dominant, clear, purposeful.
  - Section / Category: Subtle weight contrast.
  - Body Text: Clean, legible font (Inter, Roboto, or standard Monospace for CLI).
- **Avoid Typographic Tell Clichés**:
  - Do NOT randomly uppercase entire words or labels (`STATUS` $\rightarrow$ `Status`).
  - Do NOT bold/italicize random words inside sentences.
  - Do NOT append artificial arrow markers (`→`) or fake numbered bullets (`01 / 02`) unless representing a strict chronological sequence.

### D. Restraint & Self-Critique
- **Spend boldness in one place**: Let the active note viewer or main dashboard card be the focal point; keep sidebars, search bars, and menus quiet and disciplined.
- Eliminate decorative borders that do not group related information.
- Provide clear visual feedback for every user interaction (selection, save, delete, search match).

### E. User-Centric Microcopy & Empty States
- **Active Verbs**: Buttons and menu choices must use direct actions:
  - Use `"Create Note"`, `"Mark as Done"`, `"Export to Markdown"`, `"Set Reminder"`.
  - Never use ambiguous terms like `"Submit"`, `"Process"`, or `"Go"`.
- **Informative Empty States**: Empty screens must guide the user on what to do next:
  - *Poor*: `"No notes."`
  - *Required*: `"No notes found in this category. Press [N] or click 'New Note' to create your first note."`
- **Constructive Errors**: State exactly what went wrong and how to fix it:
  - *Poor*: `"Error: Invalid PIN."`
  - *Required*: `"Incorrect PIN. The note remains locked. Please enter your 4-digit security PIN."`

---

# 2. Skill: Java Object-Oriented Design

> **Origin**: `jabrena/plinth@121-java-object-oriented-design`  
> **Core Pillars**: Encapsulation, Inheritance, Polymorphism, Abstraction

### A. Encapsulation Rules
1. **Private by Default**: Every class attribute must be `private`. No public or protected fields are permitted (except `public static final` constants).
2. **Strict Validation**: All constructors and mutators must validate incoming arguments:
   - Titles cannot be `null` or blank (throw `ValidationException`).
   - Dates cannot be in the past when creating future reminders.
   - Checklist items must not contain blank descriptions.
3. **Immutability of Metadata**:
   - `id` (UUID) must be final and immutable.
   - `createdAt` is assigned at instantiation and cannot be altered.
   - `updatedAt` is updated automatically upon note modification via internal lifecycle methods.
4. **Defensive Copying**:
   - Never return direct references to internal mutable collections (`List`, `Set`, `Map`).
   - Always return `Collections.unmodifiableList(...)` or a defensive copy (`new ArrayList<>(items)`).

### B. Inheritance Rules
1. **Base Class Contract (`AbstractNote`)**:
   - Encapsulates shared attributes: `id`, `title`, `createdAt`, `updatedAt`, `tags`.
   - Defines template methods and abstract hooks (`render()`, `matches(query)`).
2. **Subtype Specialization**:
   - `TextNote`: Introduces `content` (Markdown / plain text).
   - `ChecklistNote`: Introduces `List<TodoItem>` and item completion methods.
   - `EncryptedNote`: Introduces password/PIN hashing, encrypted payload, and `unlock(pin)`.
   - `ReminderNote`: Introduces `dueDate`, `priority`, and overdue check methods.
3. **No Redundant Overrides**: Subclasses must not duplicate superclass behavior; reuse `super` wherever applicable.

### C. Polymorphism Rules
1. **Dynamic Method Dispatch**:
   - Note rendering, searching, and exporting must rely on polymorphism.
   - **Prohibited**: Cascading `instanceof` checks:
     ```java
     // STRICTLY FORBIDDEN:
     if (note instanceof TextNote) { ... }
     else if (note instanceof ChecklistNote) { ... }
     ```
   - **Required**:
     ```java
     // REQUIRED:
     String output = note.render();
     boolean match = note.matches(searchQuery);
     ```
2. **Interface Polymorphism**:
   - Repositories (`NoteRepository`), Search strategies (`SearchStrategy`), and Exporters (`ExportStrategy`) are defined as interfaces.

### D. Abstraction Rules
- Expose clear, high-level contracts. Clients interacting with `NoteService` should not know whether data is saved in memory or on the filesystem.

---

# 3. Skill: SOLID & Clean Code Principles

> **Origin**: `asyrafhussin/agent-skills@clean-code-principles`  
> **Standards**: Maintainability, Testability, Decoupling

| Principle | Implementation Instruction |
| :--- | :--- |
| **Single Responsibility (SRP)** | - `Note`: Holds note state & domain logic.<br>- `NoteRepository`: Handles serialization & persistence.<br>- `NoteService`: Orchestrates business operations.<br>- `UI`: Handles user rendering and input only. |
| **Open / Closed (OCP)** | Adding a new note type (e.g., `AudioNote` or `CodeSnippetNote`) must require adding a new subclass of `AbstractNote` without modifying existing note classes. |
| **Liskov Substitution (LSP)** | Any subtype of `AbstractNote` must be substitutable wherever `AbstractNote` is expected, without breaking behavior or throwing unexpected `UnsupportedOperationException`. |
| **Interface Segregation (ISP)** | Keep interfaces focused. Avoid fat interfaces. Prefer `SearchStrategy`, `SortStrategy`, `Exportable` over one monolithic interface. |
| **Dependency Inversion (DIP)** | `NoteService` must depend on the `NoteRepository` interface, never directly on `FileNoteRepository`. Use constructor injection. |

---

# 4. Skill: Gang of Four (GoF) Design Patterns

> **Origin**: `rtk-ai/rtk@design-patterns`

### Pattern 1: Factory Method (`NoteFactory`)
- Centralize note creation logic.
- Validate note type, assign unique IDs, set creation timestamps, and initialize specific structures (e.g., empty checklist for `ChecklistNote`).
```java
public class NoteFactory {
    public static AbstractNote createTextNote(String title, String content, Set<String> tags);
    public static ChecklistNote createChecklistNote(String title, List<String> initialItems, Set<String> tags);
    public static EncryptedNote createEncryptedNote(String title, String content, String pin, Set<String> tags);
    public static ReminderNote createReminderNote(String title, String content, LocalDateTime dueDate, Priority priority, Set<String> tags);
}
```

### Pattern 2: Strategy Pattern (`SearchStrategy` & `SortStrategy`)
- Provide interchangeable algorithms for querying and sorting notes:
  - `TitleSearchStrategy`: Matches query against note title.
  - `TagSearchStrategy`: Filters notes containing specific tags.
  - `ContentSearchStrategy`: Searches full-text contents polymorphic across note types.
  - `DateRangeSearchStrategy`: Filters notes created or modified within a date window.
  - `SortStrategy`: Sort by `TitleAlphabetical`, `LastModified`, `CreatedDate`, `Priority`.

### Pattern 3: Repository Pattern (`NoteRepository`)
- Define an explicit interface:
```java
public interface NoteRepository {
    AbstractNote save(AbstractNote note);
    Optional<AbstractNote> findById(String id);
    List<AbstractNote> findAll();
    boolean deleteById(String id);
    long count();
}
```
- Implementations:
  - `InMemoryNoteRepository`: For fast unit testing.
  - `FileNoteRepository`: For persistent local storage using clean text/JSON serialization.

### Pattern 4: Template Method Pattern
- `AbstractNote` provides the skeleton of note display:
```java
public final String displaySummary() {
    StringBuilder sb = new StringBuilder();
    sb.append(renderHeader());
    sb.append(renderBody()); // Abstract hook implemented by subclasses
    sb.append(renderFooter());
    return sb.toString();
}
```

---

# 5. Skill: Java 21 Coding Standards & Idioms

> **Origin**: `affaan-m/ecc@java-coding-standards`

1. **Modern Language Features**:
   - Use `java.time.LocalDateTime` and `java.time.format.DateTimeFormatter` (avoid legacy `java.util.Date` and `SimpleDateFormat`).
   - Use `java.nio.file.Path` and `java.nio.file.Files` for clean, safe file I/O operations.
   - Use Java Streams & Lambdas for functional filtering, mapping, and reduction.
   - Use Pattern Matching for `switch` and `instanceof` where appropriate for concise type-guards.
   - Use `java.util.Optional<T>` for methods that may return no result (e.g., `findById`). Never return `null` from repository queries.
2. **Naming Conventions**:
   - Classes & Interfaces: `PascalCase` (`TextNote`, `SearchStrategy`).
   - Methods & Variables: `camelCase` (`findById`, `isOverdue`).
   - Constants & Enums: `UPPER_SNAKE_CASE` (`DEFAULT_PAGE_SIZE`, `Priority.HIGH`).
   - Packages: All lowercase, domain-driven (`com.notes.model`, `com.notes.repository`).
3. **Custom Exception Hierarchy**:
   - Root: `NoteApplicationException` (extends `RuntimeException` or checked `Exception`).
   - Subtypes:
     - `NoteNotFoundException`: Thrown when an ID does not exist.
     - `ValidationException`: Thrown when input data fails domain constraints.
     - `InvalidPinException`: Thrown on incorrect PIN attempts for encrypted notes.
     - `StorageException`: Thrown on I/O failures during note persistence.

---

# 6. Skill: OOP Polymorphism & Composition Best Practices

> **Origin**: `luckys/agent-skills@oop-best-practices` & `thebushidocollective/han@oop-polymorphism`

1. **Favor Composition Over Deep Inheritance**:
   - Do not create excessively deep inheritance trees (e.g., `Note` $\rightarrow$ `TextNote` $\rightarrow$ `EncryptedTextNote` $\rightarrow$ `ReminderEncryptedTextNote`).
   - Instead, combine distinct behaviors through composition (e.g., `ChecklistNote` has a `List<TodoItem>`, notes have a `Set<String>` of tags).
2. **Defensive Immutability for Values**:
   - `TodoItem` should be encapsulated with dedicated methods like `toggleCompletion()`, `markDone()`, preventing uncontrolled external state mutation.
3. **Clean Interface Contracts**:
   - Polymorphic methods must have clear, unified signatures and contracts documented via JavaDoc.

---

# 7. Skill Verification & Quality Checklist

Before completing any task or pull request, verify against this checklist:
- [ ] **Encapsulation**: Are all fields `private`? Are defensive copies returned for collections?
- [ ] **Validation**: Are constructors validating parameters against null/blank values?
- [ ] **Polymorphism**: Is rendering and searching dispatching polymorphically without cascading `instanceof`?
- [ ] **Decoupling**: Does `NoteService` depend exclusively on `NoteRepository` interface?
- [ ] **UI Aesthetics**: Does the CLI or GUI adhere to semantic colors, <80 char width, active verbs, and informative empty states?
- [ ] **Persistence**: Do notes persist across restarts via `FileNoteRepository`?
- [ ] **Compilation**: Does `javac` compile all files with 0 errors and 0 warnings?
