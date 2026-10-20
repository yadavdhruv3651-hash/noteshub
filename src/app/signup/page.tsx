"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

export default function SignUpPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Your password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: name.trim(),
          },
        },
      });

      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        setMessage("Account created successfully! Redirecting...");
        router.push("/");
        router.refresh();
      } else {
        setMessage(
          "Account created! Check your email for a confirmation link before signing in."
        );
      }
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 text-2xl font-bold text-slate-900"
        >
          <span className="rounded-xl bg-blue-600 p-2 text-white">
            <BookOpen size={24} />
          </span>
          Notes<span className="text-blue-600">Hub</span>
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
          <h1 className="text-2xl font-bold text-slate-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Join NotesHub and learn together.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                Full name
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500">
                <User size={18} className="text-slate-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500">
                <Mail size={18} className="text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 focus-within:border-blue-500">
                <Lock size={18} className="text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                  className="w-full py-3 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {message && (
            <p role="status" className="mt-4 break-words rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
              {message}
            </p>
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link href="/signin" className="font-semibold text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-slate-500 hover:text-blue-600">
            ← Back to homepage
          </Link>
        </p>
      </div>
    </main>
  );
}