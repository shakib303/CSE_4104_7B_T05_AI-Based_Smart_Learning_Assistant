# AI-Based Smart Learning Assistant — Backend

**CSE4104-7A-T01** · Week 5 — Backend Development & Database Implementation

A REST API backend powering the AI-Based Smart Learning Assistant: JWT authentication, task management, AI chat (service-layer abstraction ready for OpenAI GPT-4), study session logging, and dashboard analytics.

---

## 📁 Repository Structure

```
backend/
├── database/
│   ├── schema.sql              # Full SQL schema (11 tables, FKs, CHECK constraints)
│   └── dev.db                  # SQLite database file (generated on first run)
├── src/
│   ├── config/
│   │   └── db.js               # Database connection (node:sqlite)
│   ├── controllers/            # Request handlers — one per resource
│   ├── middleware/              # auth, validation, error handling
│   ├── routes/                  # Express route definitions
│   ├── services/
│   │   └── ai.service.js       # AI chat service (OpenAI-compatible interface)
│   ├── utils/
│   │   ├── jwt.js              # Token generation/verification
│   │   ├── dbHelpers.js        # snake_case ↔ camelCase mapping, ID/timestamp helpers
│   │   └── seed.js             # Demo data seeder
│   ├── app.js                   # Express app — middleware & route mounting
│   └── server.js               # Entry point
├── docs/
│   ├── CSE4104-7A-T01_BackendProgress.pdf
│   └── CSE4104-7A-T01_DatabaseDesign.pdf
├── postman/
│   └── CSE4104-7A-T01_APICollection.json
├── screenshots/
│   └── png/                     # Database, API test, and workflow screenshots
├── api_test_results/            # Raw request/response logs from manual testing
├── .env                          # Environment variables (not committed in production)
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js **v22.5+** (uses the built-in `node:sqlite` module — no native compilation or separate DB server required)

### Install & Run

```bash
cd backend
npm install
npm run dev
```

The server starts on **http://localhost:4000**. The SQLite database and schema are created automatically on first boot.

### Seed demo data

```bash
npm run db:seed
```

Creates a demo user (`demo@smartlearning.app` / `Demo@1234`), 5 subjects, and sample tasks.

### Reset the database

```bash
npm run db:reset
```

---

## 🔑 Environment Variables (`.env`)

```env
PORT=4000
DATABASE_URL="file:./database/dev.db"
JWT_SECRET=<your-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

---

## 🗄 Database Note — SQLite vs. PostgreSQL

This backend uses **SQLite** (via Node's built-in `node:sqlite` module) for local development and grading, so the project runs with zero external dependencies — no Docker, no database server install, no cloud account.

The schema (`database/schema.sql`) is written in portable standard SQL and maps 1:1 to the PostgreSQL design submitted in the Week 4 ER Diagram. Migrating to PostgreSQL for staging/production is a connection-string and minor-syntax change only — no structural redesign needed.

---

## 📡 API Overview

| Group | Base Path | Endpoints |
|---|---|---|
| Authentication | `/api/auth` | register, login, logout, refresh, me |
| User Profile | `/api/users` | profile (get/update), password |
| Tasks | `/api/tasks` | CRUD + status update + stats |
| AI Chat | `/api/chat` | sessions (CRUD) + send message |
| Dashboard | `/api/dashboard` | summary, study-log |
| Subjects | `/api/subjects` | list, create, enroll |

Full endpoint documentation: see `docs/CSE4104-7A-T01_BackendProgress.pdf` (Section 4) or import `postman/CSE4104-7A-T01_APICollection.json` into Postman/Thunder Client.

---

## 🧪 Testing

20 manual test cases were executed covering success paths, validation errors, auth failures, and not-found scenarios. Results: **20/20 passed**. Raw logs in `api_test_results/`, summarized in the Backend Progress Report (Section 7).

---

## 🤖 AI Service Note

`src/services/ai.service.js` is written as a drop-in interface matching the OpenAI Chat Completions API shape (`chat(systemPrompt, messages) → { reply, tokens, finishReason }`). It currently uses a deterministic stub generator so the full request/response contract can be tested without a live API key. Swapping to a real OpenAI key requires only uncommenting the SDK block in that file — no controller or route changes needed.

---

## 👥 Team

| Name | Role |
|---|---|
| _Add team member names here_ | _Backend / Frontend / AI / DevOps_ |

---

## 📝 Commit Convention

Following the assignment's required commit message style:

```
Added user authentication module
Implemented JWT login system
Created database schema
Added task management APIs
Fixed registration validation error handling
```
