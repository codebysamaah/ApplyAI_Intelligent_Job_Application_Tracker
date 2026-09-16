"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Skill = { id: number; name: string; category: string | null; };

type Profile = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  education: Education[];
  skills: Skill[];
  projects: Project[];
  experiences: Experience[];
};

type Education = {
  id: number;
  school: string;
  degree: string;
  fieldOfStudy: string | null;
  gpa: number | null;
  graduationDate: string | null;
  location: string | null;
};

type Project = {
  id: number;
  name: string;
  description: string | null;
  technologies: string[];
  bulletPoints: string[];
  githubUrl: string | null;
  demoUrl: string | null;
};

type Experience = {
  id: number;
  company: string;
  position: string;
  location: string | null;
  startDate: string;
  endDate: string | null;
  bulletPoints: string[];
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [showEducationModal, setShowEducationModal] = useState(false);
  const [editingEducation, setEditingEducation] =
  useState<Education | null>(null);
  
  const [educationForm, setEducationForm] = useState({
    school: "",
    degree: "",
    fieldOfStudy: "",
    gpa: "",
    graduationDate: "",
    location: "",
    }); 

    const [showSkillModal, setShowSkillModal] = useState(false);
    const [editingSkill, setEditingSkill] = useState<Skill | null>(null);

    const [skillForm, setSkillForm] = useState({
    name: "",
    category: "",
    });

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    linkedinUrl: "",
    githubUrl: "",
    portfolioUrl: "",
  });

  const [showProjectModal, setShowProjectModal] = useState(false); 
  const [editingProject, setEditingProject] = useState<Project | null>(null); 
  const [projectForm, setProjectForm] = useState({ 
    name: "", description: "", technologies: "", bulletPoints: "", githubUrl: "", demoUrl: "", 
  });

  const [showExperienceModal, setShowExperienceModal] = useState(false);

  const [editingExperience, setEditingExperience] =
    useState<Experience | null>(null);

  const [experienceForm, setExperienceForm] = useState({
    company: "",
    position: "",
    location: "",
    startDate: "",
    endDate: "",
    bulletPoints: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
  try {
    const response = await fetch("/api/profile", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch profile");
    }

    const profileData = data.profile;

    if (!profileData) {
      throw new Error("Profile data not found");
    }

    setProfile(profileData);

    setForm({
      name: profileData.name ?? "",
      email: profileData.email ?? "",
      phone: profileData.phone ?? "",
      location: profileData.location ?? "",
      linkedinUrl: profileData.linkedinUrl ?? "",
      githubUrl: profileData.githubUrl ?? "",
      portfolioUrl: profileData.portfolioUrl ?? "",
    });
  } catch (error) {
    console.error("Error loading profile:", error);
  } finally {
    setLoading(false);
  }
}

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      setMessage("Name and email are required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const data = await response.json();

      setProfile(data.profile);
      setMessage("Profile saved successfully.");
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage("Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
    }
  }

  function openAddEducation() {
  setEditingEducation(null);

  setEducationForm({
    school: "",
    degree: "",
    fieldOfStudy: "",
    gpa: "",
    graduationDate: "",
    location: "",
  });

  setShowEducationModal(true);
}

async function handleEducationSubmit(
  e: React.FormEvent
) {
  e.preventDefault();

  if (!educationForm.school.trim() || !educationForm.degree.trim()) {
    return;
  }

  try {
    const url = editingEducation
      ? `/api/profile/education/${editingEducation.id}`
      : "/api/profile/education";

    const response = await fetch(url, {
      method: editingEducation ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(educationForm),
    });

    if (!response.ok) {
      throw new Error("Failed to save education");
    }

    setShowEducationModal(false);
    await fetchProfile();
  } catch (error) {
    console.error("Error saving education:", error);
  }
}

async function handleDeleteEducation(id: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this education entry?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `/api/profile/education/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete education");
    }

    await fetchProfile();
  } catch (error) {
    console.error("Error deleting education:", error);
  }
}

function openAddSkill() {
  setEditingSkill(null);

  setSkillForm({
    name: "",
    category: "",
  });

  setShowSkillModal(true);
}

function openEditSkill(skill: Skill) {
  setEditingSkill(skill);

  setSkillForm({
    name: skill.name,
    category: skill.category ?? "",
  });

  setShowSkillModal(true);
}

async function handleSkillSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!skillForm.name.trim()) {
    return;
  }

  try {
    const url = editingSkill
      ? `/api/profile/skills/${editingSkill.id}`
      : "/api/profile/skills";

    const response = await fetch(url, {
      method: editingSkill ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(skillForm),
    });

    if (!response.ok) {
      throw new Error("Failed to save skill");
    }

    setShowSkillModal(false);
    await fetchProfile();
  } catch (error) {
    console.error("Error saving skill:", error);
  }
}

async function handleDeleteSkill(id: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this skill?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`/api/profile/skills/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete skill");
    }

    await fetchProfile();
  } catch (error) {
    console.error("Error deleting skill:", error);
  }
}

