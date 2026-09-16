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
        skills: {
          orderBy: {
            name: "asc",
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

    return NextResponse.json(profile.skills);
  } catch (error) {
    console.error("Error fetching skills:", error);

    return NextResponse.json(
      { error: "Failed to fetch skills" },
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
        { error: "Skill name is required" },
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

    const skill = await prisma.skill.create({
      data: {
        profileId: profile.id,
        name: body.name.trim(),
        category: body.category?.trim() || null,
      },
    });

    return NextResponse.json(skill, { status: 201 });
  } catch (error) {
    console.error("Error creating skill:", error);

    return NextResponse.json(
      { error: "Failed to create skill" },
      { status: 500 }
    );
  }
}