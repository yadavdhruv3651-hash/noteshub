
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import {
  Search,
  FileText,
  BookOpen,
  Filter,
  ArrowUpRight,
  GraduationCap,
  Download,
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
  created_at: string;
};

const semesters = [
  "All semesters",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
];

export default function ExplorePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All subjects");
  const [semester, setSemester] = useState("All semesters");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadMessage, setDownloadMessage] = useState("");

  useEffect(() => {
    async function loadNotes() {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await supabase
        .from("notes")
        .select(
          "id, title, description, subject, branch, semester, resource_type, file_path, created_at"
        )
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError("Could not load notes. Please refresh and try again.");
      } else {
        setNotes((data ?? []) as Note[]);
      }

      setLoading(false);
    }

    loadNotes();
  }, []);

  const subjects = useMemo(
    () => [
      "All subjects",
      ...Array.from(new Set(notes.map((note) => note.subject))).sort(),
    ],
    [notes]
  );

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();

    return notes.filter((note) => {
      const matchesQuery =
        !q ||
        `${note.title} ${note.subject} ${note.description ?? ""} ${
          note.resource_type ?? ""
        } ${note.branch ?? ""} Semester ${note.semester ?? ""}`
          .toLowerCase()
          .includes(q);

      const matchesSubject =
        subject === "All subjects" || note.subject === subject;

      const matchesSemester =
        semester === "All semesters" || note.semester === semester;

      return matchesQuery && matchesSubject && matchesSemester;
    });
  }, [notes, query, subject, semester]);

  async function handleDownload(note: Note) {
    setDownloadingId(note.id);
    setDownloadMessage("");

    try {
      // Recheck approval before generating a temporary download link.
      const { data: approvedNote, error: checkError } = await supabase
        .from("notes")
        .select("file_path")
        .eq("id", note.id)
        .eq("status", "approved")
        .maybeSingle();

      if (checkError || !approvedNote) {
        throw new Error(
          "This note is unavailable or has not been approved."
        );
      }

      const { data, error: urlError } = await supabase.storage
        .from("notes")
        .createSignedUrl(approvedNote.file_path, 60);

      if (urlError || !data?.signedUrl) {
        throw new Error("Could not create a download link. Please try again.");
      }

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = `${note.title}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setDownloadMessage(
        err instanceof Error ? err.message : "Download failed."
      );
    } finally {
      setDownloadingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafbff] text-slate-900">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
            <BookOpen size={16} /> Resource library
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            Explore study notes
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Search study material by topic, subject, or semester. Find what you
            need and keep learning.
          </p>

          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-7 flex max-w-2xl items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"
          >
            <Search className="ml-2 shrink-0 text-slate-400" size={21} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'DSA', 'mathematics' or 'semester 3'..."
              className="min-w-0 flex-1 bg-transparent px-2 py-3 outline-none placeholder:text-slate-400"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold">Study resources</h2>
            <p className="mt-1 text-sm text-slate-500">
              {loading
                ? "Loading resources..."
                : `${filteredNotes.length} ${
                    filteredNotes.length === 1 ? "resource" : "resources"
                  } found`}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <Filter size={17} className="text-slate-400" />
              <select
                aria-label="Filter by subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="max-w-48 bg-transparent py-3 text-sm outline-none"
              >
                {subjects.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <GraduationCap size={17} className="text-slate-400" />
              <select
                aria-label="Filter by semester"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="bg-transparent py-3 text-sm outline-none"
              >
                {semesters.map((item) => (
                  <option
                    key={item}
                    value={item === "All semesters" ? item : item}
                  >
                    {item === "All semesters" ? item : `Semester ${item}`}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-7 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {downloadMessage && (
          <div
            role="status"
            className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800"
          >
            {downloadMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center text-slate-500">
            Loading approved notes...
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filteredNotes.map((note) => (
              <article
                key={note.id}
                className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <FileText size={23} />
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {note.resource_type || "Study Notes"}
                  </span>
                </div>

                <h3 className="mt-5 break-words text-lg font-bold">
                  {note.title}
                </h3>

                <p className="mt-2 flex-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-500">
                  {note.description || "No description provided."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                    {note.subject}
                  </span>
                  {note.branch && (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                      {note.branch}
                    </span>
                  )}
                  {note.semester && (
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                      Semester {note.semester}
                    </span>
                  )}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => handleDownload(note)}
                    disabled={downloadingId === note.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download size={17} />
                    {downloadingId === note.id
                      ? "Preparing..."
                      : "Download PDF"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
            <BookOpen className="mx-auto text-slate-400" size={35} />
            <h3 className="mt-4 text-lg font-bold">
              {notes.length === 0
                ? "No approved notes yet"
                : "No matching notes"}
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {notes.length === 0
                ? "Once a note is approved, it will appear here."
                : "Try another search or reset your filters."}
            </p>
            <button
              onClick={() => {
                setQuery("");
                setSubject("All subjects");
                setSemester("All semesters");
              }}
              className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Clear filters
            </button>
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-indigo-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-5">
          <div>
            <h3 className="font-bold text-slate-900">
              Have useful notes to share?
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Help other students by contributing your study material.
            </p>
          </div>
          <Link
            href="/upload"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 sm:mt-0"
          >
            Upload notes <ArrowUpRight size={17} />
          </Link>
        </div>
      </section>
    </main>
  );
}
