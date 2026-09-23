# Atlas — Project Management & Issue Tracking

A full-stack, Jira-style project management and issue-tracking application, built from scratch with an original UI (not a Jira clone visually — no Jira branding, assets, or copied layout).

> **Note on this build:** this codebase was generated in a sandboxed environment with no internet access, so it has **not** been run against a live PostgreSQL database or bundled by Vite here. Every file has passed a syntax check, but you should run through the checklist in [Post-install verification](#post-install-verification) the first time you set it up. Treat this as a complete, review-ready v1 rather than a battle-tested production deploy.

---

## 1. Features

- **Auth**: register/login/logout, JWT + bcrypt, change password, edit profile. First registered user automatically becomes `ADMIN`.
- **RBAC**: platform roles (`ADMIN`, `PROJECT_MANAGER`, `DEVELOPER`, `TESTER`, `VIEWER`) + per-project roles (`OWNER`, `MANAGER`, `MEMBER`, `VIEWER`), enforced on the backend.
- **Projects**: create/edit/archive, unique project keys (e.g. `PROJ`), membership management.
- **Issues**: full CRUD, types (Task/Bug/Story/Epic/Improvement), priorities, statuses, assignee/reporter, due dates, labels, human-readable keys (`PROJ-14`).
- **Kanban board**: 5-column board (Backlog/To Do/In Progress/In Review/Done) with drag-and-drop, optimistic UI updates, and automatic rollback if the API call fails.
- **Backlog**: unscheduled issues, quick create.
- **Sprints**: create/start/complete/cancel with an enforced state machine (`PLANNED → ACTIVE → COMPLETED`, no illegal transitions).
- **Comments & activity timeline**: per-issue comment thread + auto-logged activity (status changes, assignment, priority, comments, etc.).
- **Notifications**: in-app notification center with unread counts, generated on assignment, status change, comments, sprint start/complete.
- **Search**: global issue search by title/description/status/priority/type/label.
- **Dashboard**: live stats and charts (issues by status/priority/type) pulled from PostgreSQL, "my issues", recent activity, active sprints.
- **Admin panel**: user management (roles, activate/deactivate), platform-wide stats, audit log.
- **Production-leaning security**: helmet, CORS allowlist, rate limiting, input validation, centralized error handling, no password hashes ever returned by the API.

## 2. Technology stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite, React Router 6, Axios, Recharts |
| Backend | Node.js + Express 4 |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT (jsonwebtoken) + bcrypt |
| Validation | express-validator (backend), native form validation (frontend) |
| Styling | Hand-written modern CSS (no UI framework) — custom design tokens, responsive layout |

## 3. Architecture

```
Client (React)  →  Axios  →  REST API (Express)
                               │
                    Route → Middleware → Controller → Service → Repository → Prisma → PostgreSQL
```

- **Routes** only wire HTTP verbs/paths to controllers plus middleware (auth, validation, project access).
- **Controllers** are thin — they parse `req`, call a service, and return a consistent `{ success, data }` / `{ success: false, message }` shape.
- **Services** hold all business logic: authorization rules beyond simple role checks, the sprint state machine, notification/activity side effects.
- **Repositories** are the only place that talk to Prisma directly, so the data-access layer can be swapped or mocked independently of business logic.

## 4. Project structure

```
project-management-app/
├── client/                # React app (Vite)
│   └── src/
│       ├── api/           # Axios service modules, one per resource
│       ├── components/    # common/, layout/, board/, issue/, sprint/, project/
│       ├── contexts/      # AuthContext, ToastContext
│       ├── hooks/         # useApi (loading/error/empty handling)
│       ├── layouts/       # AppLayout (sidebar + topbar shell)
│       ├── pages/         # one file per route, incl. pages/Admin/*
│       ├── routes/        # ProtectedRoute
│       └── styles/        # tokens.css (design system), app.css
├── server/                # Express API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── tests/             # Jest unit tests (DB-independent)
│   └── src/
│       ├── config/        # env.js, db.js (Prisma client)
│       ├── middleware/     # auth, authorization, validation, rate limit, errors
│       ├── routes/         # one file per resource + index.js aggregator
│       ├── controllers/
│       ├── services/       # business logic lives here
│       ├── repositories/   # Prisma access only
│       ├── validators/     # express-validator rule sets
│       └── utils/
└── README.md
```

## 5. Requirements

- Node.js 18+ and npm
- PostgreSQL 14+ (local install, Docker container, or a hosted instance like Supabase/Neon/RDS)

## 6. Installation

```bash
# from the project-management-app/ root
npm run install:all
# equivalent to:
#   cd server && npm install
#   cd client && npm install
```

## 7. Environment variables

Copy the example env files and fill in real values:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

**`server/.env`**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API port (default `5000`) |
| `NODE_ENV` | `development` / `production` |
| `CLIENT_URL` | Frontend origin, used for CORS (default `http://localhost:5173`) |
| `JWT_SECRET` | Long random string — **never commit this** |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost factor (default `10`) |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX` | General API rate limiting |

**`client/.env`**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, default `http://localhost:5000/api` |

## 8. PostgreSQL setup

Any of these work — pick one:

**Option A — Docker (fastest):**
```bash
docker run --name pm-app-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=pm_app -p 5432:5432 -d postgres:16
```
Then `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pm_app?schema=public"`.

**Option B — local PostgreSQL install:** create a database and user, then point `DATABASE_URL` at it.

**Option C — hosted (Neon, Supabase, Railway, RDS, etc.):** copy the connection string they give you into `DATABASE_URL`. Most hosted providers require `?sslmode=require` appended.

## 9. Prisma setup, migrations, and seeding

```bash
cd server

# Generate the Prisma client
npm run prisma:generate

# Create and apply the initial migration (also generates the client)
npm run prisma:migrate
# You'll be prompted for a migration name, e.g. "init"

# Seed sample data (users, a project, issues, a sprint, a comment)
npm run seed
```

### Default development users (seed data)

| Email | Password | Role |
|---|---|---|
| `admin@example.com` | `Password123!` | ADMIN |
| `pm@example.com` | `Password123!` | PROJECT_MANAGER |
| `dev@example.com` | `Password123!` | DEVELOPER |
| `tester@example.com` | `Password123!` | TESTER |
| `viewer@example.com` | `Password123!` | VIEWER |

**These are development-only credentials. Never use them in production** — either delete the seeded users or change their passwords before deploying.

## 10. Running the app locally (the part you actually want)

Open **two terminals** from the `project-management-app/` root:

```bash
# Terminal 1 — backend
cd server
npm run dev
# → API listening on http://localhost:5000
# → health check: http://localhost:5000/health
```

```bash
# Terminal 2 — frontend
cd client
npm run dev
# → Vite dev server on http://localhost:5173
```

Then open **http://localhost:5173** in your browser and log in with one of the seeded accounts above (or register a new account — the very first account you register becomes ADMIN).

If you'd rather run both with one command from the root, `npm run dev:server` and `npm run dev:client` (from the root `package.json`) do the same thing — just still in two terminals, since both are long-running processes.

## 11. Post-install verification

Run through this once after setup, in order:

1. `npm run prisma:migrate` completes without errors.
2. `npm run seed` completes and prints the dev credentials.
3. `npm run dev` (server) starts and `GET http://localhost:5000/health` returns `{"success":true,"status":"ok"}`.
4. `npm run dev` (client) starts and the login page renders at `http://localhost:5173`.
5. Log in as `admin@example.com` / `Password123!` — you should land on the Dashboard with real seeded numbers.
6. Open the seeded **Atlas Platform Rebuild** (`PROJ`) project → Board tab → drag a card between columns and confirm it persists after a page refresh.
7. Create a new issue, add a comment, change its status/assignee/priority from the detail page, and confirm the Activity timeline updates.
8. As admin, visit `/admin/users` and toggle a user's active status.
9. Check the terminal running the server for any unhandled errors while you click around.

If anything fails at a given step, it narrows down whether the issue is DB connectivity (steps 1–2), the API (step 3), or the frontend (steps 4+).

## 12. Testing

```bash
cd server
npm test
```

This ships with a small Jest suite covering pure, DB-independent logic (issue-key formatting, password hashing, the sprint status state machine) so it runs without any database setup. For full integration coverage (registration, login, project/issue CRUD, sprint operations end-to-end), point `DATABASE_URL` at a disposable test database and add Supertest-based route tests under `server/tests/` following the same repository → service → controller layering — the architecture is intentionally set up so each layer can be tested in isolation with mocks.

## 13. Production build

**Backend:**
```bash
cd server
npm run prisma:deploy   # applies migrations without prompting (CI/production-safe)
NODE_ENV=production npm start
```

**Frontend:**
```bash
cd client
npm run build            # outputs static files to client/dist
npm run preview          # optional local preview of the production build
```
Serve `client/dist` from any static host (Vercel, Netlify, S3+CloudFront, Nginx, etc.) and set `VITE_API_URL` at build time to your deployed API's URL.

## 14. Deployment notes

- Run the API behind a reverse proxy (Nginx, Caddy, or your platform's built-in one) with HTTPS termination.
- Set a strong, unique `JWT_SECRET` per environment.
- Set `CLIENT_URL` to your real frontend origin so CORS isn't wide open.
- Use a managed PostgreSQL instance with automated backups.
- Run `prisma migrate deploy` (not `migrate dev`) in CI/CD — it's non-interactive and safe for production.
- Consider putting the API behind a process manager (`pm2`) or a container orchestrator; `server.js` already handles `SIGTERM`/`SIGINT` for graceful shutdown.

## 15. API overview

All endpoints are prefixed with `/api`. Auth endpoints aside, every route requires `Authorization: Bearer <token>`.

```
POST   /auth/register              POST   /auth/login
GET    /auth/me                    PUT    /auth/profile
PUT    /auth/password              POST   /auth/logout

GET    /users                      POST   /users            (admin)
GET    /users/:id                  PUT    /users/:id         (admin)
PATCH  /users/:id/status           DELETE /users/:id         (admin)

GET    /projects                   POST   /projects
GET    /projects/:id               PUT    /projects/:id
PATCH  /projects/:id/archive       DELETE /projects/:id
GET    /projects/:id/members       POST   /projects/:id/members
DELETE /projects/:id/members/:userId

GET    /projects/:id/issues        POST   /projects/:id/issues
GET    /projects/:id/board         GET    /projects/:id/backlog
GET    /projects/:id/sprints       POST   /projects/:id/sprints
GET    /projects/:id/labels        POST   /projects/:id/labels

GET    /issues/:id                 PUT    /issues/:id            DELETE /issues/:id
PATCH  /issues/:id/status          PATCH  /issues/:id/assignee   PATCH /issues/:id/priority
GET    /issues/:id/activity        GET    /issues/:id/comments   POST  /issues/:id/comments

PUT    /comments/:id               DELETE /comments/:id

GET    /sprints/:id                PUT    /sprints/:id
POST   /sprints/:id/start          POST   /sprints/:id/complete  POST /sprints/:id/cancel

GET    /notifications               PATCH /notifications/:id/read  PATCH /notifications/read-all
GET    /search/issues
GET    /dashboard

GET    /admin/stats                GET   /admin/audit-logs        GET  /admin/users
```

Response shape is always one of:
```json
{ "success": true, "data": { } }
{ "success": false, "message": "Human readable message", "errors": [ ] }
```

## 16. Troubleshooting

### Email lifecycle notifications

The server sends issue lifecycle email through SMTP and stores each recipient attempt in `EmailNotification`. To enable delivery, set `SMTP_URL` in `server/.env` to the SMTP provider connection URL and set `MAIL_FROM` to a sender address authorized by that provider. The example file includes placeholders; use credentials from your mail provider and restart the API after changing them. Keep SMTP credentials out of source control. When SMTP is not configured, records are saved with `QUEUED` status and no message is delivered; configuring SMTP does not retroactively send queued messages. Successful sends are recorded as `SENT` with `sentAt`, while failures are recorded as `FAILED` with an error. Recipients are looked up from registered issue users and project owners/managers; addresses are not hard-coded.

The current event templates cover issue creation/assignment/reassignment, start, blocked/on-hold/completed status, priority, sprint, and important detail changes. You can inspect records directly in the database `EmailNotification` table. For production, use a verified sender/domain and an authenticated SMTP URL from your mail provider.

| Symptom | Likely cause |
|---|---|
| `Missing required environment variable: DATABASE_URL` on server start | `server/.env` wasn't created from `.env.example`, or the DB isn't reachable |
| `P1001` Prisma error | PostgreSQL isn't running or the connection string/host/port is wrong |
| 401 on every request after login | `JWT_SECRET` changed between issuing and verifying a token — log in again |
| CORS error in the browser console | `CLIENT_URL` in `server/.env` doesn't match the URL the frontend is actually served from |
| Board drag-and-drop doesn't persist | Check the Network tab for the `PATCH /issues/:id/status` call — if it 4xx/5xxs, the card should visibly revert; check server logs for the underlying error |
| `EADDRINUSE` on port 5000 or 5173 | Something else is already using that port — change `PORT` / Vite's `--port`, or stop the other process |

## 17. Known limitations (be upfront about these)

- **Not run end-to-end in this environment.** This was built in a sandbox without internet/database access, so while every file has passed static syntax checks, you are the first to actually `npm install` and boot it — budget time for the small fixes that any first real run tends to surface.
- **File attachments**: the `Attachment` data model and API shape are in place, but actual file upload/storage (e.g. multer + S3/disk) isn't wired up yet — deliberately, per the spec's instruction to design the architecture cleanly without insecure file handling rather than bolt on an unreviewed upload path.
- **User mentions in comments** are stored as plain text; parsing `@mentions` into notifications isn't implemented.
- **Saved filters** have working CRUD endpoints but no dedicated frontend page yet (Search page covers ad hoc filtering).
- **Refresh tokens** aren't implemented — sessions rely on a single JWT with a configurable expiry (`JWT_EXPIRES_IN`).
- **Test coverage** is intentionally minimal (pure-logic unit tests only); integration tests need a real test database, as noted in [Testing](#12-testing).

## 18. License

Internal / project-specific — add a license of your choice before distributing.
