"use client";

import { useTranslations } from '@/utils/strings/client';
import { useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  createdAt: string;
  readAt: string | null;
};

export default function AdminNotifications({
  onOpen,
}: {
  onOpen?: () => void;
}) {
  const t = useTranslations("Admin.notifications");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadInFlightRef = useRef(false);

  const loadNotifications = async () => {
    if (loadInFlightRef.current) return;
    loadInFlightRef.current = true;
    try {
      const response = await fetch("/api/admin/notifications", {
        cache: "no-store",
        credentials: "include",
      });
      if (response.status === 401) {
        setIsAuthorized(false);
        console.warn("[notifications] Unauthorized (401) while loading.");
        return;
      }
      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        console.warn(
          `[notifications] Failed to load: ${response.status} ${response.statusText}`,
          errorBody,
        );
        return;
      }
      const data = (await response.json()) as {
        notifications?: NotificationItem[];
        unreadCount?: number;
      };
      setItems(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch (error) {
      console.warn("[notifications] Failed to load", error);
    } finally {
      loadInFlightRef.current = false;
    }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/admin/notifications/read", {
        method: "POST",
      });
      if (!response.ok) return;
      await loadNotifications();
    } catch (error) {
      console.warn("[notifications] Failed to mark all read", error);
    }
  };

  const markOneRead = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}/read`, {
        method: "POST",
      });
      if (!response.ok) return;
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, readAt: new Date().toISOString() } : item
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      console.warn("[notifications] Failed to mark read", error);
    }
  };

  const deleteOne = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/notifications/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) return;
      setItems((current) => {
        const removed = current.find((item) => item.id === id);
        setUnreadCount((count) => {
          if (removed && !removed.readAt) {
            return Math.max(0, count - 1);
          }
          return count;
        });
        return current.filter((item) => item.id !== id);
      });
    } catch (error) {
      console.warn("[notifications] Failed to delete", error);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    loadNotifications();
    const interval = window.setInterval(loadNotifications, 10000);
    const handleFocus = () => loadNotifications();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadNotifications();
      }
    };
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthorized]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        data-tour="notifications"
        type="button"
        onClick={() => {
          setOpen((value) => {
            const next = !value;
            if (next) {
              onOpen?.();
            }
            return next;
          });
        }}
        className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/60 bg-white text-primary shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition-colors hover:bg-white/90"
        aria-label={t("label")}
        title={t("label")}
      >
        <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
          <path
            d="M6 17h12l-1.5-2V11a4.5 4.5 0 0 0-9 0v4L6 17Zm4.5 2a1.5 1.5 0 0 0 3 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-50 px-1 text-[10px] font-bold text-rose-800">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-12 z-30 w-[320px] rounded-2xl border border-[#e1dfdc] bg-white p-3 shadow-[0_12px_30px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#1b1b1b]">
              {t("label")}
            </div>
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-[#555] hover:text-[#1b1b1b]"
            >
              {t("markAllRead")}
            </button>
          </div>
          <div className="mt-3 max-h-[320px] space-y-2 overflow-auto pr-1">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#e1dfdc] px-3 py-4 text-center text-xs text-[#777]">
                {t("empty")}
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="relative rounded-xl border border-[#f0ede7] bg-[#fbfaf8] px-3 py-2 text-sm text-[#1b1b1b] transition-colors hover:border-[#1b1b1b]"
                >
                  <button
                    type="button"
                    onClick={() => deleteOne(item.id)}
                    className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-transparent text-[#777] transition-colors hover:border-[#1b1b1b] hover:text-[#1b1b1b]"
                    aria-label={t("delete")}
                    title={t("delete")}
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24">
                      <path
                        d="M6 6l12 12M18 6l-12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  <a
                    href={item.link ?? "#"}
                    onClick={() => {
                      if (!item.readAt) {
                        void markOneRead(item.id);
                      }
                    }}
                    className="block pr-8 no-underline"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[13px] font-semibold">
                          {item.title}
                        </div>
                        {item.message ? (
                          <div className="mt-1 text-[12px] text-[#555]">
                            {item.message}
                          </div>
                        ) : null}
                      </div>
                      {!item.readAt ? (
                        <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[#1b1b1b]" />
                      ) : null}
                    </div>
                    <div className="mt-1 text-[11px] text-[#888]">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </a>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
