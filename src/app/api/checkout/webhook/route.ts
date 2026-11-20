
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeKey);

    const body = await req.json();
    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Your basket is empty." },
        { status: 400 }
      );
    }

    const quantities = new Map<string, number>();

    for (const item of items) {
      const variantId = String(item.variantId || "");
      const quantity = Number(item.quantity);

      if (
        !variantId ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 20
      ) {
        return NextResponse.json(
          { error: "Invalid basket item." },
          { status: 400 }
        );
      }

      quantities.set(
        variantId,
        (quantities.get(variantId) || 0) + quantity
      );
    }

    const variants = await prisma.productVariant.findMany({
      where: {
        id: { in: [...quantities.keys()] },
        product: { active: true }
      },
      include: { product: true }
    });

    if (variants.length !== quantities.size) {
      return NextResponse.json(
        { error: "One or more products are unavailable." },
        { status: 400 }
      );
    }

    // Determine the delivery destination from the selected variants.
    // Older variants without a delivery value default to UK.
    const deliveries = new Set(
      variants.map((variant) =>
        String(variant.delivery || "UK").trim().toLowerCase()
      )
    );

    if (deliveries.size !== 1) {
      return NextResponse.json(
        {
          error:
            "Your basket cannot mix UK and China delivery variants. Please use one delivery option per basket."
        },
        { status: 400 }
      );
    }

    const delivery = [...deliveries][0];

    let shippingCountry: "GB" | "CN";
    let deliveryName: string;

    if (delivery === "uk" || delivery === "gb") {
      shippingCountry = "GB";
      deliveryName = "UK";
    } else if (delivery === "china" || delivery === "cn") {
      shippingCountry = "CN";
      deliveryName = "China";
    } else {
      return NextResponse.json(
        { error: "Invalid delivery option." },
        { status: 400 }
      );
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      variants.map((variant) => {
        const quantity = quantities.get(variant.id)!;

        if (variant.stock < quantity) {
          throw new Error(
            `${variant.product.name} does not have enough stock.`
          );
        }

        const options = [
          variant.size ? `Size: ${variant.size}` : null,
          variant.colour ? `Colour: ${variant.colour}` : null,
          `Delivery: ${deliveryName}`
        ].filter(Boolean);

        return {
          quantity,
          price_data: {
            currency: "gbp",
            unit_amount: variant.pricePence,
            product_data: {
              name: variant.product.name,
              description: options.join(" / "),
              metadata: {
                variantId: variant.id,
                delivery: deliveryName
              }
            }
          }
        };
      });

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: [shippingCountry]
      },
      phone_number_collection: {
        enabled: true
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      metadata: {
        store: "yusee-plugs",
        delivery: deliveryName
      }
    });

    return NextResponse.json({
      url: session.url
    });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not start checkout."
      },
      { status: 500 }
    );
  }
}
