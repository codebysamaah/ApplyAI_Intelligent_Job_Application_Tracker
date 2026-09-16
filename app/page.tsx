"use client";

import { Aoboshi_One } from "next/font/google";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type Application = {
  id: number;
  company: string;
  jobTitle: string;
  jobType: "FULL_TIME" | "INTERNSHIP" | "PART_TIME" | "COOP" | "CONTRACT" | "OTHER";
  status: "SAVED" | "APPLIED" | "OA" | "INTERVIEW" | "OFFER" | "REJECTED";
  applicationDate: string | null;
  deadline: string | null;
  jobUrl: string | null;
  location: string | null;
  salary: string | null;
  notes: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
};

const statusStyles: Record<Application["status"], string> = {
  SAVED: "bg-slate-100 text-slate-700",
  APPLIED: "bg-blue-50 text-blue-700",
  OA: "bg-violet-50 text-violet-700",
  INTERVIEW: "bg-amber-50 text-amber-700",
  OFFER: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-700",
};

const priorityStyles: Record<Application["priority"], string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-red-50 text-red-700",
};

const statuses: Application["status"][] = [
  "SAVED",
  "APPLIED",
  "OA",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
];

type Analytics = {
  metrics: {
    applicationsThisMonth: number;
    responseRate: number;
    interviewRate: number;
    averageApplicationToInterview: number | null;
  };

  statusBreakdown: {
    SAVED: number;
    APPLIED: number;
    OA: number;
    INTERVIEW: number;
    OFFER: number;
    REJECTED: number;
  };

  topCompanies: {
    company: string;
    count: number;
  }[];

  topRoles: {
    role: string;
    count: number;
  }[];

  interviewApplications: number;
  respondedApplications: number;

  aiSummary: string;
};

function formatStatus(status: Application["status"]) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function formatJobType(jobType: Application["jobType"]) {
  return jobType
    .replace("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return "—";

  const today = new Date();
  const deadlineDate = new Date(deadline);

  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  const difference =
    deadlineDate.getTime() - today.getTime();

  const days = Math.ceil(
    difference / (1000 * 60 * 60 * 24)
  );

  const date = deadlineDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  if (days < 0) {
    return `${date} • Overdue`;
  }

  if (days === 0) {
    return `${date} • Due today`;
  }

  if (days === 1) {
    return `${date} • Due tomorrow`;
  }

  if (days <= 3) {
    return `${date} • Due in ${days} days`;
  }

  return date;
}

function StatCard({
  title,
  value,
  icon,
  className,
  }: {
  title: string;
  value: number;
  icon: string;
  className: string;
  }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg shadow-sm ring-1 ring-slate-200">
          {icon}
        </div>
      </div>
    </div>
  );
}

function AnalyticsMetric({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <div className="group px-5 py-4 transition-colors hover:bg-gray-50/70">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
        {value}
      </p>

      {subtext && (
        <p className="mt-0.5 text-[11px] text-gray-400">
          {subtext}
        </p>
      )}
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    Application["status"] | "ALL"
  >("ALL");

  const [jobTypeFilter, setJobTypeFilter] = useState<
  Application["jobType"] | "ALL"
>("ALL");

const [priorityFilter, setPriorityFilter] = useState<
  Application["priority"] | "ALL"
>("ALL");

  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Form state
  const [form, setForm] = useState({
    company: "",
    jobTitle: "",
    jobType: "FULL_TIME",
    status: "SAVED",
    applicationDate: "",
    deadline: "",
    jobUrl: "",
    location: "",
    salary: "",
    notes: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);

        const response = await fetch("/api/dashboard/analytics");

        if (!response.ok) {
          throw new Error("Failed to fetch analytics");
        }

        const data = await response.json();

        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
      try {
        setLoading(true);

        const response = await fetch("/api/applications");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to fetch applications"
          );
        }

        setApplications(data.applications ?? []);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
  }

  function openModal() {
    setForm({
      company: "",
      jobTitle: "",
      jobType: "FULL_TIME",
      status: "SAVED",
      applicationDate: "",
      deadline: "",
      jobUrl: "",
      location: "",
      salary: "",
      notes: "",
      priority: "MEDIUM",
    });

  setShowModal(true);
}

  function closeModal() {
    if (!submitting) {
      setShowModal(false);
    }
  }

  function updateForm(field: string, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.company.trim() || !form.jobTitle.trim()) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        company: form.company.trim(),
        jobTitle: form.jobTitle.trim(),
        jobType: form.jobType,
        status: form.status,
        applicationDate: form.applicationDate || null,
        deadline: form.deadline || null,
        jobUrl: form.jobUrl.trim() || null,
        location: form.location.trim() || null,
        salary: form.salary.trim() || null,
        notes: form.notes.trim() || null,
        priority: form.priority,
      };

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.error || "Failed to create application"
        );
      }

      const savedApplication = await response.json();

      setApplications((current) => [
        savedApplication,
        ...current,
      ]);

      setShowModal(false);
    } catch (error) {
      console.error("Failed to create application:", error);

      alert("Failed to create application. Please try again.");
    } finally {
      setSubmitting(false);
    }
}

