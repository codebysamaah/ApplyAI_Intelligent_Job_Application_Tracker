import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const experienceId = Number(id);

    if (Number.isNaN(experienceId)) {
      return NextResponse.json(
        { error: "Invalid experience ID" },
        { status: 400 }
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

    const experience = await prisma.experience.findFirst({
      where: {
        id: experienceId,
        profile: {
          userid: userId,
        },
      },
    });

    if (!experience) {
      return NextResponse.json(
        { error: "Experience not found" },
        { status: 404 }
      );
    }

    const updatedExperience = await prisma.experience.update({
      where: {
        id: experienceId,
      },
      data: {
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

    return NextResponse.json(updatedExperience);
  } catch (error) {
    console.error("Error updating experience:", error);

    return NextResponse.json(
      { error: "Failed to update experience" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: RouteContext
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const experienceId = Number(id);

    if (Number.isNaN(experienceId)) {
      return NextResponse.json(
        { error: "Invalid experience ID" },
        { status: 400 }
      );
    }

    const experience = await prisma.experience.findFirst({
      where: {
        id: experienceId,
        profile: {
          userid: userId,
        },
      },
    });

    if (!experience) {
      return NextResponse.json(
        { error: "Experience not found" },
        { status: 404 }
      );
    }

    await prisma.experience.delete({
      where: {
        id: experienceId,
      },
    });

    return NextResponse.json({
      message: "Experience deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting experience:", error);

    return NextResponse.json(
      { error: "Failed to delete experience" },
      { status: 500 }
    );
  }
}