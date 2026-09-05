import { API_BASE_URL } from "../lib/config";
import { useAuthStore } from "../store/authStore";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();
  const body = text ? JSON.parse(text) : undefined;

  if (!res.ok) {
    const message = body?.error ? (typeof body.error === "string" ? body.error : JSON.stringify(body.error)) : res.statusText;
    if (res.status === 401) useAuthStore.getState().signOut();
    throw new ApiError(message, res.status);
  }
  return body as T;
}
