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

    const profile = await prisma.profile.findUnique({
      where: {
        userid: userId,
      },
      include: {
        projects: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(profile.projects);
  } catch (error) {
    console.error("Error fetching projects:", error);

    return NextResponse.json(
      { error: "Failed to fetch projects" },
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

    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: {
        userid: userId,
      },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const technologies = Array.isArray(body.technologies)
      ? body.technologies.filter(
          (technology: unknown) =>
            typeof technology === "string" && technology.trim()
        )
      : [];

    const bulletPoints = Array.isArray(body.bulletPoints)
      ? body.bulletPoints.filter(
          (bullet: unknown) =>
            typeof bullet === "string" && bullet.trim()
        )
      : [];

    const project = await prisma.project.create({
      data: {
        profileId: profile.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        technologies,
        bulletPoints,
        githubUrl: body.githubUrl?.trim() || null,
        demoUrl: body.demoUrl?.trim() || null,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}