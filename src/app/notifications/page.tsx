
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Bell,
  CheckCheck,
  CheckCircle,
  Clock,
  LoaderCircle,
  RefreshCw,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type NotificationItem = {
  id: string;
  note_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.replace("/signin");
      return;
    }

    const { data, error: queryError } = await supabase
      .from("notifications")
      .select("id, note_id, title, message, is_read, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setNotifications([]);
    } else {
      setNotifications((data || []) as NotificationItem[]);
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function markAsRead(id: string) {
    setMarkingId(id);
    setError("");

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, is_read: true } : item
        )
      );
    }

    setMarkingId(null);
  }

  async function markAllAsRead() {
    const unreadIds = notifications
      .filter((item) => !item.is_read)
      .map((item) => item.id);

    if (unreadIds.length === 0) return;

    setMarkingAll(true);
    setError("");

    const { error: updateError } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (updateError) {
      setError(updateError.message);
    } else {
      setNotifications((current) =>
        current.map((item) => ({ ...item, is_read: true }))
      );
    }

    setMarkingAll(false);
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <BookOpen className="h-6 w-6 text-blue-600" />
            NotesHub
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Updates
            </p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold sm:text-4xl">
              <Bell className="h-8 w-8 text-blue-600" />
              Notifications
            </h1>
            <p className="mt-2 text-slate-600">
              Updates about your submitted notes.
            </p>
            {!loading && (
              <p className="mt-2 text-sm font-medium text-blue-700">
                {unreadCount} unread notification
                {unreadCount === 1 ? "" : "s"}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadNotifications}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>

            <button
              onClick={markAllAsRead}
              disabled={markingAll || unreadCount === 0}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {markingAll ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCheck className="h-4 w-4" />
              )}
              Mark all read
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-20 text-slate-500">
            <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-3">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Inbox className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-xl font-bold">You're all caught up!</h2>
            <p className="mt-2 text-slate-500">
              You'll see updates here when your uploaded notes are reviewed.
            </p>
            <Link
              href="/my-uploads"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              View My Uploads
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {notifications.map((item) => (
              <article
                key={item.id}
                className={`rounded-2xl border bg-white p-5 transition ${
                  item.is_read
                    ? "border-slate-200"
                    : "border-blue-200 shadow-sm"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-1 rounded-xl p-3 ${
                      item.title.toLowerCase().includes("approved")
                        ? "bg-green-50 text-green-600"
                        : item.title.toLowerCase().includes("rejected")
                        ? "bg-red-50 text-red-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {item.title.toLowerCase().includes("approved") ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : item.title.toLowerCase().includes("rejected") ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold">{item.title}</h2>
                      {!item.is_read && (
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.message}
                    </p>

                    <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDate(item.created_at)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {item.note_id && (
                        <Link
                          href="/my-uploads"
                          className="text-sm font-semibold text-blue-700 hover:underline"
                        >
                          View My Uploads
                        </Link>
                      )}

                      {!item.is_read && (
                        <button
                          onClick={() => markAsRead(item.id)}
                          disabled={markingId === item.id}
                          className="text-sm font-semibold text-slate-600 hover:text-blue-700 disabled:opacity-50"
                        >
                          {markingId === item.id
                            ? "Marking..."
                            : "Mark as read"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
