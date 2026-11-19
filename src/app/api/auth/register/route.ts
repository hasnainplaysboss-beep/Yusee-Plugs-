
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signCustomer } from "@/lib/customer-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    if (!name || !email || !email.includes("@") || password.length < 8) {
      return NextResponse.json(
        { error: "Enter your name, a valid email and a password of at least 8 characters." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "CUSTOMER"
      }
    });

    const token = await signCustomer(user.id, user.email);
    const res = NextResponse.json({ ok: true });

    res.cookies.set("yusee_customer", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 28800
    });

    return res;
} catch (error) {
  console.error("CUSTOMER REGISTRATION ERROR:", error);

  return NextResponse.json(
    { error: "Registration failed. Check server logs." },
    { status: 500 }
  );
}
