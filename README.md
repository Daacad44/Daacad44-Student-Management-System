# School Management System (SMS)

Full-stack scaffold for a school management platform covering admissions, academics, attendance, exams, finance, communication, and RBAC.

## Tech Stack
- Backend: Node.js, Express 5, Prisma, PostgreSQL, JWT (access + refresh), bcrypt, Zod.
- Frontend: React + Vite + TypeScript, Tailwind CSS, React Query, React Router, shadcn-friendly utility stack (Radix UI, cva, tailwind-merge).

## Getting Started
1) Prereqs: Node.js 20+, PostgreSQL running and reachable via `DATABASE_URL`.
2) Backend
   - `cd backend`
   - `cp .env.example .env` and update values (DB + JWT secrets).
   - `npm install`
   - `npm run prisma:generate`
   - `npm run prisma:migrate --name init` (after setting your DB)
   - `npm run seed` (creates default roles/permissions + super admin)
   - `npm run dev` (or `npm run start` after `npm run build`)
3) Frontend
   - `cd frontend`
   - `npm install`
   - `npm run dev` (visit http://localhost:5173 by default)

## Smoke Tests (quick manual)
- API health: `curl http://localhost:4000/health`
- Auth: `POST /api/v1/auth/register` (creates user + role) then `POST /api/v1/auth/login`; call `GET /api/v1/auth/me` with the access token.
- Students: `POST /api/v1/students` with basic payload then `GET /api/v1/students` to confirm it appears.
- Finance/attendance/exams routes are scaffolded; they currently return stub responses until extended.

## What’s Included
- **Backend**
  - Prisma schema covering users/roles/permissions, academic structure, attendance, exams, finance, announcements, and audit logs.
  - Auth flows (register/login/refresh/me), JWT + bcrypt, basic RBAC middleware.
  - Student module with creation + listing and auto-generated student IDs.
  - Stubs for attendance, exams, finance routes to extend.
  - Seed script for default roles/permissions and a super admin (`SEED_ADMIN_*`).
- **Frontend**
  - Dashboard UI inspired by the provided mock (sidebar, topbar, stat cards, attendance + fee widgets).
  - Placeholder pages for students/finance/attendance/exams/etc. wired through React Router.
  - Tailwind setup with brand theme, QueryClient, and utility helpers for shadcn-style components.

## Next Steps
- Wire frontend forms to backend endpoints (login, student CRUD, attendance capture, invoices).
- Implement full attendance/exam/finance logic on the API and add Swagger/OpenAPI docs.
- Add pagination, filtering, and real charts; integrate notifications (email/SMS) as required.
- Expand tests (unit for services, integration for routes) before production.
