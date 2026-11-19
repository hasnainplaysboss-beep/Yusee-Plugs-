
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [products, orders, customers] = await Promise.all([
      prisma.product.findMany({
        include: { variants: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.order.findMany({
        include: { items: true, refunds: true },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const paid = orders.filter(o =>
      ["PAID", "PARTIALLY_REFUNDED"].includes(o.paymentStatus)
    );

    const revenue = paid.reduce(
      (sum, order) =>
        sum +
        order.totalPence -
        order.refunds
          .filter(refund => refund.status === "SUCCEEDED")
          .reduce((total, refund) => total + refund.amountPence, 0),
      0
    );

    return NextResponse.json({
      products,
      orders,
      customers,
      revenue: revenue / 100
    });
  } catch (error) {
    console.error("ADMIN DATA ERROR:", error);
    return NextResponse.json(
      { error: "Could not load admin data." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!await requireAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const b = await req.json();

    if (b.action === "role") {
      if (!["ADMIN", "CUSTOMER"].includes(b.role)) {
        return NextResponse.json({ error: "Invalid role." }, { status: 400 });
      }

      const user = await prisma.user.update({
        where: { id: b.id },
        data: { role: b.role }
      });

      return NextResponse.json(user);
    }

    if (b.action === "order") {
      const order = await prisma.order.update({
        where: { id: b.id },
        data: {
          status: b.status,
          trackingNumber: b.trackingNumber || null,
          courier: b.courier || null
        }
      });

      return NextResponse.json(order);
    }

    if (b.action === "product") {
      if (!String(b.name || "").trim()) {
        return NextResponse.json(
          { error: "Product name is required." },
          { status: 400 }
        );
      }

      if (!Array.isArray(b.variants) || b.variants.length === 0) {
        return NextResponse.json(
          { error: "At least one product variant is required." },
          { status: 400 }
        );
      }

      const variants = b.variants.map((v: any) => ({
        size: String(v.size || "").trim() || null,
        colour: String(v.colour || "").trim() || null,
        pricePence: Math.round(Number(v.price) * 100),
        stock: Math.max(0, Math.floor(Number(v.stock) || 0))
      }));

      if (variants.some((v: any) =>
        !Number.isFinite(v.pricePence) || v.pricePence < 0
      )) {
        return NextResponse.json(
          { error: "Please enter valid variant prices." },
          { status: 400 }
        );
      }

      const productData = {
        name: String(b.name).trim(),
        category: String(b.category || "").trim() || null,
        description: String(b.description || "").trim() || null,
        imageUrl: String(b.imageUrl || "").trim() || null,
        featured: b.featured === true
      };

      if (b.id) {
        const product = await prisma.$transaction(async tx => {
          await tx.product.update({
            where: { id: b.id },
            data: productData
          });

          await tx.productVariant.deleteMany({
            where: { productId: b.id }
          });

          return tx.product.update({
            where: { id: b.id },
            data: {
              variants: { create: variants }
            },
            include: { variants: true }
          });
        });

        return NextResponse.json(product);
      }

      const slug =
        String(b.name)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "") +
        "-" +
        Date.now().toString(36);

      const product = await prisma.product.create({
        data: {
          ...productData,
          slug,
          variants: { create: variants }
        },
        include: { variants: true }
      });

      return NextResponse.json(product, { status: 201 });
    }

    return NextResponse.json(
      { error: "Unknown action." },
      { status: 400 }
    );
  } catch (error) {
    console.error("ADMIN UPDATE ERROR:", error);
    return NextResponse.json(
      { error: "The request could not be completed." },
      { status: 500 }
    );
  }
}
