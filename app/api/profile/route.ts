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
        { error: "Profile not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);

    return NextResponse.json(
      { error: "Failed to fetch profile." },
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

    const profile = await prisma.profile.update({
      where: {
        userid: userId,
      },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        location: body.location || null,
        linkedinUrl: body.linkedinUrl || null,
        githubUrl: body.githubUrl || null,
        portfolioUrl: body.portfolioUrl || null,
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

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error saving profile:", error);

    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 }
    );
  }
}