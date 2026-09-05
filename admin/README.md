# Blood — Admin Dashboard

React + Vite + TypeScript web dashboard for admins.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` to your backend's address.
3. `npm run dev` — starts at `http://localhost:5173`

## Getting admin access

There's no separate admin sign-up — an admin is just a `User` row with `role: "admin"`. The backend's `prisma/seed.ts` seeds one placeholder admin (edit the phone number there first, then run `npm run prisma:seed` in `backend/`). Log in on this dashboard with that phone number using the same mock-OTP flow as the mobile app (see `backend/README.md` — the code is returned directly in the response, no real SMS).

To promote another existing user to admin later, update their `role` directly in the database (or extend the Users page here with a "make admin" action).

## Pages

- **Overview** — basic counts (users, donations logged, banned users)
- **Users** — search, ban/unban
- **Donors** — list with computed eligibility status
- **Settings** — edit the donation-cycle and antibiotic-gap day counts used for eligibility calculations
