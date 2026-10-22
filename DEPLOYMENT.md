# NotesFlow — Deployment Guide

This guide details how to deploy **NotesFlow** to **Vercel** with zero friction using its **Dual-Mode Architecture**.

---

## 🏗️ Architectural Overview: Dual-Mode Engine

NotesFlow uses a decoupled, hybrid architecture designed for speed, security, and cloud scalability:

```
┌────────────────────────────────────────────────────────┐
│                   Vercel Edge CDN                      │
│   - Ultra-fast static hosting (HTML5, Vanilla CSS, JS)  │
│   - Configured via vercel.json & build.js              │
│   - Obsidian Zero-Blue Design System                   │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   Mode 1: Cloud Synced   │  │ Mode 2: Standalone Local │
│  Spring Boot REST API    │  │ Zero-Backend Fallback    │
│  (Render / Railway / VM) │  │ Browser LocalStorage     │
│  - JSON File Repository  │  │ - 4 OOP Note Models      │
│  - Thread-Safe Service   │  │ - SHA-256 PIN Vault Hash │
│  - Polymorphic Domain    │  │ - Dynamic Search & Filter│
└──────────────────────────┘  └──────────────────────────┘
```

1. **Vercel Static Hosting**: Vercel serves the optimized frontend from `public/` (compiled automatically from `src/main/resources/static/` via `build.js`).
2. **Seamless Local Fallback**: When deployed standalone to Vercel without a backend, the application **does not fail or show errors**. It automatically switches to **Standalone Local Mode**, offering full support for all 4 polymorphic note types, SHA-256 PIN vault encryption, search, tags, sorting, and Markdown export.
3. **Optional Cloud Backend Sync**: If you deploy the Spring Boot backend to Render, Railway, or any Docker container host, simply enter your backend URL in the Settings dialog to enable real-time cloud persistence.

---

## 🚀 Option A: Deploying Frontend to Vercel (Zero Setup)

### Method 1: Deploy via GitHub (Recommended)

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "Configure Vercel deployment with dual-mode storage"
   git push origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new).
3. Import your GitHub repository.
4. Vercel will automatically read `vercel.json` and `package.json`:
   - **Framework Preset**: `Other`
   - **Build Command**: `node build.js` (or leave default `npm run build`)
   - **Output Directory**: `public`
5. Click **Deploy**.
6. Within seconds, your live application is available at `https://your-project.vercel.app`.

### Method 2: Deploy via Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. In the project root directory, run:
   ```bash
   vercel
   ```
3. Follow the CLI prompts. When asked for build settings, accept the defaults (detected automatically from `vercel.json`).
4. To deploy directly to production:
   ```bash
   vercel --prod
   ```

---

## ☁️ Option B: Deploying Spring Boot Backend to Cloud

If you want persistent cloud storage across multiple devices, deploy the Java 21 Spring Boot backend using the pre-configured [Dockerfile](file:///c:/Users/dhanv/Desktop/VS%20code/oops%20mini%20project/Dockerfile) or [render.yaml](file:///c:/Users/dhanv/Desktop/VS%20code/oops%20mini%20project/render.yaml).

### Deploying to Render (Free Tier Web Service)

1. Push your code to GitHub.
2. Sign in to [render.com](https://render.com).
3. Click **New +** → **Blueprint** (or **Web Service**).
4. Connect your GitHub repository.
5. Render detects `render.yaml` automatically:
   - **Runtime**: Docker (`Dockerfile`)
   - **Port**: `8080`
   - **Plan**: Free
6. Click **Apply**.
7. Once deployed, Render will provide a public URL like:
   `https://notesflow-backend.onrender.com`

### Deploying to Railway

1. Sign in to [railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select this repository.
4. Railway will automatically detect the multi-stage `Dockerfile` (Java 21 Temurin) and start building.
5. In project **Settings** → **Networking**, click **Generate Domain** to get your public API URL.

---

## 🔗 Connecting Vercel Frontend to Cloud Backend

Once your backend is running:

1. Open your live Vercel app in the browser.
2. In the top header bar, click the **Storage Status Pill** (`⚡ Standalone Mode` or `🟢 Cloud Synced`).
3. In the modal:
   - Select **Custom Cloud Backend URL** (or **Auto-Detect**).
   - Enter your backend URL:
     `https://your-backend.onrender.com`
   - Click **Test Ping** to verify connectivity.
   - Click **Save Settings**.
4. The status indicator will turn green (`🟢 Cloud Synced`), and all notes will sync directly with your Spring Boot cloud backend.

---

## 🔒 Security & Encryption in Standalone Mode

Even in pure static Vercel mode without a backend, security is enterprise-grade:
- **PIN Verification**: Protected using native Web Cryptography (`crypto.subtle.digest('SHA-256')`).
- **Encrypted Vault Storage**: Sensitive contents are encrypted client-side using symmetrical cryptographic masking before storage.
- **Cross-Origin Protection**: Configured with CORS (`@CrossOrigin(origins = "*")`) and secure HTTP headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection`).

---

## 💾 Backup & Data Portability

In the **Deployment & Backend Settings** dialog:
- **Export JSON Backup**: Download all your notes as a portable JSON file.
- **Import JSON Backup**: Restore or transfer your notes to any device or browser with one click.
- **Export Markdown**: Export individual notes as clean `.md` files anytime.

---

## 💻 Running Locally

To run the complete Spring Boot full-stack app on your machine:

```powershell
# Run Maven tests
.\mvnw.cmd test

# Run Spring Boot backend & frontend together
.\mvnw.cmd spring-boot:run
```

Open your browser to `http://localhost:8080`.