function openAddProject() {
  setEditingProject(null);

  setProjectForm({
    name: "",
    description: "",
    technologies: "",
    bulletPoints: "",
    githubUrl: "",
    demoUrl: "",
  });

  setShowProjectModal(true);
}

function openEditProject(project: Project) {
  setEditingProject(project);

  setProjectForm({
    name: project.name,
    description: project.description ?? "",
    technologies: project.technologies.join(", "),
    bulletPoints: project.bulletPoints.join("\n"),
    githubUrl: project.githubUrl ?? "",
    demoUrl: project.demoUrl ?? "",
  });

  setShowProjectModal(true);
}

async function handleProjectSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (!projectForm.name.trim()) {
    return;
  }

  try {
    const url = editingProject
      ? `/api/profile/projects/${editingProject.id}`
      : "/api/profile/projects";

    const response = await fetch(url, {
      method: editingProject ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: projectForm.name,
        description: projectForm.description,
        technologies: projectForm.technologies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        bulletPoints: projectForm.bulletPoints
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        githubUrl: projectForm.githubUrl,
        demoUrl: projectForm.demoUrl,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save project");
    }

    setShowProjectModal(false);

    await fetchProfile();
  } catch (error) {
    console.error("Error saving project:", error);
  }
}

async function handleDeleteProject(id: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this project?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`/api/profile/projects/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete project");
    }

    await fetchProfile();
  } catch (error) {
    console.error("Error deleting project:", error);
  }
}

function openAddExperience() {
  setEditingExperience(null);

  setExperienceForm({
    company: "",
    position: "",
    location: "",
    startDate: "",
    endDate: "",
    bulletPoints: "",
  });

  setShowExperienceModal(true);
}

function openEditExperience(experience: Experience) {
  setEditingExperience(experience);

  setExperienceForm({
    company: experience.company,
    position: experience.position,
    location: experience.location ?? "",
    startDate: experience.startDate
      ? experience.startDate.substring(0, 10)
      : "",
    endDate: experience.endDate
      ? experience.endDate.substring(0, 10)
      : "",
    bulletPoints: experience.bulletPoints.join("\n"),
  });

  setShowExperienceModal(true);
}

async function handleExperienceSubmit(e: React.FormEvent) {
  e.preventDefault();

  if (
    !experienceForm.company.trim() ||
    !experienceForm.position.trim() ||
    !experienceForm.startDate
  ) {
    return;
  }

  try {
    const url = editingExperience
      ? `/api/profile/experiences/${editingExperience.id}`
      : "/api/profile/experiences";

    const response = await fetch(url, {
      method: editingExperience ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        company: experienceForm.company,
        position: experienceForm.position,
        location: experienceForm.location,
        startDate: experienceForm.startDate,
        endDate: experienceForm.endDate || null,
        bulletPoints: experienceForm.bulletPoints
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save experience");
    }

    setShowExperienceModal(false);

    await fetchProfile();
  } catch (error) {
    console.error("Error saving experience:", error);
  }
}

async function handleDeleteExperience(id: number) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this experience?"
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `/api/profile/experiences/${id}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete experience");
    }

    await fetchProfile();
  } catch (error) {
    console.error("Error deleting experience:", error);
  }
}

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen">
          <Sidebar />

          <main className="flex flex-1 items-center justify-center">
            <div className="text-sm text-slate-500">
              Loading profile...
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar />

        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
              <div>
                <p className="mb-2 text-sm font-medium text-indigo-600">
                  Account
                </p>

                <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                  My Profile
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Keep your professional information up to date.
                  Your profile will be used for job matching and
                  tailored resume generation.
                </p>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="mx-auto max-w-6xl px-6 py-8 lg:px-10">
            <form onSubmit={handleSubmit}>
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                {/* Section header */}
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Personal Information
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Basic information and professional links.
                  </p>
                </div>

                {/* Form */}
                <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Full Name
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="john@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Phone
                    </label>

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="+1 (416) 555-0123"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label
                      htmlFor="location"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Location
                    </label>

                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={form.location}
                      onChange={handleChange}
                      placeholder="Toronto, ON"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div>
                    <label
                      htmlFor="linkedinUrl"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      LinkedIn
                    </label>

                    <input
                      id="linkedinUrl"
                      name="linkedinUrl"
                      type="url"
                      value={form.linkedinUrl}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/johndoe"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* GitHub */}
                  <div>
                    <label
                      htmlFor="githubUrl"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      GitHub
                    </label>

                    <input
                      id="githubUrl"
                      name="githubUrl"
                      type="url"
                      value={form.githubUrl}
                      onChange={handleChange}
                      placeholder="https://github.com/johndoe"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Portfolio */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="portfolioUrl"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Portfolio Website
                    </label>

                    <input
                      id="portfolioUrl"
                      name="portfolioUrl"
                      type="url"
                      value={form.portfolioUrl}
                      onChange={handleChange}
                      placeholder="https://johndoe.dev"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                  <div>
                    {message && (
                      <p
                        className={`text-sm ${
                          message.includes("successfully")
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </section>
            </form>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Education
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Add your academic background and qualifications.
                </p>
                </div>

                <button
                type="button"
                onClick={openAddEducation}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                + Add Education
                </button>
            </div>

            <div className="divide-y divide-slate-100">
                {profile?.education?.length ? (
                profile.education.map((education) => (
                    <div
                    key={education.id}
                    className="flex items-start justify-between gap-6 px-6 py-6"
                    >
                    <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">
                        {education.school}
                        </h3>

                        <p className="mt-1 text-sm text-slate-700">
                        {education.degree}
                        {education.fieldOfStudy &&
                            ` · ${education.fieldOfStudy}`}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        {education.gpa !== null && (
                            <span>
                            GPA: {education.gpa.toFixed(2)}
                            </span>
                        )}

                        {education.graduationDate && (
                            <span>
                            Graduation:{" "}
                            {new Date(
                                education.graduationDate
                            ).toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                            })}
                            </span>
                        )}

                        {education.location && (
                            <span>{education.location}</span>
                        )}
                        </div>
                    </div>

                    <div className="flex shrink-0 gap-2">
                        <button
                        type="button"
                        onClick={() =>
                            handleDeleteEducation(education.id)
                        }
                        className="rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                        Delete
                        </button>
                    </div>
                    </div>
                ))
                ) : (
                <div className="px-6 py-10 text-center">
                    <p className="text-sm text-slate-500">
                    No education added yet.
                    </p>

                    <button
                    type="button"
                    onClick={openAddEducation}
                    className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                    Add your education
                    </button>
                </div>
                )}
            </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                <h2 className="text-lg font-semibold text-slate-900">
                    Skills
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    Add the technical skills you want to use when tailoring your resumes.
                </p>
                </div>

                <button
                type="button"
                onClick={openAddSkill}
                className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                + Add Skill
                </button>
            </div>

            <div className="px-6 py-6">
                {profile?.skills?.length ? (
                <div className="space-y-6">
                    {Array.from(
                    new Set(
                        profile.skills.map(
                        (skill) => skill.category || "Other"
                        )
                    )
                    ).map((category) => {
                    const categorySkills = profile.skills.filter(
                        (skill) =>
                        (skill.category || "Other") === category
                    );

                    return (
                        <div key={category}>
                        <h3 className="mb-3 text-sm font-semibold text-slate-700">
                            {category}
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {categorySkills.map((skill) => (
                            <div
                                key={skill.id}
                                className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                                <span className="text-sm font-medium text-slate-700">
                                {skill.name}
                                </span>

                                <button
                                type="button"
                                onClick={() =>
                                    handleDeleteSkill(skill.id)
                                }
                                className="text-xs font-medium text-slate-400 transition hover:text-red-600"
                                >
                                Delete
                                </button>
                            </div>
                            ))}
                        </div>
                        </div>
                    );
                    })}
                </div>
                ) : (
                <div className="py-8 text-center">
                    <p className="text-sm text-slate-500">
                    No skills added yet.
                    </p>

                    <button
                    type="button"
                    onClick={openAddSkill}
                    className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                    Add your first skill
                    </button>
                </div>
                )}
            </div>
            </section>

            <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Projects
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Add projects that showcase your experience and skills.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddProject}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  + Add Project
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {profile?.projects?.length ? (
                  profile.projects.map((project) => (
                    <div
                      key={project.id}
                      className="px-6 py-6"
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900">
                            {project.name}
                          </h3>

                          {project.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {project.description}
                            </p>
                          )}

                          {project.technologies.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {project.technologies.map((technology) => (
                                <span
                                  key={technology}
                                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                >
                                  {technology}
                                </span>
                              ))}
                            </div>
                          )}

                          {project.bulletPoints.length > 0 && (
                            <ul className="mt-4 space-y-2">
                              {project.bulletPoints.map((bullet, index) => (
                                <li
                                  key={index}
                                  className="flex gap-2 text-sm leading-6 text-slate-600"
                                >
                                  <span>•</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          )}

                          {(project.githubUrl || project.demoUrl) && (
                            <div className="mt-4 flex gap-4 text-sm">
                              {project.githubUrl && (
                                <a
                                  href={project.githubUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                  GitHub →
                                </a>
                              )}

                              {project.demoUrl && (
                                <a
                                  href={project.demoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-indigo-600 hover:text-indigo-700"
                                >
                                  Live Demo →
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            onClick={() => openEditProject(project)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteProject(project.id)
                            }
                            className="rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm text-slate-500">
                      No projects added yet.
                    </p>

                    <button
                      type="button"
                      onClick={openAddProject}
                      className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Add your first project
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Work Experience */}
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Work Experience
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Add your work, internship, volunteer, or other professional experience.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={openAddExperience}
                  className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                >
                  + Add Experience
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {profile?.experiences?.length ? (
                  profile.experiences.map((experience) => (
                    <div
                      key={experience.id}
                      className="flex items-start justify-between gap-6 px-6 py-6"
                    >
                      <div className="min-w-0">
                        <h3 className="font-semibold text-slate-900">
                          {experience.position}
                        </h3>

                        <p className="mt-1 text-sm text-slate-700">
                          {experience.company}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                          <span>
                            {new Date(experience.startDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "long",
                                year: "numeric",
                              }
                            )}
                            {" – "}
                            {experience.endDate
                              ? new Date(
                                  experience.endDate
                                ).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })
                              : "Present"}
                          </span>

                          {experience.location && (
                            <span>{experience.location}</span>
                          )}
                        </div>

                        {experience.bulletPoints.length > 0 && (
                          <ul className="mt-4 space-y-2">
                            {experience.bulletPoints.map((bullet, index) => (
                              <li
                                key={index}
                                className="flex gap-2 text-sm leading-6 text-slate-600"
                              >
                                <span>•</span>
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => openEditExperience(experience)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteExperience(experience.id)
                          }
                          className="rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm text-slate-500">
                      No work experience added yet.
                    </p>

                    <button
                      type="button"
                      onClick={openAddExperience}
                      className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Add your first experience
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Profile completion preview */}
            <section className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  ✦
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900">
                    Build your complete profile
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Add your education, skills, projects, work
                    experience, certifications, and achievements.
                    ApplyAI will use this information to calculate
                    job matches and create tailored resumes.
                  </p>
                </div>
              </div>
            </section>

            {showEducationModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        {editingEducation
                        ? "Edit Education"
                        : "Add Education"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Add your academic information.
                    </p>
                    </div>

                    <button
                    type="button"
                    onClick={() => setShowEducationModal(false)}
                    className="text-xl text-slate-400 hover:text-slate-600"
                    >
                    ×
                    </button>
                </div>

                <form
                    onSubmit={handleEducationSubmit}
                    className="space-y-5 px-6 py-6"
                >
                    <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        School *
                    </label>

                    <input
                        type="text"
                        value={educationForm.school}
                        onChange={(e) =>
                        setEducationForm({
                            ...educationForm,
                            school: e.target.value,
                        })
                        }
                        placeholder="University of Toronto"
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                        Degree *
                        </label>

                        <input
                        type="text"
                        value={educationForm.degree}
                        onChange={(e) =>
                            setEducationForm({
                            ...educationForm,
                            degree: e.target.value,
                            })
                        }
                        placeholder="BSc"
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                        Field of Study
                        </label>

                        <input
                        type="text"
                        value={educationForm.fieldOfStudy}
                        onChange={(e) =>
                            setEducationForm({
                            ...educationForm,
                            fieldOfStudy: e.target.value,
                            })
                        }
                        placeholder="Computer Science"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                        GPA
                        </label>

                        <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        value={educationForm.gpa}
                        onChange={(e) =>
                            setEducationForm({
                            ...educationForm,
                            gpa: e.target.value,
                            })
                        }
                        placeholder="3.55"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                        Graduation Date
                        </label>

                        <input
                        type="date"
                        value={educationForm.graduationDate}
                        onChange={(e) =>
                            setEducationForm({
                            ...educationForm,
                            graduationDate: e.target.value,
                            })
                        }
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                    </div>

                    <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Location
                    </label>

                    <input
                        type="text"
                        value={educationForm.location}
                        onChange={(e) =>
                        setEducationForm({
                            ...educationForm,
                            location: e.target.value,
                        })
                        }
                        placeholder="Toronto, ON"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                    <button
                        type="button"
                        onClick={() => setShowEducationModal(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                        {editingEducation ? "Save Changes" : "Add Education"}
                    </button>
                    </div>
                </form>
                </div>
            </div>
            )}

            {/* Skill Modal */}
            {showSkillModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                        {editingSkill ? "Edit Skill" : "Add Skill"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Add a skill to your professional profile.
                    </p>
                    </div>

                    <button
                    type="button"
                    onClick={() => setShowSkillModal(false)}
                    className="text-xl text-slate-400 transition hover:text-slate-600"
                    >
                    ×
                    </button>
                </div>

                <form
                    onSubmit={handleSkillSubmit}
                    className="space-y-5 px-6 py-6"
                >
                    {/* Skill */}
                    <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Skill *
                    </label>

                    <input
                        type="text"
                        value={skillForm.name}
                        onChange={(e) =>
                        setSkillForm({
                            ...skillForm,
                            name: e.target.value,
                        })
                        }
                        placeholder="e.g. Python, Leadership, Communication"
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                    </div>

                    {/* Category */}
                    <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                        Category
                        <span className="ml-1 font-normal text-slate-400">
                        (optional)
                        </span>
                    </label>

                    <input
                        type="text"
                        value={skillForm.category}
                        onChange={(e) =>
                        setSkillForm({
                            ...skillForm,
                            category: e.target.value,
                        })
                        }
                        placeholder="e.g. Programming Languages, Soft Skills"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />

                    <p className="mt-2 text-xs text-slate-400">
                        Use any category that best describes the skill, or leave it blank.
                    </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                    <button
                        type="button"
                        onClick={() => setShowSkillModal(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        {editingSkill ? "Save Changes" : "Add Skill"}
                    </button>
                    </div>
                </form>
                </div>
            </div>
            )}

            {showProjectModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
                <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {editingProject ? "Edit Project" : "Add Project"}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        Add a project to your professional profile.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowProjectModal(false)}
                      className="text-xl text-slate-400 transition hover:text-slate-600"
                    >
                      ×
                    </button>
                  </div>

                  <form
                    onSubmit={handleProjectSubmit}
                    className="space-y-5 px-6 py-6"
                  >
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Project Name *
                      </label>

                      <input
                        type="text"
                        value={projectForm.name}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            name: e.target.value,
                          })
                        }
                        placeholder="e.g. ApplyAI"
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Description
                      </label>

                      <textarea
                        value={projectForm.description}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            description: e.target.value,
                          })
                        }
                        placeholder="Briefly describe what the project does."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Technologies
                      </label>

                      <input
                        type="text"
                        value={projectForm.technologies}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            technologies: e.target.value,
                          })
                        }
                        placeholder="React, TypeScript, Node.js, PostgreSQL"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />

                      <p className="mt-1.5 text-xs text-slate-400">
                        Separate technologies with commas.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Bullet Points
                      </label>

                      <textarea
                        value={projectForm.bulletPoints}
                        onChange={(e) =>
                          setProjectForm({
                            ...projectForm,
                            bulletPoints: e.target.value,
                          })
                        }
                        placeholder={`Developed a full-stack web application...
            Built RESTful APIs...
            Integrated PostgreSQL...`}
                        rows={6}
                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />

                      <p className="mt-1.5 text-xs text-slate-400">
                        Put each resume bullet point on a separate line.
                      </p>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          GitHub URL
                        </label>

                        <input
                          type="url"
                          value={projectForm.githubUrl}
                          onChange={(e) =>
                            setProjectForm({
                              ...projectForm,
                              githubUrl: e.target.value,
                            })
                          }
                          placeholder="https://github.com/..."
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Live Demo URL
                        </label>

                        <input
                          type="url"
                          value={projectForm.demoUrl}
                          onChange={(e) =>
                            setProjectForm({
                              ...projectForm,
                              demoUrl: e.target.value,
                            })
                          }
                          placeholder="https://..."
                          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                      <button
                        type="button"
                        onClick={() => setShowProjectModal(false)}
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                      >
                        {editingProject ? "Save Changes" : "Add Project"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {showExperienceModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
              <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {editingExperience
                        ? "Edit Work Experience"
                        : "Add Work Experience"}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Add your professional experience and achievements.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExperienceModal(false)}
                    className="text-xl text-slate-400 transition hover:text-slate-600"
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={handleExperienceSubmit}
                  className="space-y-5 px-6 py-6"
                >
                  {/* Position */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Position *
                    </label>

                    <input
                      type="text"
                      value={experienceForm.position}
                      onChange={(e) =>
                        setExperienceForm({
                          ...experienceForm,
                          position: e.target.value,
                        })
                      }
                      placeholder="e.g. Software Developer Intern"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Company / Organization *
                    </label>

                    <input
                      type="text"
                      value={experienceForm.company}
                      onChange={(e) =>
                        setExperienceForm({
                          ...experienceForm,
                          company: e.target.value,
                        })
                      }
                      placeholder="e.g. Google"
                      required
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Location
                    </label>

                    <input
                      type="text"
                      value={experienceForm.location}
                      onChange={(e) =>
                        setExperienceForm({
                          ...experienceForm,
                          location: e.target.value,
                        })
                      }
                      placeholder="e.g. Toronto, ON"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Start Date *
                      </label>

                      <input
                        type="date"
                        value={experienceForm.startDate}
                        onChange={(e) =>
                          setExperienceForm({
                            ...experienceForm,
                            startDate: e.target.value,
                          })
                        }
                        required
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        End Date
                      </label>

                      <input
                        type="date"
                        value={experienceForm.endDate}
                        onChange={(e) =>
                          setExperienceForm({
                            ...experienceForm,
                            endDate: e.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />

                      <p className="mt-1.5 text-xs text-slate-400">
                        Leave blank if this is your current position.
                      </p>
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Responsibilities & Achievements
                    </label>

                    <textarea
                      value={experienceForm.bulletPoints}
                      onChange={(e) =>
                        setExperienceForm({
                          ...experienceForm,
                          bulletPoints: e.target.value,
                        })
                      }
                      placeholder={`Developed...
          Implemented...
          Collaborated...`}
                      rows={7}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />

                    <p className="mt-1.5 text-xs text-slate-400">
                      Put each resume bullet point on a separate line.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      onClick={() => setShowExperienceModal(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                      {editingExperience
                        ? "Save Changes"
                        : "Add Experience"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          </div>
        </main>
      </div>
    </div>
  );
}