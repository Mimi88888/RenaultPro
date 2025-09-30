# RenaultPro – Exam Cheat Sheet

## Project Overview
- Full‑stack Renault service assistant (users register/login, manage vehicles, find garages, book appointments).
- Frontend: React + Vite. Backend: Express + Drizzle ORM + Neon Postgres. Auth: sessions.

## Architecture
### Frontend
- React 18, Vite dev server with proxy `/api → http://localhost:5000`.
- Data: TanStack Query (fetch + cache) with `credentials: "include"`.
- Forms/Validation: React Hook Form + Zod.
- UI: shadcn‑style components; icons via lucide-react.
- Routing: react-router-dom.
- i18n: translation dictionaries + `LanguageContext`.

Key files: `client/src/pages/auth-page.tsx`, `client/src/hooks/use-auth.tsx`, `client/src/lib/queryClient.ts`, `vite.config.ts`.

### Backend
- Express app (`server/index.ts`), JSON body parser, CORS `{ origin: http://localhost:3000, credentials: true }`.
- Sessions: `express-session` + `connect-pg-simple` storing sessions in Postgres (Neon) via `pg.Pool` with SSL.
- Auth: `passport-local`, password hashing with `crypto.scrypt`, routes in `server/auth.ts`.
- Routes/API: `server/routes.ts` (vehicles, garages, appointments), auth endpoints.
- Storage: `server/database-storage.ts` using Drizzle; exported via `server/storage.ts`.
- DB access: `server/db.ts` uses `drizzle-orm/neon-http` with `@neondatabase/serverless` and `.env` `DATABASE_URL`.

### Shared Schema (Drizzle + Zod)
- `shared/schema.ts` defines tables and insert schemas.
  - `users`: id, username(unique), password, email, fullName, isAdmin, isTunisian, documentType, documentNumber, phoneNumber.
  - `vehicles`: id, userId(FK→users), make, model, year, licensePlate, vin, chipsetCode, fuelType, isPrimary, status, nextServiceMileage, isImported, importCountry, requiresOtpVerification, otpVerified, purchaseDate.
  - `garages`: id, name, address, latitude, longitude, services(text[]), isFavorite, rating, reviewCount, openingHour, closingHour.
  - `appointments`: id, userId(FK→users), vehicleId(FK→vehicles), garageId(FK→garages), serviceType, date, status, price, notes, paymentMethod, paymentStatus, transactionId.
  - `session`: `sid` PK, `sess` json, `expire` + index (for connect‑pg‑simple).

## Data Flow
1) Frontend POST `/api/register` or `/api/login` (JSON, `credentials: include`).
2) Backend validates; creates/fetches user via Drizzle; creates session in Postgres.
3) Frontend fetches `/api/user` to get current user; subsequent vehicle/appointment APIs require session.

## Key APIs
- Auth: `POST /api/register`, `POST /api/login`, `POST /api/logout`, `GET /api/user`.
- Vehicles: `GET /api/vehicles`, `POST /api/vehicles`, `PATCH /api/vehicles/:id`, `DELETE /api/vehicles/:id`.
- Garages: `GET /api/garages`, `GET /api/garages/nearby?lat=&lng=&radius=`, `GET /api/garages/service/:service`.
- Appointments: `GET /api/appointments`, `POST /api/appointments`, `PATCH /api/appointments/:id`, `DELETE /api/appointments/:id`.

## Setup & Commands
- `.env` in project root (`Renault/`): `DATABASE_URL=postgresql://...` (no quotes).
- Install: `npm install`
- Dev (both): `npm run dev`  | Backend only: `npm run dev:backend` | Frontend only: `npm run dev:frontend`
- DB push (migrate schema to Neon): `npm run db:push`
- Inspect DB: `npx drizzle-kit studio`

## Important Configs / Gotchas
- Drizzle driver must be `drizzle-orm/neon-http` for `@neondatabase/serverless`.
- Session store requires Postgres `session` table + SSL: `pg.Pool({ ssl: { rejectUnauthorized: false } })` for Neon.
- CORS must allow credentials; frontend requests use `credentials: "include"`.
- Vite proxy forwards `/api` to backend on 5000.
- Registration payload must include required fields; usernames must be unique.

## Testing & Debugging
- Register payload example:
```json
{
  "fullName": "Test User 1",
  "email": "test1@example.com",
  "username": "testuser1",
  "password": "password123",
  "phoneNumber": "+216 55 555 555",
  "isTunisian": true,
  "documentType": "CIN",
  "documentNumber": "12345678"
}
```
- Postman/curl against `http://localhost:5000` (not 3000) to bypass proxy for debugging.
- Backend logs print `Unhandled error: …` on failures — read exact DB/session messages.
- Common 500 causes: backend not running; missing `session` table; wrong driver; SSL not set; CORS/cookie misconfig.

## Performance & Scalability Notes
- Sessions in Postgres: monitor cleanup/expiration; index on `expire`.
- Nearby garage filtering is in app memory; for scale, move to SQL/geospatial.
- Add indexes for frequent lookups: `vehicles(user_id)`, `appointments(user_id)`.

## Deployment Notes
- Build: `npm run build` (bundles server, builds frontend to `dist/public`).
- Serve static in prod (`serveStatic` path in `server/index.ts`).
- Set `DATABASE_URL`, `SESSION_SECRET`, and configure CORS for prod origin; use secure cookies over HTTPS.
- Run `drizzle-kit push` against production Neon before switching traffic.

## Likely Exam Q&A (Short)
- Why sessions? Simpler stateful auth; `connect-pg-simple` persists across restarts.
- Password security? `crypto.scrypt` with per‑user salt, `timingSafeEqual` for compare.
- Why Drizzle + Neon HTTP? Type safety + serverless‑friendly HTTP driver.
- How does the frontend keep auth state? `/api/user` via TanStack Query; cache updates on auth mutations; cookies sent with credentials.
- What breaks without CORS credentials? Cookies not sent; user always appears logged out.
- How to add a field/table? Update `shared/schema.ts`, `npm run db:push`, update storage/routes as needed.


