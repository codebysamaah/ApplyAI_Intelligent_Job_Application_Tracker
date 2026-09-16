"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

type Analysis = {
  requiredSkills: string[];
  preferredSkills: string[];
  programmingLanguages: string[];
  experienceRequirements: string;
  location: string;
  salary: string;
  responsibilities: string[];
};

type MatchResult = {
  matchScore: number;
  matchedSkills: string[];
  partialMatches: string[];
  missingSkills: string[];
  matchedRequirements: string[];
  missingRequirements: string[];
  strengths: string[];
  recommendations: string[];
  recommendation: string;
};

export default function JobAnalyzerPage() {
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [match, setMatch] = useState<MatchResult | null>(null);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();

    if (!jobDescription.trim()) {
      setError("Please enter a job description.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setAnalysis(null);
    setMatch(null);

    try {
      const response = await fetch("/api/job-analyzer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company,
          jobTitle,
          description: jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to analyze job description."
        );
      }

      setAnalysis(data.analysis);

      if (data.match) {
        setMatch(data.match);
      }
    } catch (error) {
      console.error("Job analysis error:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to analyze job description."
      );
    } finally {
      setAnalyzing(false);
    }
  }

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
                Job Analyzer
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Analyze a job posting to identify the skills, requirements,
                responsibilities, and technologies that matter most.
              </p>
            </div>
          </header>

          {/* Main Content */}
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-3">

              {/* Input Section */}
              <section className="lg:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                  {/* Card Header */}
                  <div className="border-b border-slate-100 px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <span className="text-lg">✦</span>
                      </div>

                      <div>
                        <h2 className="text-base font-semibold text-slate-900">
                          Analyze Job Posting
                        </h2>

                        <p className="mt-0.5 text-xs text-slate-500">
                          Paste the job description below to get started.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleAnalyze} className="p-6">
                    <div className="space-y-5">

                      {/* Company + Job Title */}
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="company"
                            className="text-sm font-semibold text-slate-700"
                          >
                            Company
                          </label>

                          <input
                            id="company"
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="e.g. Google"
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="jobTitle"
                            className="text-sm font-semibold text-slate-700"
                          >
                            Job Title
                          </label>

                          <input
                            id="jobTitle"
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Software Engineer"
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                          />
                        </div>
                      </div>

                      {/* Job Description */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="jobDescription"
                            className="text-sm font-semibold text-slate-700"
                          >
                            Job Description
                            <span className="ml-1 text-indigo-600">*</span>
                          </label>

                          <span className="text-xs text-slate-400">
                            {jobDescription.length.toLocaleString()} characters
                          </span>
                        </div>

                        <textarea
                          id="jobDescription"
                          value={jobDescription}
                          onChange={(e) => setJobDescription(e.target.value)}
                          placeholder="Paste the full job description here..."
                          rows={18}
                          required
                          className="mt-2 w-full resize-y rounded-lg border border-slate-200 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />

                        <p className="mt-2 text-xs leading-5 text-slate-400">
                          Include the full posting when possible. More context
                          helps produce a more useful analysis.
                        </p>
                      </div>

                      {/* Form Actions */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                        <p className="hidden text-xs text-slate-400 sm:block">
                          Your job description will be processed by the AI
                          analyzer.
                        </p>

                        <button
                          type="submit"
                          disabled={analyzing || matching || !jobDescription.trim()}
                          className="ml-auto inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {analyzing ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Analyzing...
                              </>
                            ) : matching ? (
                              <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                Calculating Match...
                              </>
                            ) : (
                            <>
                              <span>✦</span>
                              Analyze Job
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Error */}
                {error && (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
                    <p className="text-sm font-medium text-red-700">
                      {error}
                    </p>
                  </div>
                )}

                {/* Analysis Results */}
                {analysis && (
                  <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-100 px-6 py-5">
                      <h2 className="text-lg font-semibold text-slate-900">
                        Job Analysis
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Requirements extracted from the job description.
                      </p>
                    </div>

                    <div className="space-y-6 px-6 py-6">

                      {/* Required Skills */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Required Skills
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {analysis.requiredSkills.length > 0 ? (
                            analysis.requiredSkills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-lg bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">
                              None specified
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Preferred Skills */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Preferred Skills
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {analysis.preferredSkills.length > 0 ? (
                            analysis.preferredSkills.map((skill) => (
                              <span
                                key={skill}
                                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600"
                              >
                                {skill}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">
                              None specified
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Programming Languages */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Programming Languages
                        </h3>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {analysis.programmingLanguages.length > 0 ? (
                            analysis.programmingLanguages.map((language) => (
                              <span
                                key={language}
                                className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600"
                              >
                                {language}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-slate-500">
                              None specified
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Experience / Location / Salary */}
                      <div className="grid gap-6 sm:grid-cols-2">

                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Experience
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {analysis.experienceRequirements ||
                              "Not specified"}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Location
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {analysis.location || "Not specified"}
                          </p>
                        </div>

                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Salary
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {analysis.salary || "Not specified"}
                          </p>
                        </div>

                      </div>

                      {/* Responsibilities */}
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          Key Responsibilities
                        </h3>

                        {analysis.responsibilities.length > 0 ? (
                          <ul className="mt-3 space-y-2">
                            {analysis.responsibilities.map(
                              (responsibility, index) => (
                                <li
                                  key={index}
                                  className="flex gap-2 text-sm leading-6 text-slate-600"
                                >
                                  <span>•</span>
                                  <span>{responsibility}</span>
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          <p className="mt-2 text-sm text-slate-500">
                            None specified
                          </p>
                        )}
                      </div>

                    </div>
                  </section>
                )}

                {/* Match Results */}
                {match && (
                  <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Header */}
                    <div className="border-b border-slate-100 px-6 py-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-slate-900">
                            Your Job Match
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            How well your current profile matches this position.
                          </p>
                        </div>

                        {/* Score */}
                        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-indigo-100 bg-indigo-50">
                          <span className="text-2xl font-bold text-indigo-600">
                            {match.matchScore}
                          </span>

                          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            / 100
                          </span>
                        </div>
                      </div>
                    </div>

                  <div className="space-y-7 px-6 py-6">

                    {/* Overall Recommendation */}
                    <div className="rounded-xl bg-indigo-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                        Overall Assessment
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {match.recommendation}
                      </p>
                    </div>

                    {/* Matched Skills */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Matched Skills
                      </h3>

                      {match.matchedSkills.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {match.matchedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700"
                            >
                              ✓ {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          No direct skill matches found.
                        </p>
                      )}
                    </div>

                    {/* Partial Matches */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Partial Matches
                      </h3>

                      {match.partialMatches.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {match.partialMatches.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700"
                            >
                              ~ {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          No partial matches identified.
                        </p>
                      )}
                    </div>

                    {/* Missing Skills */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Missing Skills
                      </h3>

                      {match.missingSkills.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {match.missingSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700"
                            >
                              × {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-slate-500">
                          No major missing skills identified.
                        </p>
                      )}
                    </div>

                    {/* Strengths */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Your Strengths
                      </h3>

                      <ul className="mt-3 space-y-2">
                        {match.strengths.map((strength, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-sm leading-6 text-slate-600"
                          >
                            <span className="text-emerald-600">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Recommendations
                      </h3>

                      <ul className="mt-3 space-y-2">
                        {match.recommendations.map((recommendation, index) => (
                          <li
                            key={index}
                            className="flex gap-2 text-sm leading-6 text-slate-600"
                          >
                            <span className="text-indigo-600">→</span>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </section>
              )}
              </section>

              {/* Information Panel */}
              <aside className="space-y-6">

                {/* What You'll Get */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-slate-900">
                    What you’ll get
                  </h2>

                  <div className="mt-5 space-y-4">

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm text-indigo-600">
                        ✓
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Required skills
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          Identify the technologies and skills the employer
                          expects.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm text-indigo-600">
                        ✓
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Responsibilities
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          Extract the main responsibilities and expectations
                          from the posting.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm text-indigo-600">
                        ✓
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Experience requirements
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          Understand experience, education, and other
                          qualifications.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-sm text-indigo-600">
                        ✓
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Match analysis
                        </p>

                        <p className="mt-0.5 text-xs leading-5 text-slate-500">
                          Compare the job requirements with your profile and
                          identify potential gaps.
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* How It Works */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                    How it works
                  </p>

                  <div className="mt-4 space-y-4">

                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                        1
                      </span>

                      <p className="pt-0.5 text-sm leading-5 text-slate-600">
                        Paste a job description.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                        2
                      </span>

                      <p className="pt-0.5 text-sm leading-5 text-slate-600">
                        AI extracts structured job requirements.
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                        3
                      </span>

                      <p className="pt-0.5 text-sm leading-5 text-slate-600">
                        Review the analysis and match results.
                      </p>
                    </div>

                  </div>
                </div>

              </aside>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}