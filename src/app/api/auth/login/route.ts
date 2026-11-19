
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAdmin } from "@/lib/admin-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase().trim();
    const password = String(body.password || "");

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log("ADMIN LOGIN: USER NOT FOUND");
      return NextResponse.json({ error: "Account not found." }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      console.log("ADMIN LOGIN: WRONG ROLE", user.role);
      return NextResponse.json({ error: "Account is not an admin." }, { status: 401 });
    }

    if (!user.passwordHash) {
      console.log("ADMIN LOGIN: NO PASSWORD HASH");
      return NextResponse.json({ error: "No password is saved." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log("ADMIN LOGIN PASSWORD MATCH:", valid);

    if (!valid) {
      return NextResponse.json({ error: "Password does not match." }, { status: 401 });
    }

    const token = await signAdmin(user.id, user.email);
    const res = NextResponse.json({ ok: true });

    res.cookies.set("yusee_admin", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 28800
    });

    return res;
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return NextResponse.json({ error: "Admin login failed." }, { status: 500 });
  }
}
