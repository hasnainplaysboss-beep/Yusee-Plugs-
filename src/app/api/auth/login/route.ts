
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signCustomer } from "@/lib/customer-auth";
import { signAdmin } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Please enter your email and password." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Incorrect email or password." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      return NextResponse.json(
        { error: "Incorrect email or password." },
        { status: 401 }
      );
    }

    const isAdmin = user.role === "ADMIN";

    // Create the normal customer session.
    const customerToken = await signCustomer(user.id, user.email);

    const response = NextResponse.json({
      ok: true,
      signedIn: true,
      isAdmin,
      customer: {
        id: user.id,
        email: user.email
      }
    });

    response.cookies.set("yusee_customer", customerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8
    });

    if (isAdmin) {
      // Admins also receive an admin session.
      const adminToken = await signAdmin(user.id, user.email);

      response.cookies.set("yusee_admin", adminToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 8
      });
    } else {
      // Prevent a previous admin session remaining on a shared browser.
      response.cookies.set("yusee_admin", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0
      });
    }

    return response;

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
