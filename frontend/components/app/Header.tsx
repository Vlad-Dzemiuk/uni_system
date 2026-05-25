"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, LogOut } from "lucide-react";
import { useApp } from "@/app/providers";
import { MobileSidebar } from "./MobileSidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function formatNotificationDate(value: string) {
  if (!value) return "щойно";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "щойно";

  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  const formatter = new Intl.RelativeTimeFormat("uk", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) return formatter.format(diffMinutes, "minute");

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return formatter.format(diffHours, "hour");

  return formatter.format(Math.round(diffHours / 24), "day");
}

export function Header() {
  const router = useRouter();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const {
    auth,
    signOut,
    notifications,
    unreadNotifications,
    notificationsLoading,
    markNotificationRead,
    markAllNotificationsRead,
  } = useApp();

  const initials = useMemo(
    () =>
      auth.userName
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
    [auth.userName]
  );

  const openNotification = async (id: string, link?: string) => {
    const item = notifications.find((notification) => notification.id === id);
    if (item && !item.isRead) {
      await markNotificationRead(id).catch(() => undefined);
    }

    setNotificationsOpen(false);

    if (link) {
      router.push(link);
    }
  };

  const notificationList = (
    <div className="min-h-0 flex-1 overflow-y-auto p-2">
      {notificationsLoading ? (
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
          Завантаження сповіщень...
        </div>
      ) : null}

      {!notificationsLoading && notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          Наразі немає нових сповіщень.
        </div>
      ) : null}

      {!notificationsLoading
        ? notifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              className="mb-2 flex w-full items-start gap-3 rounded-2xl border border-slate-100 px-3 py-3 text-left transition hover:bg-slate-50 last:mb-0"
              onClick={() => void openNotification(notification.id, notification.link)}
            >
              <span
                className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                  notification.isRead ? "bg-slate-300" : "bg-sky-500"
                }`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">{notification.title}</div>
                  <div className="shrink-0 text-[11px] text-slate-400">
                    {formatNotificationDate(notification.createdAt)}
                  </div>
                </div>
                <div className="mt-1 text-sm leading-5 text-slate-500">{notification.message}</div>
              </div>
            </button>
          ))
        : null}
    </div>
  );

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white px-4 py-4 md:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <MobileSidebar />
        <div className="hidden md:block">
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">
            Єдиний портал довідок
          </div>
          <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
            Робочий кабінет
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-2xl md:hidden"
          aria-label="Сповіщення"
          onClick={() => setNotificationsOpen(true)}
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 ? (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
          ) : null}
        </Button>

        <div className="hidden md:block">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative rounded-2xl" aria-label="Сповіщення">
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 ? (
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500" />
                ) : null}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-[min(352px,calc(100vw-1rem))] overflow-hidden rounded-[24px] p-0">
              <div className="flex items-center justify-between gap-3 px-4 py-4">
                <div>
                  <DropdownMenuLabel className="px-0 py-0 text-sm font-semibold tracking-normal text-slate-900">
                    Сповіщення
                  </DropdownMenuLabel>
                  <div className="mt-1 text-xs text-slate-500">
                    Непрочитаних: <span className="font-semibold text-slate-900">{unreadNotifications}</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => void markAllNotificationsRead()}
                  disabled={unreadNotifications === 0}
                >
                  <CheckCheck className="h-4 w-4" />
                  Прочитати все
                </Button>
              </div>

              <DropdownMenuSeparator />

              <div className="max-h-[min(420px,70vh)] overflow-y-auto p-2">
                {notificationsLoading ? (
                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                    Завантаження сповіщень...
                  </div>
                ) : null}

                {!notificationsLoading && notifications.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    Наразі немає нових сповіщень.
                  </div>
                ) : null}

                {!notificationsLoading
                  ? notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="mb-2 flex items-start gap-3 rounded-2xl border border-slate-100 px-3 py-3 last:mb-0"
                        onClick={() => void openNotification(notification.id, notification.link)}
                      >
                        <span
                          className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                            notification.isRead ? "bg-slate-300" : "bg-sky-500"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-sm font-semibold text-slate-900">{notification.title}</div>
                            <div className="shrink-0 text-[11px] text-slate-400">
                              {formatNotificationDate(notification.createdAt)}
                            </div>
                          </div>
                          <div className="mt-1 text-sm leading-5 text-slate-500">{notification.message}</div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  : null}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-[20px] border border-slate-200/80 bg-white px-3 py-2 shadow-soft transition hover:bg-slate-50">
              <Avatar className="h-10 w-10">
                <AvatarImage src={auth.avatarUrl} alt={auth.userName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-semibold leading-4 text-slate-900">{auth.userName}</div>
                <div className="mt-1 text-xs leading-4 text-slate-500">{auth.email}</div>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="rounded-[22px]">
            <DropdownMenuLabel>Акаунт</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              Вийти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <SheetContent className="flex w-[min(22rem,calc(100vw-0.75rem))] max-w-[22rem] flex-col p-0">
          <SheetHeader className="mb-0 border-b border-slate-200/80 px-4 py-4 pr-14">
            <SheetTitle className="text-lg">Сповіщення</SheetTitle>
            <div className="mt-1 text-sm text-slate-500">
              Непрочитаних: <span className="font-semibold text-slate-900">{unreadNotifications}</span>
            </div>
          </SheetHeader>

          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Оновлення
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-xl px-2.5 text-xs"
              onClick={() => void markAllNotificationsRead()}
              disabled={unreadNotifications === 0}
            >
              <CheckCheck className="h-4 w-4" />
              Прочитати все
            </Button>
          </div>

          {notificationList}
        </SheetContent>
      </Sheet>
    </header>
  );
}
