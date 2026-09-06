import { apiFetch } from "./client";
import type { User } from "../types";

export function getMe() {
  return apiFetch<{ user: User; donationCount: number; isActive: boolean; nextEligibleDate: string | null }>(
    "/api/v1/users/me"
  );
}

export function updateMe(patch: Partial<Pick<User, "name" | "gender" | "bloodGroup" | "lat" | "lng" | "addressText" | "showPhone" | "allowChat" | "lastAntibioticDate">>) {
  return apiFetch<{ user: User }>("/api/v1/users/me", { method: "PATCH", body: JSON.stringify(patch) });
}

export function uploadPhoto(fileUri: string, mimeType: string) {
  const form = new FormData();
  form.append("photo", { uri: fileUri, name: "photo.jpg", type: mimeType } as unknown as Blob);
  return apiFetch<{ user: User }>("/api/v1/users/me/photo", { method: "POST", body: form });
}
