# Blood — Mobile

React Native (Expo, TypeScript) app for the Blood donor-finder.

## Setup

1. `npm install`
2. Edit `src/lib/config.ts` and set `API_BASE_URL` to your backend's address.
   - **Important**: `localhost` only resolves to itself on a simulator that shares your machine's network stack. On a physical device or most emulators, use your machine's LAN IP instead, e.g. `http://192.168.1.20:4000`. Run `ipconfig` (Windows) to find it.
3. `npx expo start` — scan the QR code with **Expo Go** (Android) or the Camera app (iOS), or press `a`/`i` for an emulator/simulator.

No Firebase project or native build is required for this app — auth currently runs on a mock OTP flow (see the backend README), and everything else uses standard Expo SDK modules, so plain Expo Go works for all testing.

## What's still a placeholder

- **OTP is fake.** `POST /auth/send-otp` returns the code directly instead of sending an SMS, and the app displays it right on the verify screen with a "Demo mode" banner. Swap this for a real SMS provider on the backend once you're ready — the app's `src/api/auth.ts` won't need to change (same request/response shape), only what's *inside* the code shown to the user.
- **Google Maps API keys** in `app.json` (`REPLACE_WITH_...`) need to be filled in before building for real devices — get them from the Google Cloud Console (Maps SDK for Android / iOS).
- **Push notifications** need `eas init` to link the project to an EAS project before `expo-notifications` can generate a real push token (`src/lib/notifications.ts` — it no-ops safely until then).
- **App Store / Play Store submission** (icons, splash screen, privacy policy, `eas build`/`eas submit`) hasn't been set up yet.

## Project structure

- `src/api/` — typed fetch wrappers for each backend resource
- `src/store/authStore.ts` — session token + current user (Zustand, persisted via SecureStore)
- `src/navigation/` — auth stack, main tab bar, root stack (donor detail + chat thread live at the root so they can be pushed from any tab)
- `src/screens/` — one file per screen
- `src/lib/socket.ts` — Socket.io client for real-time chat
