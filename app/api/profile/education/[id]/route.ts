import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
    const educationId = Number(id);

    if (Number.isNaN(educationId)) {
      return NextResponse.json(
        { error: "Invalid education ID" },
        { status: 400 }
      );
    }

    const education = await prisma.education.findFirst({
      where: {
        id: educationId,
        profile: {
          userid: userId,
        },
      },
    });

    if (!education) {
      return NextResponse.json(
        { error: "Education not found" },
        { status: 404 }
      );
    }

    await prisma.education.delete({
      where: {
        id: educationId,
      },
    });

    return NextResponse.json({
      message: "Education deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting education:", error);

    return NextResponse.json(
      { error: "Failed to delete education" },
      { status: 500 }
    );
  }
}