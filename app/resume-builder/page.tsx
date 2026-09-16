"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Sidebar from "@/components/Sidebar";

type JobAnalysis = {
  id: number;
  application: {
    company: string;
    jobTitle: string;
  };
  matchScore: number | null;
};

type ResumeFormat = {
  id:
    | "SOFTWARE_ENGINEERING"
    | "AI_DATA"
    | "BUSINESS_FINANCE"
    | "DESIGN_CREATIVE"
    | "RESEARCH_ACADEMIA"
    | "GENERAL_OTHER";
  title: string;
  icon: string;
  description: string;
};

type Resume = {
  summary: string;

  education: {
    school: string;
    degree: string;
    fieldOfStudy: string;
    gpa: string;
    graduationDate: string;
    location: string;
  }[];

  skills: {
    category: string;
    skills: string[];
  }[];

  experience: {
    company: string;
    position: string;
    location: string;
    dates: string;
    bulletPoints: string[];
  }[];

  projects: {
    name: string;
    technologies: string[];
    bulletPoints: string[];
  }[];

  certifications: {
    name: string;
    issuer: string;
    date: string;
  }[];

  achievements: {
    title: string;
    description: string;
    date: string;
  }[];
};

const resumeFormats: ResumeFormat[] = [
  {
    id: "SOFTWARE_ENGINEERING",
    title: "Software Engineering",
    icon: "💻",
    description: "SWE, full-stack, backend, frontend, systems",
  },
  {
    id: "AI_DATA",
    title: "AI / Data",
    icon: "🤖",
    description: "AI, ML, data science, analytics, NLP",
  },
  {
    id: "BUSINESS_FINANCE",
    title: "Business / Finance",
    icon: "💼",
    description: "Business, consulting, finance, operations",
  },
  {
    id: "DESIGN_CREATIVE",
    title: "Design / Creative",
    icon: "🎨",
    description: "Design, UX/UI, creative and visual roles",
  },
  {
    id: "RESEARCH_ACADEMIA",
    title: "Research / Academia",
    icon: "🔬",
    description: "Research, academic and technical positions",
  },
  {
    id: "GENERAL_OTHER",
    title: "General / Other",
    icon: "📄",
    description: "Flexible format for other career paths",
  },
];

