
import { NextResponse } from "next/server";
import { requireCustomer } from "@/lib/customer-auth";

export async function GET() {
  try {
    const customer = await requireCustomer();

    return NextResponse.json({
      signedIn: !!customer,
      customer
    });
  } catch {
    return NextResponse.json(
      { signedIn: false, customer: null },
      { status: 500 }
    );
  }
}
