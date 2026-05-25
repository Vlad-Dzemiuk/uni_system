"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AppRole } from "@/lib/types";
import { mapRole, type Me } from "@/lib/auth.types";

function homePathByRole(role: AppRole | null) {
  if (role === "ADMIN") return "/admin/faculties";
  if (role === "DEAN_OFFICE") return "/dean/analytics";
  return "/certificates";
}

function normalizeRoleFromRaw(rawRole: unknown): AppRole | null {
  const normalized = String(rawRole ?? "").trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "admin") return "ADMIN";
  if (normalized === "dean") return "DEAN_OFFICE";
  if (normalized === "teacher") return "TEACHER";
  if (normalized === "student") return "STUDENT";
  return null;
}

type AuthCtxType = {
  user: Me | null;
  role: AppRole | null;
  loading: boolean;
  refreshMe: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthCtxType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    setLoading(true);

    try {
      const me = await api<Me>("/api/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const value = useMemo(
    () => ({
      user,
      role: user ? normalizeRoleFromRaw(user.role) ?? mapRole(user.role) : null,
      loading,
      refreshMe,
      signOut,
    }),
    [user, loading, refreshMe, signOut]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function RequireAuth({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}) {
  const router = useRouter();
  const { user, role, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && (!role || !allowedRoles.includes(role))) {
      router.replace(homePathByRole(role));
    }
  }, [loading, user, role, allowedRoles, router]);

  if (loading) {
    return (
      <div className="loader-screen">
        <div className="loader-orbit">
          <div className="loader-core" />
          <div className="loader-ring loader-ring-a" />
          <div className="loader-ring loader-ring-b" />
        </div>
        <p className="loader-label">Перевіряємо сесію...</p>
      </div>
    );
  }

  if (!user) return null;
  if (allowedRoles && (!role || !allowedRoles.includes(role))) return null;

  return <>{children}</>;
}
