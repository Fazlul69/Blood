import { apiFetch } from "./client";
import type { AppSetting, DonorWithStatus, User } from "../types";

export function listUsers(query?: string) {
  const qs = query ? `?query=${encodeURIComponent(query)}` : "";
  return apiFetch<{ users: User[] }>(`/api/v1/admin/users${qs}`);
}

export function updateUser(id: number, patch: Partial<Pick<User, "status" | "role">>) {
  return apiFetch<{ user: User }>(`/api/v1/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export function listDonors() {
  return apiFetch<{ donors: DonorWithStatus[] }>("/api/v1/admin/donors");
}

export function getStats() {
  return apiFetch<{ totalUsers: number; totalDonations: number; bannedUsers: number }>("/api/v1/admin/stats");
}

export function getSettings() {
  return apiFetch<{ settings: AppSetting[] }>("/api/v1/admin/settings");
}

export function updateSettings(patch: { donation_cycle_days?: number; antibiotic_gap_days?: number }) {
  return apiFetch<{ ok: true }>("/api/v1/admin/settings", { method: "PATCH", body: JSON.stringify(patch) });
}
