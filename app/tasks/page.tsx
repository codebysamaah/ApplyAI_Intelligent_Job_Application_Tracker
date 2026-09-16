"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Task = {
  id: number;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  completed: boolean;
  applicationId: number;
  application: {
    id: number;
    company: string;
    jobTitle: string;
  };
};

const priorityStyles: Record<Task["priority"], string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-red-50 text-red-700",
};

function formatDate(date: string | null) {
  if (!date) return "No deadline";

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    applicationId: "",
    title: "",
    description: "",
    dueDate: "",
    priority: "MEDIUM",
  });

  const [applications, setApplications] = useState<
    {
      id: number;
      company: string;
      jobTitle: string;
    }[]
  >([]);

  useEffect(() => {
    fetchTasks();
    fetchApplications();
  }, []);

  async function fetchTasks() {
    try {
      const response = await fetch("/api/tasks");

      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }

      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchApplications() {
  try {
    const response = await fetch("/api/applications", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch applications");
    }

    const userApplications = data.applications ?? [];

    setApplications(
      userApplications.map(
        (application: {
          id: number;
          company: string;
          jobTitle: string;
        }) => ({
          id: application.id,
          company: application.company,
          jobTitle: application.jobTitle,
        })
      )
    );
  } catch (error) {
    console.error("Failed to fetch applications:", error);
  }
}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.applicationId || !form.title.trim()) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          applicationId: Number(form.applicationId),
          title: form.title.trim(),
          description: form.description.trim() || null,
          dueDate: form.dueDate || null,
          priority: form.priority,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.error || "Failed to create task"
        );
      }

      const newTask = await response.json();

      setTasks((current) => [newTask, ...current]);

      setForm({
        applicationId: "",
        title: "",
        description: "",
        dueDate: "",
        priority: "MEDIUM",
      });

      setShowModal(false);
    } catch (error) {
      console.error("Failed to create task:", error);

      alert("Failed to create task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleTask(task: Task) {
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !task.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      const updatedTask = await response.json();

      setTasks((current) =>
        current.map((item) =>
          item.id === updatedTask.id ? updatedTask : item
        )
      );
    } catch (error) {
      console.error("Failed to update task:", error);

      alert("Failed to update task.");
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      setTasks((current) =>
        current.filter((task) => task.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete task:", error);

      alert("Failed to delete task.");
    }
  }

  const stats = {
    total: tasks.length,
    completed: tasks.filter((task) => task.completed).length,
    pending: tasks.filter((task) => !task.completed).length,
    highPriority: tasks.filter(
      (task) => !task.completed && task.priority === "HIGH"
    ).length,
  };

  const activeTasks = useMemo(
    () => tasks.filter((task) => !task.completed),
    [tasks]
  );

  const completedTasks = useMemo(
    () => tasks.filter((task) => task.completed),
    [tasks]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">

        <Sidebar />

        {/* Main */}
        <main className="flex-1">
          <header className="flex h-20 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
            <div>
              <p className="text-xs font-medium text-slate-400">
                Workspace / Tasks
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-700">
                Task Management
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              + Add Task
            </button>
          </header>

          <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

            {/* Heading */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight">
                Tasks
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Stay on top of deadlines, interviews, assessments, and follow-ups.
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Tasks</p>
                <p className="mt-2 text-3xl font-bold">
                  {stats.total}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Pending</p>
                <p className="mt-2 text-3xl font-bold text-indigo-600">
                  {stats.pending}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Completed</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {stats.completed}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">
                  High Priority
                </p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {stats.highPriority}
                </p>
              </div>
            </div>

            {/* Task List */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">

              <div className="border-b border-slate-200 px-6 py-5">
                <h3 className="font-semibold">
                  Active Tasks
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Tasks that still need your attention.
                </p>
              </div>

              {loading ? (
                <div className="px-6 py-16 text-center text-sm text-slate-500">
                  Loading tasks...
                </div>
              ) : activeTasks.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <p className="text-sm font-semibold">
                    No active tasks
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    You're all caught up.
                  </p>
                </div>
              ) : (
                <div>
                  {activeTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-4 border-b border-slate-100 px-6 py-5 last:border-0"
                    >
                      <button
                        onClick={() => toggleTask(task)}
                        className="h-5 w-5 rounded-md border-2 border-slate-300 transition hover:border-indigo-500 hover:bg-indigo-50"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800">
                          {task.title}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {task.application.company} ·{" "}
                          {task.application.jobTitle}
                        </p>
                      </div>

                      <span
                        className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold sm:inline-flex ${priorityStyles[task.priority]}`}
                      >
                        {task.priority.charAt(0) +
                          task.priority.slice(1).toLowerCase()}
                      </span>

                      <span className="hidden text-sm text-slate-500 md:block">
                        {formatDate(task.dueDate)}
                      </span>

                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-sm font-medium text-slate-400 transition hover:text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed */}
            {completedTasks.length > 0 && (
              <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h3 className="font-semibold">
                    Completed Tasks
                  </h3>
                </div>

                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 border-b border-slate-100 px-6 py-5 last:border-0"
                  >
                    <button
                      onClick={() => toggleTask(task)}
                      className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600 text-xs text-white"
                    >
                      ✓
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-400 line-through">
                        {task.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {task.application.company} ·{" "}
                        {task.application.jobTitle}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(task.id)}
                      className="text-sm font-medium text-slate-400 transition hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold">
                  Add Task
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a task for an application.
                </p>
              </div>

              <button
                onClick={() => setShowModal(false)}
                className="text-xl text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Application
                </label>

                <select
                  required
                  value={form.applicationId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      applicationId: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                >
                  <option value="">
                    Select an application
                  </option>

                  {applications.map((application) => (
                    <option
                      key={application.id}
                      value={application.id}
                    >
                      {application.company} —{" "}
                      {application.jobTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Task
                </label>

                <input
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  placeholder="e.g. Complete coding assessment"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Due Date
                </label>

                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dueDate: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Priority
                </label>

                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Description
                </label>

                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  placeholder="Add details about this task..."
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !form.applicationId ||
                    !form.title.trim()
                  }
                  className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}