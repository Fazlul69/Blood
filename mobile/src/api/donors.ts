import { apiFetch } from "./client";
import type { BloodGroup, Donor } from "../types";

export interface DonorSearchParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  bloodGroup?: BloodGroup;
  username?: string;
  activeOnly?: boolean;
}

export function searchDonors(params: DonorSearchParams) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }
  return apiFetch<{ donors: Donor[] }>(`/api/v1/donors?${query.toString()}`);
}

export function getDonor(id: number) {
  return apiFetch<{ donor: Donor }>(`/api/v1/donors/${id}`);
}
