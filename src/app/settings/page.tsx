
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  LogOut,
  LoaderCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function SettingsPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAccount() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/signin");
        return;
      }

      setEmail(user.email || "");
      setLoading(false);
    }

    loadAccount();
  }, [router]);

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage("Password changed successfully.");
    setPassword("");
    setConfirmPassword("");
  }

  async function signOut() {
    setSigningOut(true);
    setError("");

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setSigningOut(false);
      return;
    }

    router.replace("/signin");
    router.refresh();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <LoaderCircle className="mr-3 h-6 w-6 animate-spin text-blue-600" />
        Loading account settings...
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

      <section className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          Manage account
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
          Account Settings
        </h1>
        <p className="mt-2 text-slate-600">
          Manage your sign-in details and account session.
        </p>

        {message && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle className="h-5 w-5 shrink-0" />
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-50 p-3">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold">Email address</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your current sign-in email.
              </p>
              <p className="mt-3 break-all font-medium">{email}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-indigo-50 p-3">
              <LockKeyhole className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Change password</h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose a new password with at least 8 characters.
              </p>
            </div>
          </div>

          <form onSubmit={changePassword} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium"
              >
                New password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-12 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Enter the password again"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
            >
              {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {saving ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>

        <div className="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-red-50 p-3">
              <LogOut className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">Sign out</h2>
              <p className="mt-1 text-sm text-slate-500">
                Sign out of your current NotesHub session on this browser.
              </p>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                {signingOut && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
