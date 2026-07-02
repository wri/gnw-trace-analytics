/**
 * Resource Watch bearer-token management — mirrors GNW (project-zeno-next):
 * token arrives via /auth/callback?token=… and lives in localStorage.
 */

import { jwtDecode } from "jwt-decode";
import { RW_API_HOST } from "@/lib/config";

const AUTH_TOKEN_KEY = "auth_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

/** True when the stored JWT has an exp claim in the past. */
export function isTokenExpired(token: string): boolean {
  try {
    const { exp } = jwtDecode<{ exp?: number }>(token);
    if (!exp) return false;
    return exp * 1000 <= Date.now();
  } catch {
    // Not decodable as a JWT — let the API decide.
    return false;
  }
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Resource Watch login URL that round-trips back to our /auth/callback. */
export function getLoginUrl(redirectTo: string): string {
  const callbackUrl = `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;
  const url = new URL(`${RW_API_HOST}/auth/login`);
  url.searchParams.set("origin", "gnw");
  url.searchParams.set("callbackUrl", callbackUrl);
  url.searchParams.set("token", "true");
  return url.toString();
}

/** Resource Watch logout URL that returns to our origin. */
export function getLogoutUrl(): string {
  const url = new URL(`${RW_API_HOST}/auth/logout`);
  url.searchParams.set("origin", "gnw");
  url.searchParams.set("callbackUrl", window.location.origin);
  return url.toString();
}
