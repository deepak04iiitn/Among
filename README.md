# AMONG

> *You're not the only one. Say what's on your mind. Find people who've been there.*

AMONG is an anonymous human-experience network built around anonymity, relatability, and meaningful connection. It is not a social network. It does not have follower counts, karma scores, or permanent public profiles. It has shared experiences, structured relatability, and temporary anonymous conversations between people who understand.

---

## Documentation

| Document | Description |
|---|---|
| [`docs/PRD.md`](./docs/PRD.md) | Product Requirements Document — the product source of truth |
| [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) | Full engineering implementation blueprint |
| [`CLAUDE.md`](./CLAUDE.md) | Developer rulebook — always-applicable constraints and patterns |

---

## Repository Structure

```
/
├── shared/       # TypeScript constants, types, and Zod schemas shared by backend + frontend
├── backend/      # Node.js + Express API server
├── frontend/     # Next.js web application
└── docs/         # Product and engineering documentation
```

---

## Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- MongoDB (local or Atlas)
- Redis (local or cloud)
- Firebase project with Authentication enabled and Google Sign-In configured

---

## Setup

### 1. Install dependencies

```bash
npm install
```

This installs dependencies for all workspaces (`shared`, `backend`, `frontend`).

### 2. Configure environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your values
```

### 3. Start development servers

```bash
# Backend (in one terminal)
npm run dev:backend

# Frontend (in another terminal)
npm run dev:frontend
```

---

## Development

### Running tests

```bash
# All workspaces
npm run test

# With coverage
npm run test:coverage

# Single workspace
npm run test --workspace=backend
npm run test --workspace=frontend
npm run test --workspace=shared
```

### Type checking

```bash
npm run typecheck
```

### Linting & formatting

```bash
npm run lint
npm run format
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), shadcn/ui, Tailwind CSS, Redux Toolkit |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Cache / Rate limiting | Redis |
| Authentication | Firebase Authentication + Google Sign-In |
| Validation | Zod (shared schemas across frontend + backend) |
| Real-time | Socket.IO |
| Language | TypeScript (strict, full-stack) |

---

## Contributing

Read [`CLAUDE.md`](./CLAUDE.md) before writing any code. Every rule in that file applies to every commit.

Key rules at a glance:
- File size hard cap: **1,000 lines** (target: 600–700)
- No hardcoded constants — all values imported from `shared/constants/`
- Tests ship with every feature — never deferred
- No gradients, no chat bubbles, no follower counts — see `CLAUDE.md §7`
