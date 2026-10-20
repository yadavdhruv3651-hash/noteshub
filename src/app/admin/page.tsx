"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

type Note = {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  branch: string | null;
  semester: string | null;
  resource_type: string | null;
  file_path: string;
  file_name: string | null;
  file_size: number | null;
  uploader_id: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function checkAdmin() {
      const { data, error } = await supabase.auth.getUser();

      if (!active) return;

      if (error || !data.user) {
        router.replace("/signin");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!active) return;

      if (profileError || profile?.role !== "admin") {
        setIsAdmin(false);
        setChecking(false);
        return;
      }

      setIsAdmin(true);
      setChecking(false);
    }

    checkAdmin();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (checking || !isAdmin) return;

    async function loadNotes() {
      setLoadingNotes(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("notes")
        .select(
          "id, title, description, subject, branch, semester, resource_type, file_path, file_name, file_size, uploader_id, status, created_at"
        )
        .eq("status", filter)
        .order("created_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
        setNotes([]);
      } else {
        setNotes((data ?? []) as Note[]);
      }

      setLoadingNotes(false);
    }

    loadNotes();
  }, [checking, isAdmin, filter]);

  async function reviewNote(note: Note, status: "approved" | "rejected") {
    const action = status === "approved" ? "approve" : "reject";

    if (
      !window.confirm(
        `Are you sure you want to ${action} "${note.title}"?`
      )
    ) {
      return;
    }

    setBusyId(note.id);
    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("notes")
      .update({ status })
      .eq("id", note.id)
      .eq("status", "pending");

    if (error) {
      setErrorMessage(
        `Could not ${action} this note: ${error.message}. Admin update permissions may not be configured yet.`
      );
      setBusyId(null);
      return;
    }

    setNotes((current) => current.filter((item) => item.id !== note.id));
    setMessage(`"${note.title}" has been ${status}.`);
    setBusyId(null);
  }

  async function previewNote(note: Note) {
    setErrorMessage("");

    const { data, error } = await supabase.storage
      .from("notes")
      .createSignedUrl(note.file_path, 60);

    if (error || !data?.signedUrl) {
      setErrorMessage(
        error?.message ?? "Could not create a preview link for this PDF."
      );
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.replace("/signin");
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-600">
          <LoaderCircle className="animate-spin" />
          Checking administrator access...
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto text-red-500" size={44} />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Administrator access required
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            This page is for NotesHub administrators only. If you are the site
            owner, check that your account has the admin role in Supabase.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
          >
            <ArrowLeft size={17} /> Back to NotesHub
          </Link>
        </div>
      </main>
    );
  }

  const pendingCount = filter === "pending" ? notes.length : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BookOpen size={24} />
            </span>
            <span>
              <span className="block text-xl font-extrabold">
                Notes<span className="text-indigo-600">Hub</span>
              </span>
              <span className="text-xs text-slate-500">Admin Dashboard</span>
            </span>
          </Link>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft size={16} /> Back to homepage
        </Link>

        <div className="mt-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700">
              <ShieldCheck size={15} /> Administrator
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              Notes review
            </h1>
            <p className="mt-2 text-slate-600">
              Review student submissions before making them available to everyone.
            </p>
          </div>

          <button
            onClick={() => router.refresh()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-100"
          >
            <RefreshCw size={16} /> Refresh page
          </button>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { key: "pending", label: "Pending review", icon: Clock },
            { key: "approved", label: "Approved notes", icon: CheckCircle },
            { key: "rejected", label: "Rejected notes", icon: XCircle },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                onClick={() => setFilter(item.key as typeof filter)}
                className={`rounded-2xl border p-4 text-left transition ${
                  filter === item.key
                    ? "border-indigo-300 bg-indigo-50 ring-2 ring-indigo-100"
                    : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">
                    {item.label}
                  </span>
                  <Icon
                    size={20}
                    className={filter === item.key ? "text-indigo-600" : "text-slate-400"}
                  />
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  {filter === item.key ? "Currently viewing" : "View submissions"}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold capitalize">
              {filter === "pending" ? "Waiting for review" : `${filter} submissions`}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {loadingNotes
                ? "Loading submissions..."
                : `${notes.length} submission${notes.length === 1 ? "" : "s"} shown`}
              {pendingCount !== null && pendingCount > 0 ? " · Action required" : ""}
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {loadingNotes ? (
          <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-slate-500">
            <LoaderCircle className="animate-spin" /> Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <FileText className="mx-auto text-slate-300" size={44} />
            <h3 className="mt-4 text-lg font-bold">No {filter} notes</h3>
            <p className="mt-2 text-sm text-slate-500">
              {filter === "pending"
                ? "New student submissions will appear here."
                : `Notes with ${filter} status will appear here.`}
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {notes.map((note) => (
              <article
                key={note.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <FileText size={24} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-bold">{note.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{note.subject}</p>

                      {note.description && (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                          {note.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {note.branch && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                            {note.branch}
                          </span>
                        )}
                        {note.semester && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                            {note.semester}
                          </span>
                        )}
                        {note.resource_type && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                            {note.resource_type}
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-xs text-slate-400">
                        Submitted {new Date(note.created_at).toLocaleString()}
                        {note.file_name ? ` · ${note.file_name}` : ""}
                        {note.file_size
                          ? ` · ${(note.file_size / (1024 * 1024)).toFixed(2)} MB`
                          : ""}
                      </p>

                      <button
                        onClick={() => previewNote(note)}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"
                      >
                        <ExternalLink size={16} /> Preview PDF
                      </button>
                    </div>
                  </div>

                  {filter === "pending" && (
                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                      <button
                        disabled={busyId === note.id}
                        onClick={() => reviewNote(note, "approved")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {busyId === note.id ? (
                          <LoaderCircle className="animate-spin" size={17} />
                        ) : (
                          <CheckCircle size={17} />
                        )}
                        Approve
                      </button>

                      <button
                        disabled={busyId === note.id}
                        onClick={() => reviewNote(note, "rejected")}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <XCircle size={17} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
