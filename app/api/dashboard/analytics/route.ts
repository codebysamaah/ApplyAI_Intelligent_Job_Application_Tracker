import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const now = new Date();

    // Start and end of the current month
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const startOfNextMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1
    );

    // Get only this user's applications
    const applications = await prisma.application.findMany({
      where: {
        userid: userId,
      },
      include: {
        statusHistory: {
          orderBy: {
            changedAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Applications submitted this month
    const monthlyApplications = applications.filter((app) => {
      const date = app.applicationDate ?? app.createdAt;

      return (
        date >= startOfMonth &&
        date < startOfNextMonth
      );
    });

    const applicationsThisMonth = monthlyApplications.length;

    // Response rate
    const respondedApplications = monthlyApplications.filter((app) => {
      return (
        ["OA", "INTERVIEW", "OFFER", "REJECTED"].includes(app.status) ||
        app.statusHistory.some((history) =>
          ["OA", "INTERVIEW", "OFFER", "REJECTED"].includes(
            history.status
          )
        )
      );
    });

    const responseRate =
      applicationsThisMonth > 0
        ? Math.round(
            (respondedApplications.length / applicationsThisMonth) * 100
          )
        : 0;

    // Interview rate
    const interviewApplications = monthlyApplications.filter((app) => {
      return (
        app.status === "INTERVIEW" ||
        app.statusHistory.some(
          (history) => history.status === "INTERVIEW"
        )
      );
    });

    const interviewRate =
      applicationsThisMonth > 0
        ? Math.round(
            (interviewApplications.length / applicationsThisMonth) * 100
          )
        : 0;

    // Status breakdown
    const statusBreakdown = {
      SAVED: 0,
      APPLIED: 0,
      OA: 0,
      INTERVIEW: 0,
      OFFER: 0,
      REJECTED: 0,
    };

    monthlyApplications.forEach((app) => {
      statusBreakdown[app.status]++;
    });

    // Top companies
    const companyCounts: Record<string, number> = {};

    monthlyApplications.forEach((app) => {
      const company = app.company.trim();

      companyCounts[company] =
        (companyCounts[company] || 0) + 1;
    });

    const topCompanies = Object.entries(companyCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([company, count]) => ({
        company,
        count,
      }));

    // Top roles
    const roleCounts: Record<string, number> = {};

    monthlyApplications.forEach((app) => {
      const role = app.jobTitle.trim();

      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    const topRoles = Object.entries(roleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([role, count]) => ({
        role,
        count,
      }));

    // Application → Interview time
    const interviewTimes: number[] = [];

    monthlyApplications.forEach((app) => {
      if (!app.applicationDate) return;

      const firstInterview = app.statusHistory.find(
        (history) => history.status === "INTERVIEW"
      );

      if (!firstInterview) return;

      const difference =
        firstInterview.changedAt.getTime() -
        app.applicationDate.getTime();

      const days = difference / (1000 * 60 * 60 * 24);

      if (days >= 0) {
        interviewTimes.push(days);
      }
    });

    const averageApplicationToInterview =
      interviewTimes.length > 0
        ? Math.round(
            (interviewTimes.reduce((sum, days) => sum + days, 0) /
              interviewTimes.length) *
              10
          ) / 10
        : null;

    // ----------------------------------------
    // ALL ANALYTICS HAVE NOW BEEN CALCULATED
    // ----------------------------------------

    const analytics = {
      applicationsThisMonth,
      responseRate,
      interviewRate,
      averageApplicationToInterview,
      statusBreakdown,
      topCompanies,
      topRoles,
      interviewApplications: interviewApplications.length,
      respondedApplications: respondedApplications.length,
    };

    // ----------------------------------------
    // GEMINI ONLY INTERPRETS THE ANALYTICS
    // ----------------------------------------

    let aiSummary =
      "AI summary is currently unavailable.";

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
        });

        const prompt = `
You are an AI career assistant helping a user analyze their job search.

Below are statistics that have already been calculated by the application.
Do NOT recalculate, modify, or invent any numbers.

Analytics:
${JSON.stringify(analytics, null, 2)}

Provide a concise and useful summary of the user's job search.

Focus on:
- How active their job search is
- Their response and interview rates
- Their current application pipeline
- Any notable patterns in companies or roles
- Their average time to interview if available
- One practical recommendation

Keep the response between 80 and 120 words.

Be encouraging but honest.
Do not mention that you are an AI.
Do not use markdown headings.
Do not use bullet points.
`;

        const response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
          config: {
            temperature: 0.4,
            maxOutputTokens: 200,
          },
        });

        if (response.text) {
          aiSummary = response.text.trim();
        }
      } catch (aiError) {
        console.error("Failed to generate AI summary:", aiError);

        aiSummary =
          "Your application activity is being analyzed. Check back for personalized insights.";
      }
    }

    return NextResponse.json({
      success: true,

      period: {
        start: startOfMonth.toISOString(),
        end: new Date(
          startOfNextMonth.getTime() - 1
        ).toISOString(),
      },

      metrics: {
        applicationsThisMonth,
        responseRate,
        interviewRate,
        averageApplicationToInterview,
      },

      statusBreakdown,

      topCompanies,

      topRoles,

      interviewApplications: interviewApplications.length,

      respondedApplications: respondedApplications.length,

      aiSummary,
    });
  } catch (error) {
    console.error("Failed to calculate dashboard analytics:", error);

    return NextResponse.json(
      {
        error: "Failed to calculate dashboard analytics",
      },
      { status: 500 }
    );
  }
}