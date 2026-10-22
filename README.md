# NotesFlow — Java 21 OOP Note-Making Application

An enterprise-grade, full-stack Note-Making Application built in **Java 21 (Temurin LTS)** and **Spring Boot 3.4**, designed to showcase mastery of **Object-Oriented Programming (OOP)**, SOLID architecture, and modern UX design principles.

---

## 🏛️ Object-Oriented Architecture & GoF Patterns

| OOP Principle / Pattern | Implementation in Project |
| :--- | :--- |
| **Encapsulation** | Strict `private` class fields, constructor parameter validation, immutable UUIDs & timestamps, defensive copying of tag collections (`Collections.unmodifiableSet`). |
| **Inheritance** | Base hierarchy rooted in [`AbstractNote`](src/main/java/com/notes/model/AbstractNote.java), extended by `TextNote`, `ChecklistNote`, `EncryptedNote`, and `ReminderNote`. |
| **Polymorphism** | Runtime method overriding for `render()`, `matches(query)`, and `getSummary()`. Elimination of cascading `instanceof` check ladders. |
| **Abstraction & DIP** | [`NoteService`](src/main/java/com/notes/service/NoteService.java) depends strictly on the [`NoteRepository`](src/main/java/com/notes/repository/NoteRepository.java) interface, injected via Spring IoC. |
| **Factory Method Pattern** | Centralized instantiation and validation via [`NoteFactory`](src/main/java/com/notes/factory/NoteFactory.java). |
| **Strategy Pattern** | Interchangeable query algorithms ([`SearchStrategy`](src/main/java/com/notes/strategy/SearchStrategy.java)) and sort algorithms ([`SortStrategy`](src/main/java/com/notes/strategy/SortStrategy.java)). |
| **Repository Pattern** | Decoupled thread-safe JSON persistence ([`FileNoteRepository`](src/main/java/com/notes/repository/FileNoteRepository.java)) saving to `data/notes.json`. |
| **Template Method Pattern** | Base `displaySummary()` skeleton method formatting metadata while delegating content rendering to polymorphic hooks. |

---

## 🚀 Quick Start

### Prerequisites
- **Java 21 LTS** (`Temurin-21` or compatible OpenJDK 21)
- No global Maven installation required (bundled Maven Wrapper `mvnw.cmd` is used).

### 1. Run the Application
In your terminal (PowerShell or Bash), run:
```powershell
.\mvnw.cmd spring-boot:run
```
Once started, navigate in your browser to:
```
http://localhost:8080
```

### 2. Run Automated Tests
Execute all unit and integration tests:
```powershell
.\mvnw.cmd clean test
```

---

## 💻 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/notes` | List notes (supports `?query=...`, `?tag=...`, `?sort=updated|created|title|priority`) |
| `POST` | `/api/notes` | Create a new note (`TEXT`, `CHECKLIST`, `ENCRYPTED`, or `REMINDER`) |
| `GET` | `/api/notes/{id}` | Get note details by ID |
| `DELETE`| `/api/notes/{id}` | Delete a note |
| `POST` | `/api/notes/{id}/toggle?index={n}` | Toggle a checklist item |
| `POST` | `/api/notes/{id}/items` | Add a new task item to a checklist note |
| `POST` | `/api/notes/{id}/unlock` | Authenticate 4-digit PIN and retrieve decrypted note body |
| `GET` | `/api/notes/{id}/export?format={fmt}`| Download note as `markdown`, `html`, or `text` |
| `GET` | `/api/tags` | List all unique tags across notes |
| `GET` | `/api/stats` | Retrieve application metrics and category breakdowns |

---

## 🌐 Cloud & Vercel Deployment

NotesFlow supports **Zero-Setup Vercel Deployment** with a **Dual-Mode Storage Engine**:
- **Frontend on Vercel**: Hosted via Vercel Edge CDN with static bundling (`build.js`, `vercel.json`).
- **Zero-Backend Local Mode**: Runs smoothly right out of the box on Vercel without requiring a server, using browser local storage with full polymorphic OOP features, SHA-256 PIN hashing, search, and Markdown export.
- **Spring Boot Cloud Backend**: Easily deployable to Render, Railway, or Docker using the included `Dockerfile` and `render.yaml`.

📖 **See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step instructions.**

---

## 🎨 Frontend Design Guidelines
The web frontend is located in `src/main/resources/static/` and adheres to the **`frontend-design`** standard:
- **Curated Slate Token Palette**: Canvas `#0F172A`, Surface Cards `#1E293B`, Indigo Accent `#6366F1`, Sage Green `#10B981`, Warm Coral `#F43F5E`.
- **Optimal Reading Width**: Note body line lengths strictly bounded to `< 80` characters.
- **Active Verbs & Microcopy**: Clear action labels (`Create Note`, `Mark Complete`, `Unlock Note`, `Export Markdown`).
