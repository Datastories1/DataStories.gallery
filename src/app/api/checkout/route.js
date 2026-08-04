import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import dbConnect from "@/lib/mongodb"; 
import Template from "@/models/Template";

export const runtime = 'nodejs';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.trim() === "") {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() });
}

export async function POST(req) {
  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json({ error: "Server configuration error: STRIPE_SECRET_KEY is missing." }, { status: 500 });
  }

  try {
    const { items, customerEmail } = await req.json();

    // 1. Ensure cart items are provided properly
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart items are required" }, { status: 400 });
    }

    // 2. Safely connect to your MongoDB Cluster using the shared utility
    await dbConnect();

    // 3. Extract and parse standard IDs or MongoDB Object IDs from your cart
    const templateIds = items.map(item => {
      if (!item) return null;
      if (typeof item === 'object') {
        return item._id?.$oid ? item._id.$oid : String(item._id);
      }
      return String(item);
    }).filter(Boolean);

    // 4. Look up templates from your DB to calculate total amount securely
    const templates = await Template.find({ _id: { $in: templateIds } });

    if (!templates || templates.length === 0) {
      return NextResponse.json({ error: "No templates found in database" }, { status: 404 });
    }

    // Calculate absolute pricing based entirely on verified database entries
    const grandTotalCents = templates.reduce((acc, template) => {
      const itemPrice = template.price || 0;
      return acc + Math.round(itemPrice * 100);
    }, 0);

    // Guard constraint to avoid Stripe breaking on zero-value orders
    if (grandTotalCents <= 0) {
      return NextResponse.json({ error: "Invalid order amount total calculated" }, { status: 400 });
    }

    const firstTemplateId = String(templateIds[0]);

    // 5. Build payment intent using automatic payment methods to support Apple Pay, Google Pay, and Cards
    const paymentIntent = await stripe.paymentIntents.create({
      amount: grandTotalCents,
      currency: "usd",
      receipt_email: customerEmail || undefined,
      automatic_payment_methods: { enabled: true },
      metadata: {
        templateId: firstTemplateId,
        dashboardId: firstTemplateId,
        dashboardIds: JSON.stringify(templateIds), 
        purchase_timestamp: String(Date.now()),
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });

  } catch (err) {
    console.error("Payment Intent Terminal Error:", err);
    return NextResponse.json({ error: err.message || "Failed to establish terminal engine parameters" }, { status: 500 });
  }
}