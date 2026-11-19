import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-auth";

export async function PATCH(req: Request) {
  try {
    const customer = await requireCustomer();

    if (!customer) {
      return NextResponse.json(
        { error: "Please sign in first." },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      newPassword.length < 8
    ) {
      return NextResponse.json(
        { error: "Your new password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: customer.id }
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Password account not found." },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!valid) {
      return NextResponse.json(
        { error: "Your current password is incorrect." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: customer.id },
      data: { passwordHash }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PASSWORD UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Could not change your password." },
      { status: 500 }
    );
  }
}
