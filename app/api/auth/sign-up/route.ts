import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createAuthToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, password } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        {
          error: "Name, email, and password are required.",
        },
        { status: 400 }
      );
    }

    // Basic password validation
    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "Password must be at least 8 characters.",
        },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email
      .trim()
      .toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists.",
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    // Create user and profile together
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,

        profile: {
          create: {
            name: name.trim(),
            email: normalizedEmail,
          },
        },
      },

      include: {
        profile: true,
      },
    });

    // Create authentication token
    const token = await createAuthToken(user.id);

    // Create secure HTTP-only cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.profile?.name,
        },
      },
      { status: 201 }
    );

    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(
      "Error creating account:",
      error
    );

    return NextResponse.json(
      {
        error: "Failed to create account.",
      },
      { status: 500 }
    );
  }
}