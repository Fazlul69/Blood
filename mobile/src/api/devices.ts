import { apiFetch } from "./client";

export function registerDeviceToken(expoPushToken: string) {
  return apiFetch<{ ok: true }>("/api/v1/devices", { method: "POST", body: JSON.stringify({ expoPushToken }) });
}
