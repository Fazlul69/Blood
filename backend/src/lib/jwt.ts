import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export interface SessionPayload {
  userId: number;
  role: "user" | "admin";
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, JWT_SECRET) as SessionPayload;
}

/**
 * Short-lived token proving a phone number just passed OTP verification,
 * handed from POST /auth/verify-otp to POST /auth/register so registration
 * can't be called directly for an unverified phone number.
 */
export function signRegistrationToken(phone: string): string {
  return jwt.sign({ phone, purpose: "register" }, JWT_SECRET, { expiresIn: "10m" });
}

export function verifyRegistrationToken(token: string): string {
  const payload = jwt.verify(token, JWT_SECRET) as { phone: string; purpose: string };
  if (payload.purpose !== "register") throw new Error("Invalid registration token");
  return payload.phone;
}