async function handleDelete(id: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this application?"
  );

  if (!confirmed) {
    return;
  }

  try {
    setDeletingId(id);

    const response = await fetch(`/api/applications/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorData = await response.json();

      throw new Error(
        errorData.error || "Failed to delete application"
      );
    }

    setApplications((current) =>
      current.filter((application) => application.id !== id)
    );
  } catch (error) {
    console.error("Failed to delete application:", error);

    alert("Failed to delete application. Please try again.");
  } finally {
    setDeletingId(null);
  }
}

const filteredApplications = useMemo(() => {
  return applications.filter((application) => {
    const company = application.company ?? "";
    const jobTitle = application.jobTitle ?? "";

    const matchesSearch =
      company.toLowerCase().includes(search.toLowerCase()) ||
      jobTitle.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      application.status === statusFilter;

    const matchesJobType =
      jobTypeFilter === "ALL" ||
      application.jobType === jobTypeFilter;

    const matchesPriority =
      priorityFilter === "ALL" ||
      application.priority === priorityFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesJobType &&
      matchesPriority
    );
  });
}, [
  applications,
  search,
  statusFilter,
  jobTypeFilter,
  priorityFilter,
]);

  const stats = {
    total: applications.length,
    applied: applications.filter((app) => app.status === "APPLIED").length,
    interviews: applications.filter(
      (app) => app.status === "INTERVIEW"
    ).length,
    offers: applications.filter((app) => app.status === "OFFER").length,
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">

        <Sidebar />

        {/* Main */}
        <main className="flex-1">
          <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Workspace / Dashboard
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                Overview
              </p>
            </div>

            <button
              onClick={() => openModal()}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
            >
              + Add Application
            </button>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

            {/* Heading */}
            <div className="mb-8">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Good morning
                </h2>

                <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                  ApplyAI
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Track your job search and stay on top of every opportunity.
              </p>
            </div>

            {/* Dashboard Analytics */}
            <section className="mt-3">
              {analyticsLoading ? (
                <div className="h-48 animate-pulse rounded-2xl border border-gray-200 bg-white" />
              ) : analytics ? (
                <div className="relative overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-white via-white to-violet-50/60 shadow-sm">

                  {/* AI ambient glow */}
                  <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-violet-300/20 blur-3xl" />
                  <div className="pointer-events-none absolute right-1/4 top-0 h-32 w-32 rounded-full bg-indigo-200/20 blur-3xl" />

                  {/* AI Header */}
                  <div className="relative border-b border-violet-100/80 px-5 py-4">
                    <div className="flex items-start gap-3">

                      {/* AI Icon */}
                      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-600 text-white shadow-md shadow-violet-200">
                        <span className="text-base">✦</span>

                        {/* Small sparkle */}
                        <span className="absolute -right-1 -top-1 text-[9px] text-violet-400">
                          ✦
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="text-sm font-semibold tracking-tight text-gray-900">
                            Job Search Insights
                          </h2>

                          {/* AI Badge */}
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-violet-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shadow-sm shadow-violet-300" />
                            AI Powered
                          </span>

                          <span className="text-[10px] text-gray-400">
                            • This month
                          </span>
                        </div>

                        <p className="mt-1.5 max-w-4xl text-xs leading-5 text-gray-500">
                          {analytics.aiSummary}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="relative grid grid-cols-2 sm:grid-cols-4">

                    <AnalyticsMetric
                      label="Applications"
                      value={analytics.metrics.applicationsThisMonth}
                      subtext="this month"
                    />

                    <AnalyticsMetric
                      label="Response Rate"
                      value={`${analytics.metrics.responseRate}%`}
                      subtext={`${analytics.respondedApplications} responses`}
                    />

                    <AnalyticsMetric
                      label="Interview Rate"
                      value={`${analytics.metrics.interviewRate}%`}
                      subtext={`${analytics.interviewApplications} interviews`}
                    />

                    <AnalyticsMetric
                      label="Avg. to Interview"
                      value={
                        analytics.metrics.averageApplicationToInterview !== null
                          ? `${analytics.metrics.averageApplicationToInterview}d`
                          : "—"
                      }
                      subtext="average time"
                    />

                  </div>

                  {/* AI footer accent */}
                  <div className="h-[2px] w-full bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 opacity-70" />
                </div>
              ) : null}
            </section>

            {/* Stats */}
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Total Applications"
                value={stats.total}
                icon="▣"
                className="bg-gradient-to-br from-indigo-50 to-white"
              />

              <StatCard
                title="Applications Sent"
                value={stats.applied}
                icon="↗"
                className="bg-gradient-to-br from-blue-50 to-white"
              />

              <StatCard
                title="Interviews"
                value={stats.interviews}
                icon="★"
                className="bg-gradient-to-br from-violet-50 to-white"
              />

              <StatCard
                title="Offers"
                value={stats.offers}
                icon="✓"
                className="bg-gradient-to-br from-emerald-50 to-white"
              />
            </div>

            {/* Pipeline */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    Application Pipeline
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Track where your applications stand.
                  </p>
                </div>

                <div className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                  {applications.length} total
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {statuses.map((status) => {
                  const count = applications.filter(
                    (app) => app.status === status
                  ).length;

                  return (
                    <div
                      key={status}
                      className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-indigo-100 hover:bg-indigo-50/40"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusStyles[status]}`}
                        >
                          {formatStatus(status)}
                        </span>

                        <span className="text-lg font-bold text-slate-800">
                          {count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Applications */}
            <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Recent Applications
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Manage and monitor your job applications.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">

                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                        ⌕
                      </span>

                      <input
                        type="text"
                        placeholder="Search applications..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100 sm:w-64"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value as Application["status"] | "ALL"
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="ALL">All statuses</option>

                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={jobTypeFilter}
                      onChange={(e) =>
                        setJobTypeFilter(
                          e.target.value as Application["jobType"] | "ALL"
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="ALL">All job types</option>
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="COOP">COOP</option>
                      <option value="INTERNSHIP">Internship</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="OTHER">Other</option>
                    </select>

                    <select
                      value={priorityFilter}
                      onChange={(e) =>
                        setPriorityFilter(
                          e.target.value as Application["priority"] | "ALL"
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-600 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="ALL">All priorities</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center px-6 py-20">
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                    Loading applications...
                  </div>
                </div>
              ) : filteredApplications.length === 0 ? (
                <div className="px-6 py-20 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-xl text-indigo-600">
                    ✦
                  </div>

                  <h4 className="mt-4 text-sm font-semibold text-slate-900">
                    No applications found
                  </h4>

                  <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                    Start tracking your job search by adding your first
                    application.
                  </p>

                  <button
                    onClick={() => openModal()}
                    className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md"
                  >
                    + Add Application
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Company
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Role
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Type
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Status
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Priority
                        </th>

                        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Deadline
                        </th>

                        <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredApplications.map((application) => (
                        <tr
                          key={application.id}
                          className="border-b border-slate-100 last:border-0 transition hover:bg-indigo-50/30"
                        >
                        <td className="px-6 py-4">
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(`/applications/${application.id}`)
                                  }
                                  className="text-left"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-sm font-bold text-indigo-600">
                                      {application.company
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>

                                    <div>
                                      <p className="font-semibold text-slate-800 hover:text-indigo-600">
                                        {application.company}
                                      </p>

                                      {application.location && (
                                        <p className="mt-0.5 text-xs text-slate-400">
                                          {application.location}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                          </td>

                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(`/applications/${application.id}`)
                              }
                              className="text-left"
                            >
                              <p className="text-sm font-medium text-slate-800 hover:text-indigo-600">
                                {application.jobTitle}
                              </p>
                            </button>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-500">
                              {formatJobType(application.jobType)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[application.status]}`}
                            >
                              {formatStatus(application.status)}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[application.priority]}`}
                            >
                              {application.priority.charAt(0) +
                                application.priority.slice(1).toLowerCase()}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-500">
                              {formatDeadline(application.deadline)}
                            </span>
                          </td>

                          <td className="px-6 py-4">

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleDelete(application.id)}
                              disabled={deletingId === application.id}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deletingId === application.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add Application Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                    ✦
                  </div>

                  <h2 className="text-lg font-bold text-slate-900">
                    Add Application
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Add a new opportunity to your job search.
                </p>
              </div>

              <button
                onClick={closeModal}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">

              {/* Basic Information */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Basic Information
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Tell us about the position you're applying for.
                </p>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">

                {/* Company */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Company <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    required
                    value={form.company}
                    onChange={(e) =>
                      updateForm("company", e.target.value)
                    }
                    placeholder="e.g. Microsoft"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Job Title */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Job Title <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    required
                    value={form.jobTitle}
                    onChange={(e) =>
                      updateForm("jobTitle", e.target.value)
                    }
                    placeholder="e.g. Software Engineer"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                {/* Job Type */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Job Type
                  </label>

                  <select
                    value={form.jobType}
                    onChange={(e) =>
                      updateForm("jobType", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="COOP">COOP</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      updateForm("status", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-900">
                  Important Dates
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Keep track of application dates and deadlines.
                </p>
              </div>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Application Date
                  </label>

                  <input
                    type="date"
                    value={form.applicationDate}
                    onChange={(e) =>
                      updateForm("applicationDate", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Deadline
                  </label>

                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      updateForm("deadline", e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Additional Details */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-slate-900">
                  Additional Details
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Add information that will help you manage this application.
                </p>
              </div>

              <div className="mt-5 space-y-5">

                {/* URL */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Job URL
                  </label>

                  <input
                    type="url"
                    value={form.jobUrl}
                    onChange={(e) =>
                      updateForm("jobUrl", e.target.value)
                    }
                    placeholder="https://company.com/jobs/..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">

                  {/* Location */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Location
                    </label>

                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) =>
                        updateForm("location", e.target.value)
                      }
                      placeholder="e.g. Toronto, ON"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Salary */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Salary
                    </label>

                    <input
                      type="text"
                      value={form.salary}
                      onChange={(e) =>
                        updateForm("salary", e.target.value)
                      }
                      placeholder="e.g. $80,000 - $95,000"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Priority
                  </label>

                  <div className="grid grid-cols-3 gap-3">
                    {(["LOW", "MEDIUM", "HIGH"] as const).map(
                      (priority) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() =>
                            updateForm("priority", priority)
                          }
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                            form.priority === priority
                              ? priority === "HIGH"
                                ? "border-red-200 bg-red-50 text-red-700 ring-2 ring-red-100"
                                : priority === "MEDIUM"
                                ? "border-amber-200 bg-amber-50 text-amber-700 ring-2 ring-amber-100"
                                : "border-slate-300 bg-slate-100 text-slate-700 ring-2 ring-slate-100"
                              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {priority.charAt(0) +
                            priority.slice(1).toLowerCase()}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Notes
                  </label>

                  <textarea
                    rows={3}
                    value={form.notes}
                    onChange={(e) =>
                      updateForm("notes", e.target.value)
                    }
                    placeholder="Add any notes about this application..."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !form.company.trim() ||
                    !form.jobTitle.trim()
                  }
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}