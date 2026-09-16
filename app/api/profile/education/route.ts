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
        education: {
          orderBy: {
            graduationDate: "desc",
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

    return NextResponse.json(profile.education);
  } catch (error) {
    console.error("Error fetching education:", error);

    return NextResponse.json(
      { error: "Failed to fetch education" },
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

    if (!body.school?.trim() || !body.degree?.trim()) {
      return NextResponse.json(
        { error: "School and degree are required" },
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

    const education = await prisma.education.create({
      data: {
        profileId: profile.id,
        school: body.school.trim(),
        degree: body.degree.trim(),
        fieldOfStudy: body.fieldOfStudy?.trim() || null,
        gpa: body.gpa ? Number(body.gpa) : null,
        graduationDate: body.graduationDate
          ? new Date(body.graduationDate)
          : null,
        location: body.location?.trim() || null,
      },
    });

    return NextResponse.json(education, { status: 201 });
  } catch (error) {
    console.error("Error creating education:", error);

    return NextResponse.json(
      { error: "Failed to create education" },
      { status: 500 }
    );
  }
}