"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Profile = {
  name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile");

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setProfile(data.profile ?? data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    }

    fetchProfile();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/sign-in");
    router.refresh();
  }

  const initials =
    profile?.name
      ?.split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <span className="text-sm font-bold">A</span>
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">
            ApplyAI
          </h1>

          <p className="text-xs text-slate-400">
            Job Search Workspace
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        {/* Workspace */}
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Workspace
        </p>

        <div className="space-y-1">
          {/* Dashboard */}
          <Link
            href="/"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
              isActive("/")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>⌂</span>
            Dashboard
          </Link>

          {/* Tasks */}
          <Link
            href="/tasks"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
              isActive("/tasks")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>✓</span>
            Tasks
          </Link>
        </div>

        {/* AI Tools */}
        <p className="mb-3 mt-8 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          AI Tools
        </p>

        <div className="space-y-1">
          {/* Job Analyzer */}
          <Link
            href="/job-analyzer"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
              isActive("/job-analyzer")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>✦</span>
            Job Analyzer
          </Link>

          {/* My Analyses */}
          <Link
            href="/saved-analyses"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
              isActive("/saved-analyses")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>◷</span>
            My Job Analyses
          </Link>

          {/* Resume Builder */}
          <Link
            href="/resume-builder"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
              isActive("/resume-builder")
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span>▤</span>
            Resume Builder
          </Link>
        </div>

        {/* Sign out */}
        <div className="mt-6 border-t border-slate-200 pt-4">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-base transition group-hover:bg-red-100">
              ↪
            </span>

            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="border-t border-slate-100 p-4">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-slate-100"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {initials}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {profile?.name || "Loading..."}
            </p>

            <p className="truncate text-xs text-slate-400">
              {profile?.email || ""}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}