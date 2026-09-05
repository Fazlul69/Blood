# Blood — Backend

Node.js + Express + TypeScript + Prisma (MySQL) API for the Blood donor-finder app.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a MySQL 8+ connection string (MySQL 8 is required for `ST_Distance_Sphere` geo queries)
   - `JWT_SECRET` — any long random string, used to sign session and registration tokens
   - `PUBLIC_BASE_URL` — the URL this server is reachable at (used to build profile-photo URLs); set to your machine's LAN IP when testing from a phone/emulator
3. `npm run prisma:migrate` — creates the MySQL schema
4. `npm run prisma:seed` — seeds default eligibility settings (120-day cycle / 10-day antibiotic gap) and a placeholder admin row (edit the phone number in `prisma/seed.ts` first)
5. `npm run dev` — starts the API on `http://localhost:4000` (see `.env` `PORT`)

## Auth flow (mock OTP — read this)

There is **no real SMS provider wired up yet**. `POST /auth/send-otp` generates a 6-digit code and returns it directly in the response (`{ otp: "123456" }`) instead of sending an SMS, so the frontend can just display it to the user. This is intentional for now — swap in a real provider (Twilio Verify, MSG91, etc.) in `src/routes/auth.ts` once user volume justifies the SMS cost, and stop returning `otp` in the response at that point.

1. `POST /api/v1/auth/send-otp { phone }` → `{ otp }` (mock — display this to the user instead of sending an SMS)
2. `POST /api/v1/auth/verify-otp { phone, code }`
   - Existing user → `{ isNewUser: false, token, user }`. Use `token` as `Authorization: Bearer <token>` on all other requests.
   - New phone number → `{ isNewUser: true, registrationToken }`. Client collects username/name/blood group/location, then calls `POST /api/v1/auth/register` with those fields + `registrationToken` (a short-lived, 10-minute token proving the phone was just verified).

## Key routes

- `GET/PATCH /api/v1/users/me`, `POST /api/v1/users/me/photo` (saved to local disk under `uploads/`, served at `/uploads/...`)
- `GET /api/v1/donors?lat&lng&radiusKm&bloodGroup&username&activeOnly`, `GET /api/v1/donors/:id`
- `GET/POST /api/v1/donations` — donation history; POST updates `lastDonationDate` and logs a history row
- `GET /api/v1/chats`, `POST /api/v1/chats { otherUserId }`, `GET/POST /api/v1/chats/:id/messages`
- `POST /api/v1/devices { expoPushToken }`
- `/api/v1/admin/*` — requires `role=admin`: users list/ban, donors list, stats, eligibility settings

Real-time chat: connect a Socket.io client to the same origin with `auth: { token }` (the backend JWT); listen for `message:new` events.

## Known follow-ups (not yet production-ready)

- Real SMS OTP provider (see above)
- Object storage for profile photos instead of local disk (loses files on redeploy on most hosts)
