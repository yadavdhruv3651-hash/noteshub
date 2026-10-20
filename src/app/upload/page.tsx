
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import {
  Upload,
  FileText,
  CheckCircle2,
  ArrowLeft,
  FileUp,
  X,
  Info,
} from "lucide-react";

export default function UploadPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [branch, setBranch] = useState("");
  const [semester, setSemester] = useState("");
  const [resourceType, setResourceType] = useState("Study Notes");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!file) {
      setMessage("Please select a PDF file first.");
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setMessage("Please choose a PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Your PDF must be 10 MB or smaller.");
      return;
    }

    setIsUploading(true);

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setMessage("Please sign in before uploading notes.");
        return;
      }

      const safeFileName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(-150);

      const filePath = `${user.id}/${crypto.randomUUID()}-${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("notes")
        .upload(filePath, file, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { error: databaseError } = await supabase
        .from("notes")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          subject: subject.trim(),
          branch,
          semester,
          resource_type: resourceType,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          uploader_id: user.id,
          status: "pending",
        });

      if (databaseError) {
        throw new Error(
          `PDF uploaded, but its details could not be saved: ${databaseError.message}. Please contact the site administrator.`
        );
      }

      setSuccess(true);
      setMessage(
        "Your notes have been submitted successfully! They are pending approval before becoming available to other students."
      );

      setTitle("");
      setDescription("");
      setSubject("");
      setBranch("");
      setSemester("");
      setResourceType("Study Notes");
      setFile(null);

      const input = document.getElementById(
        "pdf-file"
      ) as HTMLInputElement | null;

      if (input) input.value = "";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafbff] px-5 py-10 text-slate-900 sm:py-14">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-indigo-600"
        >
          <ArrowLeft size={17} /> Back to Explore
        </Link>

        <div className="mt-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700">
            <Upload size={16} /> Community contribution
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Share your notes.
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            Help fellow students learn by sharing your notes, revision sheets,
            and study resources.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-9 space-y-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div>
            <h2 className="text-xl font-bold">Resource details</h2>
            <p className="mt-1 text-sm text-slate-500">
              Add enough information for students to find your resource.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="block text-sm font-semibold">
              Resource title *
            </label>
            <input
              id="title"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Data Structures Unit 1 Notes"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="subject" className="block text-sm font-semibold">
                Subject *
              </label>
              <input
                id="subject"
                required
                maxLength={80}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Data Structures"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="branch" className="block text-sm font-semibold">
                Branch / Course *
              </label>
              <select
                id="branch"
                required
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="">Select course</option>
                <option value="CSE">Computer Science (CSE)</option>
                <option value="IT">Information Technology (IT)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="EE">Electrical Engineering (EE)</option>
                <option value="ME">Mechanical Engineering (ME)</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="semester" className="block text-sm font-semibold">
                Semester *
              </label>
              <select
                id="semester"
                required
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option value="">Select semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={String(n)}>
                    Semester {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-semibold">
                Resource type *
              </label>
              <select
                id="type"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
              >
                <option>Study Notes</option>
                <option>Previous Year Paper</option>
                <option>Assignments</option>
                <option>Revision Notes</option>
                <option>Lab Manual</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-semibold">
              Description
            </label>
            <textarea
              id="description"
              rows={4}
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What topics does this resource cover?"
              className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
            />
            <p className="text-right text-xs text-slate-400">
              {description.length}/1000 characters
            </p>
          </div>

          <div className="space-y-3">
            <label htmlFor="pdf-file" className="block text-sm font-semibold">
              Upload PDF *
            </label>

            <label
              htmlFor="pdf-file"
              className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-9 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <FileUp size={28} />
              </span>
              <span className="mt-4 font-bold">Click to choose a PDF</span>
              <span className="mt-2 text-sm text-slate-500">
                PDF format only · Maximum 10 MB
              </span>
              <input
                id="pdf-file"
                type="file"
                accept=".pdf,application/pdf"
                required={!file}
                className="sr-only"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setMessage("");
                  setSuccess(false);
                }}
              />
            </label>

            {file && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <FileText className="shrink-0 text-indigo-600" size={25} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Remove selected file"
                  onClick={() => {
                    setFile(null);
                    const input = document.getElementById(
                      "pdf-file"
                    ) as HTMLInputElement | null;
                    if (input) input.value = "";
                  }}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            <Info className="mt-0.5 shrink-0" size={19} />
            <p>
              Only share material you have permission to distribute. Avoid
              uploading private information or copyrighted material without
              authorization. New submissions remain private until approved.
            </p>
          </div>

          {message && (
            <div
              role="status"
              className={`flex items-start gap-2 rounded-xl p-4 text-sm ${
                success
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
              <p>{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-4 font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload size={19} />
            {isUploading ? "Uploading..." : "Upload notes"}
          </button>

          <p className="text-center text-xs text-slate-400">
            Your PDF is stored privately and requires approval before publishing.
          </p>
        </form>

        <div className="mt-7 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5">
          <CheckCircle2 className="mt-0.5 shrink-0 text-indigo-600" size={22} />
          <div>
            <h3 className="font-bold">What happens next?</h3>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Your PDF and its details are saved in Supabase. After approval,
              it can be made available for students to download.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
