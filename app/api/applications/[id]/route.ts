import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/applications/:id
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const applicationId = Number(id);

    if (Number.isNaN(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 }
      );
    }

    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userid: userId,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("Failed to fetch application:", error);

    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

// PATCH /api/applications/:id
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const applicationId = Number(id);

    if (Number.isNaN(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 }
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

    // Get the current application and verify ownership
    const existingApplication = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userid: userId,
      },
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check whether the status actually changed
    const statusChanged =
      status !== undefined &&
      status !== existingApplication.status;

    const application = await prisma.$transaction(async (tx) => {
      const updatedApplication = await tx.application.update({
        where: {
          id: applicationId,
        },
        data: {
          company,
          jobTitle,
          jobType,
          status,
          applicationDate: applicationDate
            ? new Date(applicationDate)
            : undefined,
          deadline: deadline
            ? new Date(deadline)
            : undefined,
          jobUrl,
          location,
          salary,
          notes,
          priority,
        },
      });

      // Only create a history record if the status changed
      if (statusChanged && status) {
        await tx.applicationStatusHistory.create({
          data: {
            applicationId,
            status,
          },
        });
      }

      return updatedApplication;
    });

    return NextResponse.json(application);
  } catch (error) {
    console.error("Failed to update application:", error);

    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

// DELETE /api/applications/:id
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const applicationId = Number(id);

    if (Number.isNaN(applicationId)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        userid: userId,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    await prisma.application.delete({
      where: {
        id: applicationId,
      },
    });

    return NextResponse.json({
      message: "Application deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete application:", error);

    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}