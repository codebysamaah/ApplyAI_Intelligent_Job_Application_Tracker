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
    const skillId = Number(id);

    if (Number.isNaN(skillId)) {
      return NextResponse.json(
        { error: "Invalid skill ID" },
        { status: 400 }
      );
    }

    const skill = await prisma.skill.findFirst({
      where: {
        id: skillId,
        profile: {
          userid: userId,
        },
      },
    });

    if (!skill) {
      return NextResponse.json(
        { error: "Skill not found" },
        { status: 404 }
      );
    }

    await prisma.skill.delete({
      where: {
        id: skillId,
      },
    });

    return NextResponse.json({
      message: "Skill deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting skill:", error);

    return NextResponse.json(
      { error: "Failed to delete skill" },
      { status: 500 }
    );
  }
}