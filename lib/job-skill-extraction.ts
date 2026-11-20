import { GoogleGenAI } from "@google/genai";

export type JobSkillAnalysis = {
  requiredSkills: string[];
  preferredSkills: string[];
  programmingLanguages: string[];
  experienceRequirements: string;
  location: string;
  salary: string;
  responsibilities: string[];
};

export const JOB_SKILL_EXTRACTION_PROMPT = `You are a job description analyzer for a job application tracking application.

Analyze the provided job description and extract ONLY information explicitly
supported by the job posting.

Return ONLY valid JSON with exactly these fields:

{
  "requiredSkills": string[],
  "preferredSkills": string[],
  "programmingLanguages": string[],
  "experienceRequirements": string,
  "location": string,
  "salary": string,
  "responsibilities": string[]
}

Rules:
- Do not invent information.
- Keep skills concise and normalized.
- Separate required skills from preferred/nice-to-have skills.
- Programming languages should contain ONLY programming languages explicitly
  mentioned in the posting.
- If information is not provided, return an empty string or empty array.
- Responsibilities should contain concise summaries of the major responsibilities.
- Do not include markdown.
- Do not include explanations outside the JSON object.

Company:
{{company}}

Job Title:
{{jobTitle}}

Job Description:
{{description}}`;

export function buildJobAnalysisPrompt(input: {
  company?: string;
  jobTitle?: string;
  description: string;
}): string {
  return JOB_SKILL_EXTRACTION_PROMPT
    .replace("{{company}}", input.company || "Not provided")
    .replace("{{jobTitle}}", input.jobTitle || "Not provided")
    .replace("{{description}}", input.description.trim());
}

export async function extractJobSkills(
  ai: GoogleGenAI,
  input: { company?: string; jobTitle?: string; description: string },
): Promise<JobSkillAnalysis> {
  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: buildJobAnalysisPrompt(input),
    config: { responseMimeType: "application/json" },
  });
  const parsed = JSON.parse(response.text || "{}");
  return {
    requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
    preferredSkills: Array.isArray(parsed.preferredSkills) ? parsed.preferredSkills : [],
    programmingLanguages: Array.isArray(parsed.programmingLanguages) ? parsed.programmingLanguages : [],
    experienceRequirements: typeof parsed.experienceRequirements === "string" ? parsed.experienceRequirements : "",
    location: typeof parsed.location === "string" ? parsed.location : "",
    salary: typeof parsed.salary === "string" ? parsed.salary : "",
    responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
  };
}
