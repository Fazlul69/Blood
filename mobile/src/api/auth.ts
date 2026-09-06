import { apiFetch } from "./client";
import type { BloodGroup, User } from "../types";

export function sendOtp(phone: string) {
  return apiFetch<{ phone: string; otp: string; demoMode: true }>("/api/v1/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone: string, code: string) {
  return apiFetch<
    | { isNewUser: true; phone: string; registrationToken: string }
    | { isNewUser: false; token: string; user: User }
  >("/api/v1/auth/verify-otp", { method: "POST", body: JSON.stringify({ phone, code }) });
}

export function registerUser(input: {
  registrationToken: string;
  username: string;
  name: string;
  bloodGroup: BloodGroup;
  gender?: string;
  lat?: number;
  lng?: number;
  addressText?: string;
}) {
  return apiFetch<{ token: string; user: User }>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
