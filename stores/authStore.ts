"use client";

/** Auth state — mirrors GNW's authStore (Zustand + /api/auth/me bootstrap). */

import { create } from "zustand";
import type { GnwUser } from "@/lib/types";

export type AuthStatus =
  | "loading"
  | "signed-out"
  | "unauthorized" // authenticated but not a superuser
  | "ready";

interface AuthState {
  readonly status: AuthStatus;
  readonly user: GnwUser | null;
  readonly error: string | null;
  readonly setLoading: () => void;
  readonly setSignedOut: (error?: string) => void;
  readonly setUser: (user: GnwUser) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  status: "loading",
  user: null,
  error: null,
  setLoading: () => set({ status: "loading", error: null }),
  setSignedOut: (error) =>
    set({ status: "signed-out", user: null, error: error ?? null }),
  setUser: (user) =>
    set({
      user,
      status: user.userType === "superuser" ? "ready" : "unauthorized",
      error: null,
    }),
}));