export default function ResumeBuilderPage() {
  const [analyses, setAnalyses] = useState<JobAnalysis[]>([]);
  const [selectedJobAnalysisId, setSelectedJobAnalysisId] =
    useState<number | null>(null);

  const [selectedResumeFormat, setSelectedResumeFormat] =
    useState<ResumeFormat["id"]>("SOFTWARE_ENGINEERING");

  const [resume, setResume] = useState<Resume | null>(null);

  const [loadingAnalyses, setLoadingAnalyses] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnalyses();
  }, []);

  async function fetchAnalyses() {
    try {
      setLoadingAnalyses(true);
      setError("");

      const response = await fetch("/api/saved-analyses");

      if (!response.ok) {
        throw new Error("Failed to load saved analyses.");
      }

      const data = await response.json();

      const savedAnalyses: JobAnalysis[] = data.analyses || [];

      setAnalyses(savedAnalyses);

      if (savedAnalyses.length > 0) {
        setSelectedJobAnalysisId(savedAnalyses[0].id);
      }
    } catch (error) {
      console.error("Error loading analyses:", error);
      setError("Unable to load your saved job analyses.");
    } finally {
      setLoadingAnalyses(false);
    }
  }

  async function generateResume() {
    if (!selectedJobAnalysisId) {
      setError("Please select a job analysis.");
      return;
    }

    setGenerating(true);
    setError("");
    setResume(null);

    try {
      const response = await fetch("/api/resume-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobAnalysisId: selectedJobAnalysisId,
          resumeFormat: selectedResumeFormat,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate resume.");
      }

      setResume(data.resume);
    } catch (error) {
      console.error("Error generating resume:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while generating your resume."
      );
    } finally {
      setGenerating(false);
    }
  }

  const selectedAnalysis = analyses.find(
    (analysis) => analysis.id === selectedJobAnalysisId
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <main className="min-w-0 flex-1">
        {/* Header */}
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-7 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
              AI Tools
            </p>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              Resume Builder
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Build a tailored resume using your profile, a selected job
              analysis, and your preferred resume format.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <div className="mx-auto max-w-6xl px-6 py-8 lg:px-8">
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {resume ? (
            <ResumePreview
              resume={resume}
              selectedAnalysis={selectedAnalysis}
              selectedFormat={selectedResumeFormat}
              onBack={() => setResume(null)}
            />
          ) : (
            <BuilderForm
              analyses={analyses}
              selectedJobAnalysisId={selectedJobAnalysisId}
              setSelectedJobAnalysisId={setSelectedJobAnalysisId}
              selectedResumeFormat={selectedResumeFormat}
              setSelectedResumeFormat={setSelectedResumeFormat}
              loadingAnalyses={loadingAnalyses}
              generating={generating}
              selectedAnalysis={selectedAnalysis}
              onGenerate={generateResume}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function BuilderForm({
  analyses,
  selectedJobAnalysisId,
  setSelectedJobAnalysisId,
  selectedResumeFormat,
  setSelectedResumeFormat,
  loadingAnalyses,
  generating,
  selectedAnalysis,
  onGenerate,
}: {
  analyses: JobAnalysis[];
  selectedJobAnalysisId: number | null;
  setSelectedJobAnalysisId: (id: number) => void;
  selectedResumeFormat: ResumeFormat["id"];
  setSelectedResumeFormat: (id: ResumeFormat["id"]) => void;
  loadingAnalyses: boolean;
  generating: boolean;
  selectedAnalysis?: JobAnalysis;
  onGenerate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Step 1 */}
      <section className="border-b border-slate-100 p-6">
        <div className="mb-4 flex items-start gap-3">
          <StepNumber number={1} />

          <div>
            <h2 className="font-semibold text-slate-900">
              Select Job Analysis
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Choose the job you want your resume tailored for.
            </p>
          </div>
        </div>

        {loadingAnalyses ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            Loading saved analyses...
          </div>
        ) : analyses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center">
            <p className="text-sm font-medium text-slate-700">
              No saved job analyses yet
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Analyze a job first before building a tailored resume.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {analyses.map((analysis) => {
              const selected = selectedJobAnalysisId === analysis.id;

              return (
                <button
                  key={analysis.id}
                  type="button"
                  onClick={() => setSelectedJobAnalysisId(analysis.id)}
                  className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                    selected
                      ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-200"
                      : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${
                        selected ? "bg-indigo-100" : "bg-slate-100"
                      }`}
                    >
                      💼
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {analysis.application.jobTitle}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {analysis.application.company}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {analysis.matchScore !== null && (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {analysis.matchScore}% match
                      </span>
                    )}

                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        selected
                          ? "border-indigo-600 bg-indigo-600"
                          : "border-slate-300"
                      }`}
                    >
                      {selected && (
                        <span className="text-[11px] text-white">✓</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Step 2 */}
      <section className="border-b border-slate-100 p-6">
        <div className="mb-4 flex items-start gap-3">
          <StepNumber number={2} />

          <div>
            <h2 className="font-semibold text-slate-900">Profile</h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Your saved profile will be used automatically.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">
            👤
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              My Profile
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              Education, skills, projects, experience and achievements
            </p>
          </div>

          <span className="ml-auto rounded-full bg-green-50 px-3 py-1 text-[11px] font-medium text-green-600">
            Connected
          </span>
        </div>
      </section>

      {/* Step 3 */}
      <section className="p-6">
        <div className="mb-5 flex items-start gap-3">
          <StepNumber number={3} />

          <div>
            <h2 className="font-semibold text-slate-900">Resume Format</h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Choose how AI should structure and prioritize your resume.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resumeFormats.map((format) => {
            const selected = selectedResumeFormat === format.id;

            return (
              <button
                key={format.id}
                type="button"
                onClick={() => setSelectedResumeFormat(format.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  selected
                    ? "border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-200"
                    : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-2xl">{format.icon}</span>

                  {selected && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[11px] text-white">
                      ✓
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-slate-900">
                  {format.title}
                </p>

                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {format.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Generate Footer */}
      <div className="flex flex-col gap-4 rounded-b-2xl border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {selectedAnalysis ? (
            <p className="text-xs text-slate-500">
              Tailoring for{" "}
              <span className="font-medium text-slate-700">
                {selectedAnalysis.application.jobTitle}
              </span>{" "}
              at{" "}
              <span className="font-medium text-slate-700">
                {selectedAnalysis.application.company}
              </span>
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Select a job analysis to continue.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={
            generating ||
            !selectedJobAnalysisId ||
            analyses.length === 0
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Generating...
            </>
          ) : (
            <>✨ Generate Resume</>
          )}
        </button>
      </div>
    </div>
  );
}

function StepNumber({ number }: { number: number }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-600">
      {number}
    </div>
  );
}

function ResumePreview({
  resume,
  selectedAnalysis,
  selectedFormat,
  onBack,
}: {
  resume: Resume;
  selectedAnalysis?: JobAnalysis;
  selectedFormat: ResumeFormat["id"];
  onBack: () => void;
}) {
  const resumeRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const format = resumeFormats.find(
    (item) => item.id === selectedFormat
  );

  async function downloadPDF() {
    if (!resumeRef.current) {
      return;
    }

    setDownloading(true);

    try {
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;

      const imgWidth = pageWidth;
      const imgHeight =
        (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        imgData,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;

        pdf.addPage();

        pdf.addImage(
          imgData,
          "PNG",
          0,
          position,
          imgWidth,
          imgHeight
        );

        heightLeft -= pageHeight;
      }

      const company =
        selectedAnalysis?.application.company || "Company";

      const jobTitle =
        selectedAnalysis?.application.jobTitle || "Resume";

      const filename = `${company}-${jobTitle}-Resume`
        .replace(/[^a-zA-Z0-9-_ ]/g, "")
        .replace(/\s+/g, "-");

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      {/* Preview Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg">{format?.icon}</span>

            <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
              {format?.title}
            </p>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Resume Preview
          </h2>

          {selectedAnalysis && (
            <p className="mt-1 text-xs text-slate-500">
              Tailored for{" "}
              {selectedAnalysis.application.jobTitle} at{" "}
              {selectedAnalysis.application.company}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            ← Edit
          </button>

          <button
            type="button"
            onClick={downloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {downloading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Creating PDF...
              </>
            ) : (
              <>↓ Download PDF</>
            )}
          </button>
        </div>
      </div>

      {/* Resume Document */}
      <div
        ref={resumeRef}
        className="mx-auto max-w-4xl bg-white shadow-lg"
      >
        <div className="p-8 sm:p-10 lg:p-12">
          {/* Summary */}
          {resume.summary && (
            <section className="mb-7">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-900">
                Summary
              </h3>

              <p className="text-sm leading-6 text-slate-700">
                {resume.summary}
              </p>
            </section>
          )}

          {/* Education */}
          {resume.education?.length > 0 && (
            <ResumeSection title="Education">
              {resume.education.map((education, index) => (
                <div key={index} className="mb-4 last:mb-0">
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {education.school}
                      </p>

                      <p className="text-sm text-slate-700">
                        {education.degree}
                        {education.fieldOfStudy
                          ? `, ${education.fieldOfStudy}`
                          : ""}
                      </p>
                    </div>

                    <div className="text-right text-xs text-slate-500">
                      {education.graduationDate && (
                        <p>{education.graduationDate}</p>
                      )}

                      {education.location && (
                        <p>{education.location}</p>
                      )}
                    </div>
                  </div>

                  {education.gpa && (
                    <p className="mt-1 text-xs text-slate-500">
                      GPA: {education.gpa}
                    </p>
                  )}
                </div>
              ))}
            </ResumeSection>
          )}

          {/* Skills */}
          {resume.skills?.length > 0 && (
            <ResumeSection title="Skills">
              <div className="space-y-2">
                {resume.skills.map((skillGroup, index) => (
                  <div
                    key={index}
                    className="flex gap-2 text-sm"
                  >
                    <span className="min-w-[100px] font-semibold text-slate-900">
                      {skillGroup.category}:
                    </span>

                    <span className="text-slate-700">
                      {skillGroup.skills.join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </ResumeSection>
          )}

          {/* Experience */}
          {resume.experience?.length > 0 && (
            <ResumeSection title="Experience">
              <div className="space-y-5">
                {resume.experience.map((experience, index) => (
                  <div key={index}>
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {experience.position}
                        </p>

                        <p className="text-sm text-slate-700">
                          {experience.company}
                        </p>
                      </div>

                      <div className="text-right text-xs text-slate-500">
                        <p>{experience.dates}</p>

                        {experience.location && (
                          <p>{experience.location}</p>
                        )}
                      </div>
                    </div>

                    <ul className="mt-2 space-y-1.5 pl-4">
                      {experience.bulletPoints.map(
                        (bullet, bulletIndex) => (
                          <li
                            key={bulletIndex}
                            className="list-disc text-sm leading-5 text-slate-700"
                          >
                            {bullet}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </ResumeSection>
          )}

          {/* Projects */}
          {resume.projects?.length > 0 && (
            <ResumeSection title="Projects">
              <div className="space-y-5">
                {resume.projects.map((project, index) => (
                  <div key={index}>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {project.name}
                      </p>

                      {project.technologies?.length > 0 && (
                        <span className="text-xs text-slate-500">
                          | {project.technologies.join(", ")}
                        </span>
                      )}
                    </div>

                    <ul className="mt-2 space-y-1.5 pl-4">
                      {project.bulletPoints.map(
                        (bullet, bulletIndex) => (
                          <li
                            key={bulletIndex}
                            className="list-disc text-sm leading-5 text-slate-700"
                          >
                            {bullet}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </ResumeSection>
          )}

          {/* Certifications */}
          {resume.certifications?.length > 0 && (
            <ResumeSection title="Certifications">
              <div className="space-y-2">
                {resume.certifications.map(
                  (certification, index) => (
                    <div
                      key={index}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <div>
                        <span className="font-medium text-slate-900">
                          {certification.name}
                        </span>

                        {certification.issuer && (
                          <span className="text-slate-600">
                            {" "}
                            — {certification.issuer}
                          </span>
                        )}
                      </div>

                      {certification.date && (
                        <span className="text-xs text-slate-500">
                          {certification.date}
                        </span>
                      )}
                    </div>
                  )
                )}
              </div>
            </ResumeSection>
          )}

          {/* Achievements */}
          {resume.achievements?.length > 0 && (
            <ResumeSection title="Achievements">
              <div className="space-y-3">
                {resume.achievements.map(
                  (achievement, index) => (
                    <div key={index}>
                      <p className="text-sm font-semibold text-slate-900">
                        {achievement.title}
                      </p>

                      {achievement.description && (
                        <p className="mt-0.5 text-sm text-slate-700">
                          {achievement.description}
                        </p>
                      )}

                      {achievement.date && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {achievement.date}
                        </p>
                      )}
                    </div>
                  )
                )}
              </div>
            </ResumeSection>
          )}
        </div>
      </div>
    </div>
  );
}

function ResumeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <h3 className="mb-3 border-b border-slate-300 pb-1.5 text-xs font-bold uppercase tracking-widest text-slate-900">
        {title}
      </h3>

      {children}
    </section>
  );
}