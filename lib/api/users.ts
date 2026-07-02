/**
 * GNW user endpoints (camelCase payloads):
 * - GET /api/auth/me       current user profile (any authenticated user)
 * - GET /api/admin/users   full user list (superuser only, paginated)
 */

import { z } from "zod";
import { API_HOST } from "@/lib/config";
import { requestJson } from "@/lib/api/http";
import { getAuthHeaders } from "@/lib/auth/token";
import type { GnwUser } from "@/lib/types";

const ADMIN_USERS_PAGE_SIZE = 200; // endpoint caps limit at 200
const MAX_USER_PAGES = 500; // safety backstop (100k users)

const UserSchema = z.looseObject({
  id: z.string(),
  name: z.string().nullish(),
  email: z.string().default(""),
  userType: z.string().default("regular"),
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
});

function toGnwUser(parsed: z.infer<typeof UserSchema>): GnwUser {
  return {
    id: parsed.id,
    name: parsed.name ?? null,
    email: parsed.email,
    userType: parsed.userType,
    createdAt: parsed.createdAt ?? null,
    updatedAt: parsed.updatedAt ?? null,
  };
}

/** Fetch the signed-in user's profile. */
export async function fetchCurrentUser(signal?: AbortSignal): Promise<GnwUser> {
  const body = await requestJson(`${API_HOST}/api/auth/me`, {
    headers: getAuthHeaders(),
    signal,
  });
  return toGnwUser(UserSchema.parse(body));
}

export interface FetchAllUsersOptions {
  readonly signal?: AbortSignal;
  readonly onProgress?: (fetched: number) => void;
}

/**
 * Fetch the full user table via GET /api/admin/users (superuser only).
 * The endpoint returns a plain array ordered by createdAt DESC; we paginate
 * until a short page.
 */
export async function fetchAllUsers(
  options: FetchAllUsersOptions = {}
): Promise<GnwUser[]> {
  const { signal, onProgress } = options;
  const headers = getAuthHeaders();
  const users: GnwUser[] = [];

  for (let page = 0; page < MAX_USER_PAGES; page += 1) {
    const body = await requestJson(`${API_HOST}/api/admin/users`, {
      headers,
      params: { limit: ADMIN_USERS_PAGE_SIZE, offset: page * ADMIN_USERS_PAGE_SIZE },
      signal,
    });
    const batch = z.array(UserSchema).parse(body).map(toGnwUser);
    users.push(...batch);
    onProgress?.(users.length);
    if (batch.length < ADMIN_USERS_PAGE_SIZE) break;
  }

  return users;
}

/**
 * Build the {userId → first-seen ISO date} map used for New vs Returning
 * segmentation. `createdAt` is when the user record was first created (their
 * first authenticated visit).
 */
export function buildUserFirstSeenMap(users: readonly GnwUser[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const user of users) {
    if (!user.createdAt) continue;
    const ms = Date.parse(user.createdAt);
    if (!Number.isFinite(ms)) continue;
    map.set(user.id, new Date(ms).toISOString().slice(0, 10));
  }
  return map;
}
