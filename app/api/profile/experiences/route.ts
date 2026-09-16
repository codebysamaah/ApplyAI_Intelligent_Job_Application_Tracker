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
        experiences: {
          orderBy: {
            startDate: "desc",
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

    return NextResponse.json(profile.experiences);
  } catch (error) {
    console.error("Error fetching experiences:", error);

    return NextResponse.json(
      { error: "Failed to fetch experiences" },
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

    if (!body.company?.trim()) {
      return NextResponse.json(
        { error: "Company is required" },
        { status: 400 }
      );
    }

    if (!body.position?.trim()) {
      return NextResponse.json(
        { error: "Position is required" },
        { status: 400 }
      );
    }

    if (!body.startDate) {
      return NextResponse.json(
        { error: "Start date is required" },
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

    const experience = await prisma.experience.create({
      data: {
        profileId: profile.id,
        company: body.company.trim(),
        position: body.position.trim(),
        location: body.location?.trim() || null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        bulletPoints: Array.isArray(body.bulletPoints)
          ? body.bulletPoints
              .map((item: string) => item.trim())
              .filter(Boolean)
          : [],
      },
    });

    return NextResponse.json(experience, { status: 201 });
  } catch (error) {
    console.error("Error creating experience:", error);

    return NextResponse.json(
      { error: "Failed to create experience" },
      { status: 500 }
    );
  }
}