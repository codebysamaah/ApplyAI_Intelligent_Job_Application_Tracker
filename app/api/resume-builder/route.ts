import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const VALID_RESUME_FORMATS = [
  "SOFTWARE_ENGINEERING",
  "AI_DATA",
  "BUSINESS_FINANCE",
  "DESIGN_CREATIVE",
  "RESEARCH_ACADEMIA",
  "GENERAL_OTHER",
] as const;

type ResumeFormat = (typeof VALID_RESUME_FORMATS)[number];

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // Authenticate user
    // --------------------------------------------------

    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // --------------------------------------------------
    // Parse request
    // --------------------------------------------------

    const body = await request.json();

    const { jobAnalysisId, resumeFormat } = body;

    // --------------------------------------------------
    // Validate job analysis ID
    // --------------------------------------------------

    if (!jobAnalysisId) {
      return NextResponse.json(
        {
          error: "Job analysis ID is required.",
        },
        { status: 400 }
      );
    }

    const parsedJobAnalysisId = Number(jobAnalysisId);

    if (Number.isNaN(parsedJobAnalysisId)) {
      return NextResponse.json(
        {
          error: "Invalid job analysis ID.",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // Validate resume format
    // --------------------------------------------------

    if (
      !resumeFormat ||
      !VALID_RESUME_FORMATS.includes(
        resumeFormat as ResumeFormat
      )
    ) {
      return NextResponse.json(
        {
          error: "A valid resume format is required.",
        },
        { status: 400 }
      );
    }

    const selectedResumeFormat =
      resumeFormat as ResumeFormat;

    // --------------------------------------------------
    // Check Gemini API key
    // --------------------------------------------------

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Gemini API key is not configured.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Get logged-in user's profile
    // --------------------------------------------------

    const profile = await prisma.profile.findUnique({
      where: {
        userid: userId,
      },
      include: {
        education: true,
        skills: true,
        projects: true,
        experiences: true,
        certifications: true,
        achievements: true,
      },
    });

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "No profile found. Please complete your profile before building a resume.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Get job analysis belonging to the logged-in user
    // --------------------------------------------------

    const jobAnalysis =
      await prisma.jobAnalysis.findFirst({
        where: {
          id: parsedJobAnalysisId,
          application: {
            userid: userId,
          },
        },
        include: {
          application: true,
        },
      });

    if (!jobAnalysis) {
      return NextResponse.json(
        {
          error:
            "Job analysis not found or does not belong to your account.",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // Prepare profile data
    // --------------------------------------------------

    const profileData = {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      location: profile.location,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      portfolioUrl: profile.portfolioUrl,

      education: profile.education.map((education) => ({
        school: education.school,
        degree: education.degree,
        fieldOfStudy: education.fieldOfStudy,
        gpa: education.gpa,
        graduationDate: education.graduationDate,
        location: education.location,
      })),

      skills: profile.skills.map((skill) => ({
        name: skill.name,
        category: skill.category,
      })),

      projects: profile.projects.map((project) => ({
        name: project.name,
        description: project.description,
        technologies: project.technologies,
        bulletPoints: project.bulletPoints,
        githubUrl: project.githubUrl,
        demoUrl: project.demoUrl,
      })),

      experiences: profile.experiences.map(
        (experience) => ({
          company: experience.company,
          position: experience.position,
          location: experience.location,
          startDate: experience.startDate,
          endDate: experience.endDate,
          bulletPoints: experience.bulletPoints,
        })
      ),

      certifications: profile.certifications.map(
        (certification) => ({
          name: certification.name,
          issuer: certification.issuer,
          issueDate: certification.issueDate,
          expirationDate:
            certification.expirationDate,
          credentialUrl: certification.credentialUrl,
        })
      ),

      achievements: profile.achievements.map(
        (achievement) => ({
          title: achievement.title,
          description: achievement.description,
          date: achievement.date,
        })
      ),
    };

    // --------------------------------------------------
    // Prepare job data
    // --------------------------------------------------

    const jobData = {
      company: jobAnalysis.application.company,
      jobTitle: jobAnalysis.application.jobTitle,
      jobLocation: jobAnalysis.application.location,

      description: jobAnalysis.description,

      requiredSkills: jobAnalysis.requiredSkills || [],
      preferredSkills: jobAnalysis.preferredSkills || [],
      programmingLanguages:
        jobAnalysis.programmingLanguages || [],

      experienceRequirements:
        jobAnalysis.experienceRequirements || "",

      location: jobAnalysis.location || "",

      salary:
        jobAnalysis.salary ||
        jobAnalysis.application.salary ||
        "",

      responsibilities:
        jobAnalysis.responsibilities || [],

      matchScore: jobAnalysis.matchScore,

      matchedSkills: jobAnalysis.matchedSkills || [],
      partialMatches: jobAnalysis.partialMatches || [],
      missingSkills: jobAnalysis.missingSkills || [],

      matchedRequirements:
        jobAnalysis.matchedRequirements || [],

      missingRequirements:
        jobAnalysis.missingRequirements || [],

      strengths: jobAnalysis.strengths || [],

      recommendations:
        jobAnalysis.recommendations || [],

      recommendation:
        jobAnalysis.recommendation || "",
    };

    // --------------------------------------------------
    // Resume format instructions
    // --------------------------------------------------

    const formatInstructions: Record<
      ResumeFormat,
      string
    > = {
      SOFTWARE_ENGINEERING: `
Create a software engineering focused resume.

Prioritize:
- Software engineering experience
- Programming languages
- Data structures and algorithms
- Backend, frontend, and full-stack development
- APIs
- Databases
- Cloud and deployment
- Testing
- System design or systems programming
- Software architecture
- Developer tools

Skills should be grouped into technical categories such as:
- Languages
- Frameworks & Libraries
- Databases
- Cloud & DevOps
- Developer Tools
- AI/ML when relevant

Use concise, technical, ATS-friendly wording.

Prioritize projects and experience that demonstrate actual software development.
`,

      AI_DATA: `
Create an AI, machine learning, or data focused resume.

Prioritize:
- Machine learning
- Deep learning
- NLP
- LLMs
- RAG
- Embeddings
- Model evaluation
- Data preprocessing
- Data analysis
- Python
- NumPy
- Pandas
- scikit-learn
- Hugging Face
- TensorFlow/PyTorch only if actually present in the profile
- AI-powered applications
- Data pipelines
- Statistical or analytical work

Skills should emphasize:
- Programming
- Machine Learning
- AI/NLP
- Data Science
- Libraries & Frameworks
- Tools

Prioritize projects and experience involving real AI, ML, or data work.

Do not add technologies simply because they appear in the job description.
`,

      BUSINESS_FINANCE: `
Create a business or finance focused resume.

Prioritize:
- Business impact
- Data analysis
- Problem solving
- Communication
- Leadership
- Project management
- Analytical skills
- Relevant technical skills
- Process improvement
- Collaboration
- Quantitative work

Use accessible language while keeping relevant technical skills.

Do not invent finance, accounting, investment, banking, or business experience.

Only include such experience if it actually exists in the profile.
`,

      DESIGN_CREATIVE: `
Create a design and creative focused resume.

Prioritize:
- Design-related projects
- User experience
- User interfaces
- Frontend development
- Visual communication
- Creative problem solving
- Prototyping
- Product thinking
- Collaboration
- Relevant tools

Emphasize projects that demonstrate creativity, design thinking, or user-facing development.

Do not invent design tools, design experience, or portfolio work that is not present in the profile.
`,

      RESEARCH_ACADEMIA: `
Create a research and academia focused resume.

Prioritize:
- Research projects
- Machine learning research
- Data analysis
- Technical coursework
- Academic projects
- Experimental work
- Methodology
- Results
- Technical writing
- Publications or presentations if actually present
- Relevant academic achievements

Emphasize technical depth and analytical rigor.

Do not invent publications, research positions, papers, conferences, or academic achievements.
`,

      GENERAL_OTHER: `
Create a general-purpose professional resume.

Balance:
- Education
- Technical skills
- Experience
- Projects
- Certifications
- Achievements

Prioritize the content most relevant to the selected job while maintaining broad professional appeal.

Keep the resume concise, polished, ATS-friendly, and easy to scan.
`,
    };

    // --------------------------------------------------
    // Create Gemini prompt
    // --------------------------------------------------

    const prompt = `
You are an expert resume writer and ATS optimization specialist.

Your task is to create a concise, professional, one-page resume tailored to the selected job posting.

IMPORTANT RULES:

1. NEVER invent facts.
2. NEVER invent technologies.
3. NEVER invent metrics.
4. NEVER invent job experience.
5. NEVER invent dates.
6. NEVER invent companies.
7. NEVER invent projects.
8. NEVER invent degrees or certifications.
9. NEVER claim that the candidate knows a technology simply because the job posting asks for it.
10. Only use information contained in the candidate profile.
11. You may rewrite existing information to make it stronger and more concise.
12. You may reorder existing content based on relevance.
13. You may shorten bullet points.
14. You may combine closely related existing information when doing so does not introduce new facts.
15. Do not add generic filler.
16. Keep the resume concise enough for approximately one page.
17. Prioritize information that matches the selected job.
18. Follow the selected resume format exactly.
19. Use ATS-friendly terminology when the candidate actually has the corresponding experience or skill.
20. Do not include empty sections unless necessary.
21. Do not use markdown formatting.
22. Return ONLY valid JSON.

==================================================
SELECTED RESUME FORMAT
==================================================

${selectedResumeFormat}

==================================================
FORMAT-SPECIFIC INSTRUCTIONS
==================================================

${formatInstructions[selectedResumeFormat]}

==================================================
CANDIDATE PROFILE
==================================================

${JSON.stringify(profileData, null, 2)}

==================================================
SELECTED JOB
==================================================

${JSON.stringify(jobData, null, 2)}

==================================================
OUTPUT FORMAT
==================================================

Return exactly one JSON object using this structure:

{
  "summary": "string",

  "education": [
    {
      "school": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "gpa": "string",
      "graduationDate": "string",
      "location": "string"
    }
  ],

  "skills": [
    {
      "category": "string",
      "skills": ["string"]
    }
  ],

  "experience": [
    {
      "company": "string",
      "position": "string",
      "location": "string",
      "dates": "string",
      "bulletPoints": ["string"]
    }
  ],

  "projects": [
    {
      "name": "string",
      "technologies": ["string"],
      "bulletPoints": ["string"]
    }
  ],

  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string"
    }
  ],

  "achievements": [
    {
      "title": "string",
      "description": "string",
      "date": "string"
    }
  ]
}

ADDITIONAL REQUIREMENTS:

- "summary" should be concise and tailored to the job.
- Education should contain the candidate's actual education.
- Skills should contain only actual candidate skills.
- Experience should contain only actual candidate experience.
- Projects should contain only actual candidate projects.
- Certifications should contain only actual certifications.
- Achievements should contain only actual achievements.
- Do not repeat the same information unnecessarily.
- Use strong action-oriented wording for bullets where supported by the candidate's original content.
- Do not fabricate numerical results.
- Do not fabricate impact.
- Do not fabricate responsibilities.
- Do not include placeholders such as "[insert metric]".
- If a field is unknown or unavailable, use an empty string.
- Arrays should be empty when there is no relevant information.
- Keep bullet points short enough for a one-page resume.
`;

    // --------------------------------------------------
    // Generate resume with Gemini
    // --------------------------------------------------

    const ai = new GoogleGenAI({
      apiKey,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
      },
    });

    // --------------------------------------------------
    // Parse Gemini response
    // --------------------------------------------------

    let resume;

    try {
      let cleanedText = response.text?.trim() || "";

      cleanedText = cleanedText
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      const firstBrace = cleanedText.indexOf("{");
      const lastBrace = cleanedText.lastIndexOf("}");

      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error(
          "No valid JSON object found in Gemini response."
        );
      }

      cleanedText = cleanedText.slice(
        firstBrace,
        lastBrace + 1
      );

      resume = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error(
        "Failed to parse Gemini resume JSON:",
        parseError
      );

      console.error(
        "Gemini response:",
        response.text ?? ""
      );

      return NextResponse.json(
        {
          error:
            "The AI returned an invalid resume format. Please try again.",
        },
        { status: 500 }
      );
    }

    // --------------------------------------------------
    // Normalize Gemini response
    // --------------------------------------------------

    const normalizedResume = {
      summary:
        typeof resume.summary === "string"
          ? resume.summary
          : "",

      education: Array.isArray(resume.education)
        ? resume.education
        : [],

      skills: Array.isArray(resume.skills)
        ? resume.skills
        : [],

      experience: Array.isArray(resume.experience)
        ? resume.experience
        : [],

      projects: Array.isArray(resume.projects)
        ? resume.projects
        : [],

      certifications: Array.isArray(
        resume.certifications
      )
        ? resume.certifications
        : [],

      achievements: Array.isArray(
        resume.achievements
      )
        ? resume.achievements
        : [],
    };

    // --------------------------------------------------
    // Return generated resume
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      resume: normalizedResume,
      resumeFormat: selectedResumeFormat,
      jobAnalysisId: parsedJobAnalysisId,

      application: {
        company: jobAnalysis.application.company,
        jobTitle: jobAnalysis.application.jobTitle,
      },
    });
  } catch (error) {
    console.error(
      "Error generating resume:",
      error
    );

    if (
      error instanceof Error &&
      error.message.includes("429")
    ) {
      return NextResponse.json(
        {
          error:
            "AI quota has been reached. Please try again later.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Failed to generate resume. Please try again.",
      },
      { status: 500 }
    );
  }
}