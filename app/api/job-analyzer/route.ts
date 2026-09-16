import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    /*
     * ---------------------------------------------------------
     * STEP 0: Authenticate user
     * ---------------------------------------------------------
     */

    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { company, jobTitle, description } = body;

    if (!description?.trim()) {
      return NextResponse.json(
        { error: "Job description is required." },
        { status: 400 }
      );
    }

    const cleanDescription = description.trim();

    /*
     * ---------------------------------------------------------
     * STEP 1: Check if THIS USER already analyzed this job
     * ---------------------------------------------------------
     */

    const existingApplication = await prisma.application.findFirst({
      where: {
        userid: userId,
        jobAnalysis: {
          is: {
            description: cleanDescription,
          },
        },
      },
      include: {
        jobAnalysis: true,
      },
    });

    if (existingApplication?.jobAnalysis) {
      return NextResponse.json({
        success: true,
        existing: true,
        applicationId: existingApplication.id,
        analysis: {
          requiredSkills:
            existingApplication.jobAnalysis.requiredSkills || [],
          preferredSkills:
            existingApplication.jobAnalysis.preferredSkills || [],
          programmingLanguages:
            existingApplication.jobAnalysis.programmingLanguages || [],
          experienceRequirements:
            existingApplication.jobAnalysis.experienceRequirements || "",
          location:
            existingApplication.jobAnalysis.location || "",
          salary:
            existingApplication.jobAnalysis.salary || "",
          responsibilities:
            existingApplication.jobAnalysis.responsibilities || [],
        },
        match:
          existingApplication.jobAnalysis.matchScore !== null
            ? {
                matchScore:
                  existingApplication.jobAnalysis.matchScore,
              }
            : null,
      });
    }

    /*
     * ---------------------------------------------------------
     * STEP 2: Analyze the job with Gemini
     * ---------------------------------------------------------
     */

    const analysisPrompt = `
You are a job description analyzer for a job application tracking application.

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
${company || "Not provided"}

Job Title:
${jobTitle || "Not provided"}

Job Description:
${cleanDescription}
`;

    const analysisResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: analysisPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const analysis = JSON.parse(
      analysisResponse.text || "{}"
    );

    /*
     * ---------------------------------------------------------
     * STEP 3: Get THIS USER'S profile
     * ---------------------------------------------------------
     */

    const profile = await prisma.profile.findUnique({
      where: {
        userid: userId,
      },
      include: {
        skills: true,
        projects: true,
        experiences: true,
        education: true,
        certifications: true,
        achievements: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "No profile found. Please complete your profile before analyzing jobs.",
        },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * STEP 4: Prepare profile data for matching
     * ---------------------------------------------------------
     */

    const profileData = {
      skills: profile.skills.map((skill) => ({
        name: skill.name,
        category: skill.category,
      })),

      projects: profile.projects.map((project) => ({
        name: project.name,
        description: project.description,
        technologies: project.technologies,
        bulletPoints: project.bulletPoints,
      })),

      experiences: profile.experiences.map((experience) => ({
        company: experience.company,
        position: experience.position,
        bulletPoints: experience.bulletPoints,
      })),

      education: profile.education.map((education) => ({
        school: education.school,
        degree: education.degree,
        fieldOfStudy: education.fieldOfStudy,
      })),

      certifications: profile.certifications.map((certification) => ({
        name: certification.name,
        issuer: certification.issuer,
      })),

      achievements: profile.achievements.map((achievement) => ({
        title: achievement.title,
        description: achievement.description,
      })),
    };

    /*
     * ---------------------------------------------------------
     * STEP 5: Calculate match score with Gemini
     * ---------------------------------------------------------
     */

    const matchPrompt = `
You are an intelligent job matching system.

Compare the candidate's profile against the analyzed job requirements.

IMPORTANT:
- Only give credit for skills or experience actually supported by the profile.
- Do not assume knowledge of a technology because it is similar to another.
- Do not invent experience.
- Distinguish between direct matches and partial matches.
- Required skills should have more weight than preferred skills.
- Projects count as relevant experience.
- Technologies listed in projects count as demonstrated technical skills.
- Experience bullet points should be considered.
- Programming languages explicitly listed in projects or skills count as demonstrated.
- Do not penalize the candidate for information that the job posting does not require.

Calculate a realistic match score from 0 to 100.

Scoring guidance:
- Required skills: highest importance
- Programming languages: high importance
- Relevant experience/projects: high importance
- Preferred skills: lower importance
- Education/certifications: supporting evidence

Return ONLY valid JSON with exactly this structure:

{
  "matchScore": number,
  "matchedSkills": string[],
  "partialMatches": string[],
  "missingSkills": string[],
  "matchedRequirements": string[],
  "missingRequirements": string[],
  "strengths": string[],
  "recommendations": string[],
  "recommendation": string
}

Rules:
- matchScore must be an integer from 0 to 100.
- matchedSkills should contain skills the candidate clearly has.
- partialMatches should contain skills where the candidate has related or limited experience.
- missingSkills should contain important job skills that are not demonstrated.
- matchedRequirements should describe important job requirements the candidate satisfies.
- missingRequirements should describe important job requirements the candidate does not satisfy.
- strengths should contain 3 to 5 concise strengths.
- recommendations should contain 3 to 5 actionable suggestions.
- recommendation should be one concise overall recommendation.
- Do not include markdown.
- Do not include explanations outside the JSON object.

JOB ANALYSIS:

${JSON.stringify(analysis, null, 2)}

CANDIDATE PROFILE:

${JSON.stringify(profileData, null, 2)}
`;

    const matchResponse = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: matchPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const match = JSON.parse(
      matchResponse.text || "{}"
    );

    /*
     * ---------------------------------------------------------
     * STEP 6: Create the Application for THIS USER
     * ---------------------------------------------------------
     */

    const application = await prisma.application.create({
      data: {
        userid: userId,
        company: company?.trim() || "Unknown Company",
        jobTitle: jobTitle?.trim() || "Unknown Position",
        jobType: "FULL_TIME",
        status: "SAVED",

        statusHistory: {
          create: {
            status: "SAVED",
          },
        },
      },
    });

    /*
     * ---------------------------------------------------------
     * STEP 7: Save the Job Analysis + Match Score
     * ---------------------------------------------------------
     */

    await prisma.jobAnalysis.create({
      data: {
        applicationId: application.id,
        description: cleanDescription,

        requiredSkills: analysis.requiredSkills || [],
        preferredSkills: analysis.preferredSkills || [],
        programmingLanguages:
          analysis.programmingLanguages || [],

        experienceRequirements:
          analysis.experienceRequirements || "",

        location: analysis.location || "",
        salary: analysis.salary || "",

        responsibilities:
          analysis.responsibilities || [],

        matchScore: match.matchScore ?? null,

        matchedSkills: match.matchedSkills || [],
        partialMatches: match.partialMatches || [],
        missingSkills: match.missingSkills || [],
        matchedRequirements:
          match.matchedRequirements || [],
        missingRequirements:
          match.missingRequirements || [],
        strengths: match.strengths || [],
        recommendations:
          match.recommendations || [],
        recommendation:
          match.recommendation || "",
      },
    });

    /*
     * ---------------------------------------------------------
     * STEP 8: Return results
     * ---------------------------------------------------------
     */

    return NextResponse.json({
      success: true,
      existing: false,
      applicationId: application.id,
      analysis,
      match,
    });
  } catch (error) {
    console.error("Job analysis error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to analyze job description.",
      },
      { status: 500 }
    );
  }
}