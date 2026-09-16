import { NextResponse } from "next/server";
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
        jobAnalysis: true,
        tasks: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);

    return NextResponse.json(
      { error: "Failed to fetch applications." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      company,
      jobTitle,
      jobType,
      status,
      applicationDate,
      deadline,
      jobUrl,
      location,
      salary,
      notes,
      priority,
    } = body;

    if (!company || !jobTitle) {
      return NextResponse.json(
        {
          error: "Company and job title are required.",
        },
        { status: 400 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userid: userId,
        company,
        jobTitle,
        jobType: jobType || "FULL_TIME",
        status: status || "SAVED",
        applicationDate: applicationDate
          ? new Date(applicationDate)
          : null,
        deadline: deadline ? new Date(deadline) : null,
        jobUrl: jobUrl || null,
        location: location || null,
        salary: salary || null,
        notes: notes || null,
        priority: priority || "MEDIUM",

        statusHistory: {
          create: {
            status: status || "SAVED",
          },
        },
      },

      include: {
        statusHistory: true,
        jobAnalysis: true,
        tasks: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        application,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating application:", error);

    return NextResponse.json(
      { error: "Failed to create application." },
      { status: 500 }
    );
  }
}