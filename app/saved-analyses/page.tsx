"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Analysis = {
  id: number;
  description: string;

  requiredSkills: string[];
  preferredSkills: string[];
  programmingLanguages: string[];

  experienceRequirements: string;
  location: string;
  salary: string;
  responsibilities: string[];

  matchScore: number | null;

  matchedSkills: string[];
  partialMatches: string[];
  missingSkills: string[];

  matchedRequirements: string[];
  missingRequirements: string[];

  strengths: string[];
  recommendations: string[];
  recommendation: string;

  createdAt: string;

  application: {
    id: number;
    company: string;
    jobTitle: string;
    jobType: string;
    status: string;
  };
};

export default function SavedAnalysesPage() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function handleDelete(id: number) {
      const confirmed = window.confirm(
        "Are you sure you want to delete this analysis?"
      );

      if (!confirmed) {
        return;
      }

      try {
        const response = await fetch("/api/saved-analyses", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to delete analysis."
          );
        }

        setAnalyses((current) =>
          current.filter((analysis) => analysis.id !== id)
        );
      } catch (error) {
        console.error("Delete analysis error:", error);

        alert(
          error instanceof Error
            ? error.message
            : "Failed to delete analysis."
        );
      }
    }

  useEffect(() => {
    async function fetchAnalyses() {
      try {
        const response = await fetch("/api/saved-analyses");

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "Failed to load saved analyses."
          );
        }

        setAnalyses(data.analyses || []);
      } catch (error) {
        console.error("Saved analyses error:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load saved analyses."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchAnalyses();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-6 py-7 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                AI Tools
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
                My Job Insights
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Review your previously analyzed jobs, match scores, skills,
                requirements, and recommendations.
              </p>
            </div>
          </header>

          {/* Content */}
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
            {loading && (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />

                <p className="mt-4 text-sm text-slate-500">
                  Loading my saved analyses...
                </p>
              </div>
            )}

            {error && !loading && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
                <p className="text-sm font-medium text-red-700">
                  {error}
                </p>
              </div>
            )}

            {!loading && !error && analyses.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl text-indigo-600">
                  ✦
                </div>

                <h2 className="mt-4 text-base font-semibold text-slate-900">
                  No saved analyses yet
                </h2>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Analyze a job posting to save its requirements and match
                  results here.
                </p>
              </div>
            )}

            {!loading && !error && analyses.length > 0 && (
              <div className="space-y-6">
                {analyses.map((analysis) => (
                  <AnalysisCard
                    key={analysis.id}
                    analysis={analysis}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function AnalysisCard({
  analysis,
  onDelete
}: {
  analysis: Analysis;
  onDelete: (id: number) => void;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Job Header */}
      <div className="border-b border-slate-100 px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              {analysis.application.company}
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {analysis.application.jobTitle}
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Analyzed{" "}
              {new Date(analysis.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Match Score */}
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-4 border-indigo-100 bg-indigo-50">
              <span className="text-2xl font-bold text-indigo-600">
                {analysis.matchScore ?? "—"}
              </span>

              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {analysis.matchScore !== null ? "/ 100" : "Score"}
              </span>
            </div>

            {/* Delete Button */}
            <button
              type="button"
              onClick={() => onDelete(analysis.id)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              title="Delete analysis"
              aria-label="Delete analysis"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-7 px-6 py-6">
        {/* Recommendation */}
        {analysis.recommendation && (
          <div className="rounded-xl bg-indigo-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              Overall Assessment
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-700">
              {analysis.recommendation}
            </p>
          </div>
        )}

        {/* Required Skills */}
        <SkillSection
          title="Required Skills"
          skills={analysis.requiredSkills}
          className="bg-indigo-50 text-indigo-700"
        />

        {/* Preferred Skills */}
        <SkillSection
          title="Preferred Skills"
          skills={analysis.preferredSkills}
          className="bg-slate-100 text-slate-600"
        />

        {/* Programming Languages */}
        <SkillSection
          title="Programming Languages"
          skills={analysis.programmingLanguages}
          className="bg-slate-100 text-slate-600"
        />

        {/* Match Breakdown */}
        <div className="grid gap-6 md:grid-cols-3">
          <SkillSection
            title="Matched Skills"
            skills={analysis.matchedSkills}
            className="bg-emerald-50 text-emerald-700"
            prefix="✓ "
          />

          <SkillSection
            title="Partial Matches"
            skills={analysis.partialMatches}
            className="bg-amber-50 text-amber-700"
            prefix="~ "
          />

          <SkillSection
            title="Missing Skills"
            skills={analysis.missingSkills}
            className="bg-red-50 text-red-700"
            prefix="× "
          />
        </div>

        {/* Experience / Location / Salary */}
        <div className="grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-3">
          <InfoSection
            title="Experience"
            value={analysis.experienceRequirements}
          />

          <InfoSection
            title="Location"
            value={analysis.location}
          />

          <InfoSection
            title="Salary"
            value={analysis.salary}
          />
        </div>

        {/* Responsibilities */}
        <ListSection
          title="Key Responsibilities"
          items={analysis.responsibilities}
        />

        {/* Matched Requirements */}
        <ListSection
          title="Matched Requirements"
          items={analysis.matchedRequirements}
          bullet="✓"
        />

        {/* Missing Requirements */}
        <ListSection
          title="Missing Requirements"
          items={analysis.missingRequirements}
          bullet="×"
        />

        {/* Strengths */}
        <ListSection
          title="Your Strengths"
          items={analysis.strengths}
          bullet="✓"
        />

        {/* Recommendations */}
        <ListSection
          title="Recommendations"
          items={analysis.recommendations}
          bullet="→"
        />
      </div>
    </article>
  );
}

function SkillSection({
  title,
  skills,
  className,
  prefix = "",
}: {
  title: string;
  skills: string[] | null | undefined;
  className: string;
  prefix?: string;
}) {
  const safeSkills = skills ?? [];

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">
        {title}
      </h3>

      {safeSkills.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {safeSkills.map((skill) => (
            <span
              key={skill}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${className}`}
            >
              {prefix}
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          None specified
        </p>
      )}
    </div>
  );
}

function InfoSection({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {value || "Not specified"}
      </p>
    </div>
  );
}

function ListSection({
  title,
  items,
  bullet = "•",
}: {
  title: string;
  items: string[] | null | undefined;
  bullet?: string;
}) {
  const safeItems = items ?? [];

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">
        {title}
      </h3>

      {safeItems.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {safeItems.map((item, index) => (
            <li
              key={index}
              className="flex gap-2 text-sm leading-6 text-slate-600"
            >
              <span className="shrink-0">{bullet}</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-slate-500">
          None specified
        </p>
      )}
    </div>
  );
}

