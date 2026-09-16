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

    const analyses = await prisma.jobAnalysis.findMany({
      where: {
        application: {
          userid: userId,
        },
      },
      include: {
        application: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      analyses,
    });
  } catch (error) {
    console.error("Error fetching saved analyses:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch saved analyses.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Analysis ID is required." },
        { status: 400 }
      );
    }

    const analysis = await prisma.jobAnalysis.findFirst({
      where: {
        id: Number(id),
        application: {
          userid: userId,
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found." },
        { status: 404 }
      );
    }

    await prisma.jobAnalysis.delete({
      where: {
        id: Number(id),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting saved analysis:", error);

    return NextResponse.json(
      {
        error: "Failed to delete saved analysis.",
      },
      { status: 500 }
    );
  }
}