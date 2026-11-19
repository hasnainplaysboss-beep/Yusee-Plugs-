
import { NextResponse } from "next/server";
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

    const body = await req.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();

    if (!name || !email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Enter a valid name and email address." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id: customer.id }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: "That email address is already registered." },
        { status: 409 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: customer.id },
      data: {
        name,
        email,
        phone: phone || null
      },
      select: {
        name: true,
        email: true,
        phone: true
      }
    });

    return NextResponse.json({
      success: true,
      customer: updated
    });
  } catch (error) {
    console.error("ACCOUNT DETAILS UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Could not update your details." },
      { status: 500 }
    );
  }
}
