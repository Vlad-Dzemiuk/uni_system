"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppNotification, AppRole, CertificateType, Order } from "@/lib/types";
import { seedCertificates, seedOrders } from "@/lib/mockData";
import { useAuth } from "@/providers/auth-providers";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type AuthState = {
  isAuthed: boolean;
  userName: string;
  email: string;
  role: AppRole;
  groupName?: string;
  specialty?: string;
  birthDate?: string;
  avatarUrl?: string;
};

type AppContextValue = {
  auth: AuthState;
  setRole: (role: AppRole) => void;
  signIn: (email: string, role?: AppRole) => void;
  signOut: () => void;

  certificates: CertificateType[];
  orders: Order[];

  createOrder: (payload: Omit<Order, "id" | "status" | "dateSubmitted">) => void;
  updateOrder: (id: string, patch: Partial<Pick<Order, "status" | "comment" | "pickupDate">>) => void;

  createCertificate: (payload: Omit<CertificateType, "id">) => string;
  updateCertificate: (id: string, patch: Omit<CertificateType, "id">) => void;
  deleteCertificate: (id: string) => void;

  notifications: AppNotification[];
  unreadNotifications: number;
  notificationsLoading: boolean;
  refreshNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
};

type BackendNotification = {
  _id?: unknown;
  id?: unknown;
  kind?: unknown;
  title?: unknown;
  message?: unknown;
  link?: unknown;
  entityId?: unknown;
  isRead?: unknown;
  createdAt?: unknown;
};

type BackendNotificationsPayload = {
  items?: unknown;
  unreadCount?: unknown;
};

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within Providers");
  return ctx;
}

function readLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLS(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
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

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function mapNotifications(payload: unknown): { items: AppNotification[]; unreadCount: number } {
  const root = payload && typeof payload === "object" ? (payload as BackendNotificationsPayload) : {};
  const items = Array.isArray(root.items) ? (root.items as BackendNotification[]) : [];

  return {
    items: items.map((item, index) => ({
      id:
        (typeof item._id === "string" && item._id) ||
        (typeof item.id === "string" && item.id) ||
        `notification-${index + 1}`,
      kind: readString(item.kind, "notification"),
      title: readString(item.title, "Сповіщення"),
      message: readString(item.message),
      link: readString(item.link) || undefined,
      entityId: readString(item.entityId) || undefined,
      isRead: item.isRead === true,
      createdAt: readString(item.createdAt),
    })),
    unreadCount: typeof root.unreadCount === "number" ? root.unreadCount : 0,
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { user, role, signOut: authSignOut } = useAuth();

  const [certificates, setCertificates] = useState<CertificateType[]>(seedCertificates);
  const [orders, setOrders] = useState<Order[]>(seedOrders);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const effectiveRole = useMemo<AppRole>(
    () => normalizeRoleFromRaw(user?.role) ?? role ?? "STUDENT",
    [user?.role, role]
  );

  const auth = useMemo<AuthState>(
    () => ({
      isAuthed: !!user,
      userName: user?.fullName ?? "Користувач",
      email: user?.email ?? "",
      role: effectiveRole,
      groupName: user?.groupName,
      specialty: user?.specialty,
      birthDate: user?.birthDate,
      avatarUrl: user?.google?.picture,
    }),
    [user, effectiveRole]
  );

  useEffect(() => {
    const savedCerts = readLS<CertificateType[]>("app_certs", seedCertificates);
    const savedOrders = readLS<Order[]>("app_orders", seedOrders);
    setCertificates(savedCerts);
    setOrders(savedOrders);
  }, []);

  useEffect(() => writeLS("app_certs", certificates), [certificates]);
  useEffect(() => writeLS("app_orders", orders), [orders]);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }

    setNotificationsLoading(true);
    try {
      const payload = await api<unknown>("/api/notifications?limit=12");
      const next = mapNotifications(payload);
      setNotifications(next.items);
      setUnreadNotifications(next.unreadCount);
    } catch {
      setNotifications([]);
      setUnreadNotifications(0);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);

  const markNotificationRead = useCallback(
    async (id: string) => {
      await api(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });

      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    },
    []
  );

  const markAllNotificationsRead = useCallback(async () => {
    await api("/api/notifications/read-all", {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadNotifications(0);
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadNotifications(0);
      return;
    }

    void refreshNotifications();

    const timer = window.setInterval(() => {
      void refreshNotifications();
    }, 45000);

    return () => window.clearInterval(timer);
  }, [user, refreshNotifications]);

  const value = useMemo<AppContextValue>(() => {
    return {
      auth,
      setRole(_role) {
        // Role is controlled by backend auth state.
      },
      signIn(_email, _role) {
        if (typeof window !== "undefined") {
          window.location.href = `${API_URL}/api/auth/google/start`;
        }
      },
      signOut() {
        void authSignOut().finally(() => {
          if (typeof window !== "undefined") {
            window.location.href = "/login";
          }
        });
      },

      certificates,
      orders,

      createOrder(payload) {
        setOrders((prev) => {
          const id = `ORD-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
          const next: Order = {
            id,
            status: "Pending",
            dateSubmitted: new Date().toISOString(),
            ...payload,
          };
          return [next, ...prev];
        });
      },

      updateOrder(id, patch) {
        setOrders((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
      },

      createCertificate(payload) {
        const id = `CERT-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;
        setCertificates((prev) => [{ id, ...payload }, ...prev]);
        return id;
      },

      updateCertificate(id, patch) {
        setCertificates((prev) => prev.map((item) => (item.id === id ? { id, ...patch } : item)));
      },

      deleteCertificate(id) {
        setCertificates((prev) => prev.filter((item) => item.id !== id));
      },

      notifications,
      unreadNotifications,
      notificationsLoading,
      refreshNotifications,
      markNotificationRead,
      markAllNotificationsRead,
    };
  }, [
    auth,
    certificates,
    orders,
    authSignOut,
    notifications,
    unreadNotifications,
    notificationsLoading,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
