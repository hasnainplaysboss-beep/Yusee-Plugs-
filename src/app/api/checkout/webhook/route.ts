
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");

  if (!stripeKey || !webhookSecret || !signature) {
    return NextResponse.json(
      { error: "Stripe webhook configuration is missing." },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeKey);

  let event: Stripe.Event;

  try {
    const body = await req.text();

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error("STRIPE SIGNATURE ERROR:", error);

    return NextResponse.json(
      { error: "Invalid Stripe webhook signature." },
      { status: 400 }
    );
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true });
  }

  try {
    const eventSession = event.data.object as Stripe.Checkout.Session;

    const session = await stripe.checkout.sessions.retrieve(
      eventSession.id,
      {
        expand: ["line_items.data.price.product"]
      }
    );

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;

    if (!paymentIntentId) {
      throw new Error("Payment intent is missing.");
    }

    const lineItems = session.line_items?.data || [];

    if (lineItems.length === 0) {
      throw new Error("No checkout items were found.");
    }

    const purchasedItems = lineItems.map((item) => {
      const product = item.price?.product;

      if (!product || typeof product === "string" || product.deleted) {
        throw new Error("Could not read a purchased product.");
      }

      const variantId = product.metadata.variantId;
      const quantity = item.quantity || 0;

      if (!variantId || quantity < 1) {
        throw new Error("Invalid purchased variant.");
      }

      return { variantId, quantity };
    });

    const variantIds = purchasedItems.map((item) => item.variantId);

    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds }
      },
      include: {
        product: true
      }
    });

    if (variants.length !== new Set(variantIds).size) {
      throw new Error("A purchased variant could not be found.");
    }

    const address =
      session.shipping_details?.address ||
      session.customer_details?.address;

    if (!address?.line1 || !address.city || !address.postal_code) {
      throw new Error("Customer delivery address is incomplete.");
    }

    const customerName =
      session.shipping_details?.name ||
      session.customer_details?.name ||
      "Customer";

    const customerEmail =
      session.customer_details?.email ||
      session.customer_email;

    if (!customerEmail) {
      throw new Error("Customer email is missing.");
    }

    const orderItems = purchasedItems.map((item) => {
      const variant = variants.find(
        (v) => v.id === item.variantId
      );

      if (!variant) {
        throw new Error("Purchased variant not found.");
      }

      return {
        variant,
        quantity: item.quantity
      };
    });

    await prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: {
          stripePaymentIntentId: paymentIntentId
        }
      });

      if (existingOrder) {
        return;
      }

      for (const item of orderItems) {
        const updated = await tx.productVariant.updateMany({
          where: {
            id: item.variant.id,
            stock: { gte: item.quantity }
          },
          data: {
            stock: { decrement: item.quantity }
          }
        });

        if (updated.count !== 1) {
          throw new Error(
            `Insufficient stock for ${item.variant.product.name}.`
          );
        }
      }

      await tx.order.create({
        data: {
          orderNumber: `YP-${randomUUID().slice(0, 8).toUpperCase()}`,
          customerName,
          customerEmail,
          customerPhone: session.customer_details?.phone || null,
          addressLine1: address.line1,
          addressLine2: address.line2 || null,
          city: address.city,
          county: address.state || null,
          postcode: address.postal_code,
          country: address.country || "GB",
          subtotalPence: session.amount_subtotal || 0,
          shippingPence: session.shipping_cost?.amount_total || 0,
          totalPence: session.amount_total || 0,
          paymentStatus: "PAID",
          status: "PROCESSING",
          stripePaymentIntentId: paymentIntentId,
          items: {
            create: orderItems.map((item) => ({
              variantId: item.variant.id,
              productName: item.variant.product.name,
              size: item.variant.size,
              colour: item.variant.colour,
              quantity: item.quantity,
              unitPricePence: item.variant.pricePence
            }))
          }
        }
      });
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("STRIPE WEBHOOK ERROR:", error);

    return NextResponse.json(
      { error: "Could not process the paid order." },
      { status: 500 }
    );
  }
}
