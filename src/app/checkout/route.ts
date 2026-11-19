
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Stripe is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Your basket is empty." },
        { status: 400 }
      );
    }

    // Combine duplicate variants
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

    let subtotal = 0;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      variants.map((variant) => {
        const quantity = quantities.get(variant.id)!;

        if (variant.stock < quantity) {
          throw new Error(
            `${variant.product.name} does not have enough stock.`
          );
        }

        subtotal += variant.pricePence * quantity;

        const options = [
          variant.size ? `Size: ${variant.size}` : null,
          variant.colour ? `Colour: ${variant.colour}` : null
        ].filter(Boolean);

        return {
          quantity,
          price_data: {
            currency: "gbp",
            unit_amount: variant.pricePence,
            product_data: {
              name: variant.product.name,
              description: options.join(" / ") || undefined,
              metadata: {
                variantId: variant.id
              }
            }
          }
        };
      });

    const shippingOption: Stripe.Checkout.SessionCreateParams.ShippingOption =
      subtotal >= 10000
        ? {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: {
                amount: 0,
                currency: "gbp"
              },
              display_name: "Free UK delivery"
            }
          }
        : {
            shipping_rate_data: {
              type: "fixed_amount",
              fixed_amount: {
                amount: 499,
                currency: "gbp"
              },
              display_name: "UK delivery"
            }
          };

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(req.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      billing_address_collection: "required",
      shipping_address_collection: {
        allowed_countries: ["GB"]
      },
      phone_number_collection: {
        enabled: true
      },
      shipping_options: [shippingOption],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/?checkout=cancelled`,
      metadata: {
        store: "yusee-plugs"
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
