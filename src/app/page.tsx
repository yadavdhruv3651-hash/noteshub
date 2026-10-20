
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import {
  Search,
  BookOpen,
  Upload,
  FileText,
  ArrowRight,
  GraduationCap,
  Code2,
  Calculator,
  Atom,
  Menu,
  X,
  Sparkles,
  Download,
  UserRound,
  Settings,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Bell,
} from "lucide-react";

const subjects = [
  { name: "Computer Science", detail: "Programming, DSA & more", icon: Code2, color: "blue" },
  { name: "Mathematics", detail: "Notes, formulas & solutions", icon: Calculator, color: "purple" },
  { name: "Physics", detail: "Concepts & derivations", icon: Atom, color: "orange" },
  { name: "Engineering", detail: "Core subjects & concepts", icon: GraduationCap, color: "green" },
];

const sampleNotes = [
  { title: "Data Structures & Algorithms", subject: "Computer Science", semester: "Semester 3", type: "Study Notes" },
  { title: "Discrete Mathematics", subject: "Mathematics", semester: "Semester 3", type: "Revision Notes" },
  { title: "Object-Oriented Programming", subject: "Computer Science", semester: "Semester 2", type: "Lecture Notes" },
];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAccount() {
      const { data, error } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!mounted) return;

      if (error || !user) {
        setIsLoggedIn(false);
        setUserEmail("");
        setIsAdmin(false);
        setUnreadCount(0);
        setAuthChecked(true);
        return;
      }

      setIsLoggedIn(true);
      setUserEmail(user.email ?? "");

      const [profileResult, notificationResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("is_read", false),
      ]);

      if (mounted) {
        setIsAdmin(profileResult.data?.role === "admin");
        setUnreadCount(notificationResult.count ?? 0);
        setAuthChecked(true);
      }
    }

    loadAccount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      setIsLoggedIn(!!session);
      setUserEmail(session?.user.email ?? "");
      setIsAdmin(false);
      setProfileOpen(false);
      setAuthChecked(true);

      if (session?.user) {
        const userId = session.user.id;

        setTimeout(async () => {
          const [profileResult, notificationResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("role")
              .eq("id", userId)
              .maybeSingle(),
            supabase
              .from("notifications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("is_read", false),
          ]);

          if (mounted) {
            setIsAdmin(profileResult.data?.role === "admin");
            setUnreadCount(notificationResult.count ?? 0);
          }
        }, 0);
      } else {
        setUnreadCount(0);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Could not sign out. Please try again.");
      return;
    }

    setIsLoggedIn(false);
    setUserEmail("");
    setIsAdmin(false);
    setUnreadCount(0);
    setProfileOpen(false);
    setMenuOpen(false);
    router.push("/");
  }

  const avatarLetter = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  function AccountMenu() {
    return (
      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => setProfileOpen((open) => !open)}
          aria-label="Open account menu"
          aria-expanded={profileOpen}
          className="flex items-center gap-2 rounded-full p-1.5 transition hover:bg-slate-100"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white ring-2 ring-indigo-100">
            {avatarLetter}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-500 transition ${profileOpen ? "rotate-180" : ""}`}
          />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-14 z-[60] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
            <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
                {avatarLetter}
              </div>
              <p className="mt-3 text-center font-bold text-slate-900">
                Your NotesHub Account
              </p>
              <p className="mt-1 break-all text-center text-sm text-slate-500">
                {userEmail}
              </p>
              {isAdmin && (
                <div className="mt-3 text-center">
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                    Administrator
                  </span>
                </div>
              )}
            </div>

            <div className="p-2">
              <Link
                href="/notifications"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Bell size={18} />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/profile"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                <UserRound size={18} />
                My Profile
              </Link>

              <Link
                href="/my-uploads"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                <FileText size={18} />
                My Uploads
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <LayoutDashboard size={18} />
                  Admin Dashboard
                </Link>
              )}

              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-700"
              >
                <Settings size={18} />
                Account Settings
              </Link>

              <div className="my-2 border-t border-slate-100" />

              <button
                type="button"
                onClick={handleSignOut}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafbff] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <BookOpen size={23} />
            </span>
            <span className="text-2xl font-extrabold tracking-tight">
              Notes<span className="text-indigo-600">Hub</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <Link className="transition hover:text-indigo-600" href="/">Home</Link>
            <Link className="transition hover:text-indigo-600" href="/explore">Explore notes</Link>
            <Link className="transition hover:text-indigo-600" href="/upload">Upload notes</Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {!authChecked ? (
              <span className="px-4 py-2.5 text-sm text-slate-400">Loading...</span>
            ) : isLoggedIn ? (
              <>
                <Link
                  href="/notifications"
                  aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                  title="Notifications"
                  className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <Bell size={21} />
                  {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
                <AccountMenu />
              </>
            ) : (
              <>
                <Link href="/signin" className="rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-slate-100">
                  Sign in
                </Link>
                <Link href="/signup" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700">
                  Get started <ArrowRight className="ml-1 inline" size={16} />
                </Link>
              </>
            )}
          </div>

          <button
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
          >
            {menuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>

        {menuOpen && (
          <nav className="flex flex-col gap-1 border-t border-slate-100 bg-white p-4 md:hidden">
            <Link onClick={() => setMenuOpen(false)} className="rounded-lg p-3 hover:bg-slate-50" href="/">Home</Link>
            <Link onClick={() => setMenuOpen(false)} className="rounded-lg p-3 hover:bg-slate-50" href="/explore">Explore notes</Link>
            <Link onClick={() => setMenuOpen(false)} className="rounded-lg p-3 hover:bg-slate-50" href="/upload">Upload notes</Link>

            {!authChecked ? (
              <p className="rounded-lg p-3 text-sm text-slate-400">Checking login...</p>
            ) : isLoggedIn ? (
              <>
                <div className="mx-2 my-2 rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                      {avatarLetter}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">Your account</p>
                      <p className="break-all text-xs text-slate-500">{userEmail}</p>
                    </div>
                  </div>
                </div>

                <Link onClick={() => setMenuOpen(false)} className="flex items-center justify-between rounded-lg p-3 hover:bg-slate-50" href="/notifications">
                  <span className="flex items-center gap-2"><Bell size={18} /> Notifications</span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>

                <Link onClick={() => setMenuOpen(false)} className="rounded-lg p-3 hover:bg-slate-50" href="/profile">My Profile</Link>
                <Link onClick={() => setMenuOpen(false)} className="rounded-lg p-3 hover:bg-slate-50" href="/my-uploads">My Uploads</Link>
                {isAdmin && (
                  <Link onClick={() => setMenuOpen(false)} className="rounded-lg p-3 hover:bg-slate-50" href="/admin">Admin Dashboard</Link>
                )}
                <Link onClick={() => setMenuOpen(false)} className="rounded-lg p-3 hover:bg-slate-50" href="/settings">Account Settings</Link>
                <button type="button" onClick={handleSignOut} className="rounded-lg p-3 text-left font-semibold text-red-600 hover:bg-red-50">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link onClick={() => setMenuOpen(false)} className="rounded-lg p-3 hover:bg-slate-50" href="/signin">Sign in</Link>
                <Link onClick={() => setMenuOpen(false)} className="rounded-lg bg-indigo-600 p-3 text-center font-semibold text-white" href="/signup">Get started</Link>
              </>
            )}
          </nav>
        )}
      </header>

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-32 top-12 h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-20 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 md:grid-cols-2 md:py-28 lg:px-8">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm">
              <Sparkles size={16} /> Your learning, made simpler
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              Better notes.
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent">
                Better grades.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Discover useful study notes, share what you know, and prepare for exams with a student community that learns together.
            </p>

            <form action="/explore" className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-indigo-900/5">
              <Search className="ml-2 shrink-0 text-slate-400" size={21} />
              <input
                name="q"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subjects, notes, topics..."
                className="min-w-0 flex-1 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-slate-400"
              />
              <button className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700" type="submit">
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5"><BookOpen size={16} /> Study resources</span>
              <span className="flex items-center gap-1.5"><Upload size={16} /> Share your notes</span>
              <span className="flex items-center gap-1.5"><GraduationCap size={17} /> Learn together</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-indigo-200/60 to-violet-200/60 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-indigo-900/10 sm:p-7">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <p className="text-sm text-slate-500">Your study space</p>
                  <h2 className="mt-1 text-xl font-bold">Keep learning 📚</h2>
                </div>
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600"><BookOpen size={25} /></div>
              </div>

              <div className="mt-5 space-y-3">
                {sampleNotes.map((note, i) => (
                  <div key={note.title} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3.5 transition hover:border-indigo-200 hover:bg-indigo-50/40">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${i === 0 ? "bg-blue-50 text-blue-600" : i === 1 ? "bg-purple-50 text-purple-600" : "bg-emerald-50 text-emerald-600"}`}>
                      <FileText size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold">{note.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{note.semester} · {note.type}</p>
                    </div>
                    <Download size={17} className="shrink-0 text-slate-400" />
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 p-5 text-white">
                <p className="text-sm text-indigo-100">A little progress every day</p>
                <p className="mt-1 text-xl font-bold">Your next exam starts here.</p>
                <Link href="/explore" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:gap-3">
                  Explore resources <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-600">Find your subject</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">What are you studying?</h2>
            <p className="mt-3 text-slate-600">Start with a subject and find resources for your next study session.</p>
          </div>
          <Link href="/explore" className="inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800">
            Explore all <ArrowRight size={17} />
          </Link>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            const colors: Record<string, string> = {
              blue: "bg-blue-50 text-blue-600",
              purple: "bg-purple-50 text-purple-600",
              orange: "bg-orange-50 text-orange-600",
              green: "bg-emerald-50 text-emerald-600",
            };
            return (
              <Link key={subject.name} href={`/explore?subject=${encodeURIComponent(subject.name)}`} className="group rounded-2xl border border-slate-200/80 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/5">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors[subject.color]}`}>
                  <Icon size={24} />
                </div>
                <h3 className="mt-5 font-bold">{subject.name}</h3>
                <p className="mt-2 text-sm text-slate-500">{subject.detail}</p>
                <div className="mt-5 flex items-center justify-between text-sm font-semibold text-indigo-600">
                  Browse notes <ArrowRight size={17} className="transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        <div className="rounded-[2rem] bg-slate-900 px-7 py-12 text-white sm:px-12 md:flex md:items-center md:justify-between md:gap-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">Give back to the community</p>
            <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">Your notes could help someone ace an exam.</h2>
            <p className="mt-4 leading-7 text-slate-300">Share your study material and make learning a little easier for everyone.</p>
          </div>
          <Link href="/upload" className="mt-7 inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-slate-900 transition hover:bg-indigo-50 md:mt-0">
            <Upload size={19} /> Upload notes <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-slate-900">
            <BookOpen size={20} className="text-indigo-600" /> NotesHub
          </Link>
          <p>Built for students, powered by sharing.</p>
          <div className="flex gap-5">
            <Link href="/explore" className="hover:text-indigo-600">Explore</Link>
            <Link href="/upload" className="hover:text-indigo-600">Upload</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
