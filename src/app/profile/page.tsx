
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  UserRound,
  Mail,
  ShieldCheck,
  CalendarDays,
  FileText,
  LoaderCircle,
  Upload,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("student");
  const [createdAt, setCreatedAt] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        router.replace("/signin");
        return;
      }

      setEmail(user.email || "Email unavailable");
      setCreatedAt(user.created_at || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      setRole(profile?.role || "student");
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Unavailable";

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-600">
        <LoaderCircle className="h-9 w-9 animate-spin text-blue-600" />
        <p className="mt-3">Loading your profile...</p>
      </main>
    );
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

      <section className="mx-auto max-w-5xl px-5 py-10">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            Account
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">My Profile</h1>
          <p className="mt-2 text-slate-600">
            View your NotesHub account information.
          </p>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white sm:px-8">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/40 bg-white/20">
                <UserRound className="h-10 w-10" />
              </div>

              <div className="min-w-0">
                <h2 className="break-all text-xl font-bold sm:text-2xl">
                  {email}
                </h2>
                <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm capitalize">
                  <ShieldCheck className="h-4 w-4" />
                  {role}
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            <div className="flex items-start gap-4 px-6 py-5 sm:px-8">
              <Mail className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
              <div className="min-w-0">
                <p className="text-sm text-slate-500">Email address</p>
                <p className="mt-1 break-all font-medium">{email}</p>
              </div>
            </div>

            <div className="flex items-start gap-4 px-6 py-5 sm:px-8">
              <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Account role</p>
                <p className="mt-1 font-medium capitalize">{role}</p>
                <p className="mt-1 text-sm text-slate-500">
                  Your role determines which account features are available.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 px-6 py-5 sm:px-8">
              <CalendarDays className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Member since</p>
                <p className="mt-1 font-medium">{formattedDate}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/my-uploads"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
          >
            <div className="rounded-xl bg-blue-50 p-3">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">My Uploads</h3>
              <p className="mt-1 text-sm text-slate-500">
                Track your submitted notes.
              </p>
            </div>
          </Link>

          <Link
            href="/upload"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-300 hover:shadow-sm"
          >
            <div className="rounded-xl bg-indigo-50 p-3">
              <Upload className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">Upload Notes</h3>
              <p className="mt-1 text-sm text-slate-500">
                Share a PDF with other students.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
