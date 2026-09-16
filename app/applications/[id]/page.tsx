"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Application = {
  id: number;
  company: string;
  jobTitle: string;
  jobType: string;
  status: string;
  applicationDate: string | null;
  deadline: string | null;
  jobUrl: string | null;
  location: string | null;
  salary: string | null;
  notes: string | null;
  priority: string;
  createdAt: string;
  updatedAt: string;
};

type Task = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: string;
  completed: boolean;
};

export default function ApplicationDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const applicationId = params.id;

  const [application, setApplication] =
    useState<Application | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    async function fetchApplication() {
      try {
        const response = await fetch(
          `/api/applications/${applicationId}`
        );

        if (!response.ok) {
          throw new Error("Application not found");
        }

        const data = await response.json();

        setApplication(data);

        // Populate edit form
        setForm({
          company: data.company,
          jobTitle: data.jobTitle,
          jobType: data.jobType,
          status: data.status,
          applicationDate: data.applicationDate
            ? data.applicationDate.slice(0, 10)
            : "",
          deadline: data.deadline
            ? data.deadline.slice(0, 10)
            : "",
          jobUrl: data.jobUrl || "",
          location: data.location || "",
          salary: data.salary || "",
          notes: data.notes || "",
          priority: data.priority,
        });
      } catch (error) {
        console.error(
          "Failed to fetch application:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    async function fetchTasks() {
      try {
        const response = await fetch("/api/tasks");

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const data = await response.json();

        const applicationTasks = data.filter(
          (task: Task & { applicationId: number }) =>
            task.applicationId === Number(applicationId)
        );

        setTasks(applicationTasks);
      } catch (error) {
        console.error(
          "Failed to fetch tasks:",
          error
        );
      }
    }

    fetchApplication();
    fetchTasks();
  }, [applicationId]);

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    if (
      !form.company.trim() ||
      !form.jobTitle.trim()
    ) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        company: form.company.trim(),
        jobTitle: form.jobTitle.trim(),
        jobType: form.jobType,
        status: form.status,
        applicationDate:
          form.applicationDate || null,
        deadline: form.deadline || null,
        jobUrl: form.jobUrl.trim() || null,
        location: form.location.trim() || null,
        salary: form.salary.trim() || null,
        notes: form.notes.trim() || null,
        priority: form.priority,
      };

      const response = await fetch(
        `/api/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.error ||
            "Failed to update application"
        );
      }

      const updatedApplication =
        await response.json();

      setApplication(updatedApplication);

      // Keep form synchronized with updated data
      setForm({
        company: updatedApplication.company,
        jobTitle: updatedApplication.jobTitle,
        jobType: updatedApplication.jobType,
        status: updatedApplication.status,
        applicationDate:
          updatedApplication.applicationDate
            ? updatedApplication.applicationDate.slice(
                0,
                10
              )
            : "",
        deadline:
          updatedApplication.deadline
            ? updatedApplication.deadline.slice(
                0,
                10
              )
            : "",
        jobUrl:
          updatedApplication.jobUrl || "",
        location:
          updatedApplication.location || "",
        salary:
          updatedApplication.salary || "",
        notes:
          updatedApplication.notes || "",
        priority:
          updatedApplication.priority,
      });

      setShowModal(false);
    } catch (error) {
      console.error(
        "Failed to update application:",
        error
      );

      alert(
        "Failed to update application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(
    newStatus: string
  ) {
    try {
      const response = await fetch(
        `/api/applications/${applicationId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update status"
        );
      }

      const updatedApplication =
        await response.json();

      setApplication(updatedApplication);

      setForm((current) => ({
        ...current,
        status: updatedApplication.status,
      }));
    } catch (error) {
      console.error(
        "Failed to update status:",
        error
      );
    }
  }

  async function toggleTask(task: Task) {
    try {
      const response = await fetch(
        `/api/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: !task.completed,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update task"
        );
      }

      const updatedTask =
        await response.json();

      setTasks((current) =>
        current.map((item) =>
          item.id === updatedTask.id
            ? updatedTask
            : item
        )
      );
    } catch (error) {
      console.error(
        "Failed to update task:",
        error
      );
    }
  }

  function formatDate(
    date: string | null
  ) {
    if (!date) return "—";

    return new Date(date).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function getDeadlineStatus(
    deadline: string | null
  ) {
    if (!deadline) return null;

    const today = new Date();
    const deadlineDate = new Date(deadline);

    today.setHours(0, 0, 0, 0);
    deadlineDate.setHours(0, 0, 0, 0);

    const difference =
      deadlineDate.getTime() -
      today.getTime();

    const days = Math.ceil(
      difference /
        (1000 * 60 * 60 * 24)
    );

    if (days < 0) {
      return {
        text: "Overdue",
        className:
          "bg-red-50 text-red-700",
      };
    }

    if (days === 0) {
      return {
        text: "Due today",
        className:
          "bg-amber-50 text-amber-700",
      };
    }

    if (days === 1) {
      return {
        text: "Due tomorrow",
        className:
          "bg-amber-50 text-amber-700",
      };
    }

    if (days <= 3) {
      return {
        text: `Due in ${days} days`,
        className:
          "bg-amber-50 text-amber-700",
      };
    }

    return {
      text: `Due in ${days} days`,
      className:
        "bg-emerald-50 text-emerald-700",
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-slate-500">
            Loading application...
          </p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="mx-auto max-w-6xl">
          <button
            onClick={() => router.push("/")}
            className="mb-6 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            ← Back to Dashboard
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <h1 className="text-xl font-bold text-slate-900">
              Application not found
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              This application may have been deleted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const deadlineStatus =
    getDeadlineStatus(
      application.deadline
    );

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="mb-6 text-sm font-semibold text-slate-500 hover:text-indigo-600"
          >
            ← Back to Dashboard
          </button>

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-lg font-bold text-indigo-700">
                  {application.company
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {application.jobTitle}
                  </h1>

                  <p className="mt-1 text-sm text-slate-500">
                    {application.company}
                    {application.location
                      ? ` • ${application.location}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowModal(true)
              }
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            >
              Edit Application
            </button>
          </div>
        </div>

        {/* Status / Priority / Job Type */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Status */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Status
            </p>

            <select
              value={application.status}
              onChange={(e) =>
                updateStatus(e.target.value)
              }
              className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="SAVED">
                Saved
              </option>

              <option value="APPLIED">
                Applied
              </option>

              <option value="OA">
                Online Assessment
              </option>

              <option value="INTERVIEW">
                Interview
              </option>

              <option value="OFFER">
                Offer
              </option>

              <option value="REJECTED">
                Rejected
              </option>
            </select>
          </div>

          {/* Priority */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Priority
            </p>

            <p className="mt-2 text-lg font-bold text-slate-900">
              {application.priority}
            </p>
          </div>

          {/* Job Type */}
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Job Type
            </p>

            <p className="mt-2 text-lg font-bold capitalize text-slate-900">
              {application.jobType
                .replace("_", " ")
                .toLowerCase()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Main information */}
          <div className="space-y-6 lg:col-span-2">

            {/* Application Details */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Application Details
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Application Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {formatDate(
                      application.applicationDate
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Deadline
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {formatDate(
                      application.deadline
                    )}
                  </p>

                  {deadlineStatus && (
                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${deadlineStatus.className}`}
                    >
                      {deadlineStatus.text}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Salary
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {application.salary ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Location
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-700">
                    {application.location ||
                      "—"}
                  </p>
                </div>
              </div>

              {application.jobUrl && (
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Job Posting
                  </p>

                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View Job Posting →
                  </a>
                </div>
              )}
            </section>

            {/* Notes */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-bold text-slate-900">
                Notes
              </h2>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {application.notes ||
                  "No notes added yet."}
              </p>
            </section>

            {/* Tasks */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Tasks
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Tasks related to this application
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/tasks")
                  }
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  Manage Tasks
                </button>
              </div>

              <div className="mt-5 space-y-3">
                {tasks.length === 0 ? (
                  <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
                    No tasks for this application.
                  </p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 rounded-xl border border-slate-100 p-4"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() =>
                          toggleTask(task)
                        }
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                      />

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            task.completed
                              ? "text-slate-400 line-through"
                              : "text-slate-800"
                          }`}
                        >
                          {task.title}
                        </p>

                        {task.dueDate && (
                          <p className="mt-1 text-xs text-slate-400">
                            Due{" "}
                            {formatDate(
                              task.dueDate
                            )}
                          </p>
                        )}
                      </div>

                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {task.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Right column */}
          <aside className="space-y-6">

            {/* Timeline */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="text-sm font-bold text-slate-900">
                Application Timeline
              </h2>

              <div className="mt-5 space-y-5">

                <div className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Application created
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(
                        application.createdAt
                      )}
                    </p>
                  </div>
                </div>

                {application.applicationDate && (
                  <div className="flex gap-3">
                    <div className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Application submitted
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(
                          application.applicationDate
                        )}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-300" />

                  <div>
                    <p className="text-sm font-semibold text-slate-700">
                      Current status
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {application.status}
                    </p>
                  </div>
                </div>

              </div>
            </section>
          </aside>
        </div>
      </main>

      {/* Edit Application Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">

            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Edit Application
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Update the details for this application.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowModal(false)
                }
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-5 px-6 py-6"
            >

              {/* Company + Job Title */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Company *
                  </label>

                  <input
                    type="text"
                    value={form.company}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        company: e.target.value,
                      })
                    }
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Job Title *
                  </label>

                  <input
                    type="text"
                    value={form.jobTitle}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        jobTitle: e.target.value,
                      })
                    }
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Job Type + Status */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Job Type
                  </label>

                  <select
                    value={form.jobType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        jobType: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="FULL_TIME">
                      Full Time
                    </option>

                    <option value="PART_TIME">
                      Part Time
                    </option>

                    <option value="INTERNSHIP">
                      Internship
                    </option>

                    <option value="COOP">
                      COOP
                    </option>

                    <option value="CONTRACT">
                      Contract
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Status
                  </label>

                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status: e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="SAVED">
                      Saved
                    </option>

                    <option value="APPLIED">
                      Applied
                    </option>

                    <option value="OA">
                      Online Assessment
                    </option>

                    <option value="INTERVIEW">
                      Interview
                    </option>

                    <option value="OFFER">
                      Offer
                    </option>

                    <option value="REJECTED">
                      Rejected
                    </option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Application Date
                  </label>

                  <input
                    type="date"
                    value={form.applicationDate}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        applicationDate:
                          e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Deadline
                  </label>

                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        deadline:
                          e.target.value,
                      })
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* URL */}
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Job URL
                </label>

                <input
                  type="url"
                  value={form.jobUrl}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      jobUrl: e.target.value,
                    })
                  }
                  placeholder="https://..."
                  className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Location + Salary */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Location
                  </label>

                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        location:
                          e.target.value,
                      })
                    }
                    placeholder="Toronto, ON"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700">
                    Salary
                  </label>

                  <input
                    type="text"
                    value={form.salary}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        salary:
                          e.target.value,
                      })
                    }
                    placeholder="$70,000 - $90,000"
                    className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Priority
                </label>

                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority:
                        e.target.value,
                    })
                  }
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="LOW">
                    Low
                  </option>

                  <option value="MEDIUM">
                    Medium
                  </option>

                  <option value="HIGH">
                    High
                  </option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Notes
                </label>

                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      notes: e.target.value,
                    })
                  }
                  rows={4}
                  placeholder="Add notes about this application..."
                  className="mt-2 w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting
                    ? "Saving..."
                    : "Save Changes"}
                </button>

              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}