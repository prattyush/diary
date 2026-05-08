# Project Review

**Date:** 2026-05-08  
**Reviewer:** Claude (Sonnet 4.6)  
**Scope:** Full project review — planning, architecture, design decisions, and implementation readiness  
**Based on:** `docs/planning.md` (current revision)

---

## Summary

The planning document has been updated and resolves several earlier ambiguities (frontend framework chosen, Docker Compose added, JWT confirmed, per-user templates clarified, database wipe-on-restart removed). The project is now in a cleaner state for implementation. The remaining issues below are worth addressing before or during development to avoid rework.

---

## 1. Requirements Gaps

### 1.1 Tags Are Mentioned but Never Specified

The project description says *"Users can also tag some pre-defined tags to their diary entries"* but tags do not appear anywhere in the feature list for any phase (Basic, Backend, Login, or AWS). There is no spec for:
- Who defines the tags ("pre-defined" by whom?)
- Whether users can create their own tags or only select from a fixed list
- How tags are stored and displayed
- Which phase tags are implemented in

**Recommendation:** Either add a Tags section to the feature list for the appropriate phase, or remove the mention from the description if tags are out of scope.

### 1.2 Basic Phase Contradicts "Frontend-Only MVP"

The Basic phase is described as *"an MVP of just the frontend"* but item 4 says *"images need to be stored on disk."* Disk storage requires a backend — a pure frontend cannot write to the server's filesystem. This is a contradiction.

**Recommendation:** One of two options:
- Accept that the Basic phase requires at minimum a lightweight file-serving backend, OR
- For the Basic phase only, store images in the browser (e.g. `IndexedDB`) as a temporary measure and migrate to disk storage in the Backend phase.

### 1.3 No Spec for Maximum Image Count or Size

There is no limit defined for how many images a user can attach per day, or the maximum file size. These matter for both UX (upload progress, error messages) and infrastructure (disk/S3 costs).

**Recommendation:** Define sensible defaults (e.g. max 10 images per entry, max 10MB per image) and document them so they can be enforced in both frontend validation and backend upload handling.

### 1.4 Frontend Port Not Specified

The technical design specifies the backend at `http://localhost:8700` but does not specify a port for the frontend (Next.js defaults to 3000). This should be explicit in the Docker Compose configuration.

---

## 2. Technical Design Issues

### 2.1 Next.js + "Serve via FastAPI" Are Incompatible

