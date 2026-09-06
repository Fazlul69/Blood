import { apiFetch } from "./client";
import type { DonationHistoryEntry } from "../types";

export function getDonationHistory() {
  return apiFetch<{ history: DonationHistoryEntry[]; count: number }>("/api/v1/donations");
}

export function recordDonation(donationDate: string) {
  return apiFetch<{ historyEntry: DonationHistoryEntry }>("/api/v1/donations", {
    method: "POST",
    body: JSON.stringify({ donationDate }),
  });
}
