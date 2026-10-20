
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  LoaderCircle,
  Upload,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

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
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export default function MyUploadsPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  async function loadUploads() {
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
      .from("notes")
      .select(
        "id, title, description, subject, branch, semester, resource_type, file_path, file_name, file_size, status, created_at"
      )
      .eq("uploader_id", user.id)
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setNotes([]);
    } else {
      setNotes((data || []) as Note[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadUploads();
  }, []);

  async function downloadNote(note: Note) {
    setDownloading(note.id);
    setError("");

    const { data, error: urlError } = await supabase.storage
      .from("notes")
      .createSignedUrl(note.file_path, 60);

    if (urlError || !data?.signedUrl) {
      setError(urlError?.message || "Could not create the download link.");
      setDownloading(null);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    setDownloading(null);
  }

  const pending = notes.filter((note) => note.status === "pending").length;
  const approved = notes.filter((note) => note.status === "approved").length;
  const rejected = notes.filter((note) => note.status === "rejected").length;

  function formatSize(bytes: number | null) {
    if (bytes === null || bytes === undefined) return "Size unavailable";
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function statusDetails(status: Note["status"]) {
    if (status === "approved") {
      return {
        label: "Approved",
        icon: CheckCircle,
        color: "text-green-700 bg-green-50 border-green-200",
      };
    }

    if (status === "rejected") {
      return {
        label: "Rejected",
        icon: XCircle,
        color: "text-red-700 bg-red-50 border-red-200",
      };
    }

    return {
      label: "Pending review",
      icon: Clock,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    };
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
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

      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Your library
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              My Uploads
            </h1>
            <p className="mt-2 text-slate-600">
              Track your submitted notes and their review status.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={loadUploads}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium hover:bg-slate-100 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>

            <Link
              href="/upload"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              Upload notes
            </Link>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Pending review</p>
            <p className="mt-2 text-3xl font-bold text-amber-600">{pending}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Approved</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{approved}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Rejected</p>
            <p className="mt-2 text-3xl font-bold text-red-600">{rejected}</p>
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-20 text-slate-500">
            <LoaderCircle className="h-8 w-8 animate-spin" />
            <p className="mt-3">Loading your uploads...</p>
          </div>
        ) : notes.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-4 text-xl font-bold">No uploads yet</h2>
            <p className="mt-2 text-slate-500">
              Upload your first PDF to start building your library.
            </p>
            <Link
              href="/upload"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              <Upload className="h-4 w-4" />
              Upload your first note
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {notes.map((note) => {
              const status = statusDetails(note.status);
              const StatusIcon = status.icon;

              return (
                <article
                  key={note.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>

                      <div className="min-w-0">
                        <h2 className="break-words text-lg font-bold">
                          {note.title}
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {note.subject}
                          {note.semester ? ` · Semester ${note.semester}` : ""}
                          {note.branch ? ` · ${note.branch}` : ""}
                        </p>

                        {note.description && (
                          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">
                            {note.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>Uploaded {formatDate(note.created_at)}</span>
                          <span>{formatSize(note.file_size)}</span>
                          {note.resource_type && <span>{note.resource_type}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${status.color}`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </span>

                      {note.status === "approved" && (
                        <button
                          onClick={() => downloadNote(note)}
                          disabled={downloading === note.id}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {downloading === note.id ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          Download PDF
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