The technical design says *"Consider statically building the frontend and serving it via FastAPI."* This conflicts with Next.js. Next.js has its own Node.js server and features that depend on it (image optimisation, server-side rendering, API routes). While Next.js supports a static export (`output: 'export'` in `next.config.js`), this disables:
- Server-side rendering and `getServerSideProps`
- Next.js Image Optimization API
- API Routes (though these won't be used since FastAPI handles the API)

Static export is usable for this project if SSR is not needed, but it must be a deliberate choice. Alternatively, run Next.js on its own Node process (port 3000) alongside FastAPI (port 8700), with Docker Compose managing both services.

**Recommendation:** Choose one approach and document it:
- **Option A:** Next.js static export (`next export`), built artefacts served by FastAPI's `StaticFiles` — single container, simpler deployment, no SSR.
- **Option B:** Next.js Node server + FastAPI — two containers in Docker Compose, full Next.js features, nginx or Traefik as a reverse proxy (or configure CORS).

Option A is simpler and sufficient for this project's scope.

### 2.2 SQLite File and Uploads Directory Need Docker Volumes

The planning doc no longer says the database is recreated on every start (good), but it also does not specify how the SQLite file and image uploads directory are persisted across container restarts. Without explicit Docker volumes or bind mounts, both will be lost when the container is removed.

**Recommendation:** The `docker-compose.yml` should define named volumes (or bind mounts) for:
- The SQLite database file (e.g. `/app/data/diary.db`)
- The image uploads directory (e.g. `/app/uploads`)

### 2.3 Image Uniqueness — Suffix Strategy Is Fragile

The Backend phase says *"if any duplicates modify them by adding a suitable suffix."* Checking for collisions and appending suffixes adds complexity and has race conditions under concurrent uploads. A simpler and more robust approach is to always generate a unique filename on upload (UUID + original extension), storing the original filename in the database for display purposes.

**Recommendation:** Use `uuid4()` to name uploaded files: `<uuid>.<ext>`. No collision detection needed.

### 2.4 Password Storage — "Passed Encrypted If Required" Is Still Vague

The Login phase says *"store the user and password in a consistent storage and passed encrypted if required."* The phrase "if required" should be removed — password hashing is always required, not optional. Passwords must be hashed with a secure algorithm (bcrypt or argon2) before storage, never stored in plaintext or reversibly encrypted.

**Recommendation:** Replace the phrase with: *"Passwords must be hashed using bcrypt before storage. Plaintext passwords are never persisted."*

### 2.5 JWT Secret Key Management Not Addressed

JWT tokens require a secret signing key. There is no mention of how this key is generated, stored, or rotated. Hardcoding it in source code is a security risk; it should be supplied via environment variable and excluded from version control.

**Recommendation:** Add a `.env.example` to the project root documenting all required environment variables, including `JWT_SECRET_KEY`. The actual `.env` file is already excluded by `.gitignore`.

### 2.6 S3 Migration — Existing Local Images Not Addressed

The AWS phase adds S3 storage, but there is no mention of what happens to images already stored on disk from the Backend phase. When S3 is enabled, existing local images will not be accessible unless they are migrated.

**Recommendation:** For the AWS phase, decide whether to:
- Migrate existing images to S3 as a one-time operation, OR
- Support a hybrid mode (serve local images for old entries, S3 for new ones)

The simpler path is migration; a migration script should be part of the AWS phase deliverable.

---

## 3. Development Process

### 3.1 The "7-Step Feature-Dev Process" Is Not Defined

The development process references *"the feature-dev 7 step process"* but this process is not documented anywhere in the project. Any developer or automated agent following these instructions cannot execute step 1.

**Recommendation:** Define the 7 steps explicitly in `docs/planning.md` or in a dedicated `docs/feature-dev-process.md`.

### 3.2 No Test Strategy

The process requires "thoroughly test the feature with unit tests and integration tests" but there is no guidance on:
- Backend test framework (pytest is standard for FastAPI; `httpx` for async route testing)
- Frontend test framework (Jest + React Testing Library for unit tests; Playwright or Cypress for E2E)
- Whether integration tests hit a real SQLite database or a mock
- No CI pipeline configured

**Recommendation:** At minimum, add a testing section to `planning.md` naming the chosen frameworks.

### 3.3 GitHub Remote Not Configured

The dev process requires submitting PRs, but the repository has no remote configured (there is only one local commit). PRs cannot be created without a GitHub remote.

**Recommendation:** Push the repository to GitHub before starting feature development.

---

## 4. Minor Issues

| # | Issue | Severity |
|---|-------|----------|
| 4.1 | `README.md` is a placeholder (`# diary`) with no project description or setup instructions | Low |
| 4.2 | `backend/`, `frontend/`, `scripts/` directories are empty and thus not tracked by git | Low |
| 4.3 | No `.env.example` documenting required environment variables (JWT secret, S3 credentials) | Medium |
| 4.4 | Scripts directory should include a `scripts/reset.sh` or similar for wiping the database in development, since there is no longer an automatic wipe | Low |
| 4.5 | `.gitignore` has many entries irrelevant to this stack (Django, Flask, Sphinx, Jupyter) — harmless but adds noise | Info |

---

## 5. What Has Been Resolved Since the Previous Review

The following issues from the earlier review have been addressed in the updated planning doc:

- **Frontend framework chosen:** React + Next.js
- **Docker Compose added:** "Create docker compose as you seem fit"
- **Database wipe-on-restart removed:** No longer states the database is recreated on every start
- **Templates clarified:** Per-user, not global or admin-defined
- **Auth token strategy specified:** JWT
- **Delete vs Reset clarified:** Only "delete" remains; "reset" removed
- **AWS/S3 phase added:** New phase for S3 image storage

---

## 6. Prioritised Recommendations

1. **Resolve the Basic phase contradiction** — frontend-only cannot write to disk; decide if a minimal backend is included or if browser storage is used temporarily.
2. **Choose and document the Next.js serving strategy** (static export via FastAPI vs. two-container setup) — this affects the entire Docker and deployment architecture.
3. **Add Docker volumes** for SQLite and uploads directory to the Docker Compose config.
4. **Define the 7-step feature-dev process** — it is referenced but not written.
5. **Push the repo to GitHub** to enable the PR workflow.
6. **Add `.env.example`** with all required environment variables documented.
7. **Resolve and specify the tags feature** — it is mentioned in the description but absent from all feature phases.
8. **Replace vague password wording** with an explicit bcrypt requirement.
