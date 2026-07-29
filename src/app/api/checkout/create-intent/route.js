import { NextResponse } from "next/server";
import { Stripe } from "stripe";

import connectDB from "@/lib/mongodb";
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
  
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  const rawBody = await req.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      await connectDB();

      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items.data.price"],
      });

      const customerEmail = fullSession.customer_details?.email || fullSession.customer_email;
      if (!customerEmail) throw new Error("Customer email not found in session");

      const dashboardId = fullSession.metadata?.dashboardId;
      
      const template = await Template.findById(dashboardId);
      
      if (!template) {
        throw new Error(`No template found in MongoDB for ID: ${dashboardId}`);
      }

      const downloadUrl = template.oneDriveLink;

      // Lazy load mailer to prevent top-level Resend evaluation during build data collection
      const { sendDeliveryEmail } = await import("@/lib/email");
      await sendDeliveryEmail({
        to: customerEmail,
        templateName: template.name,
        downloadUrl,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handling error:", err);
    return NextResponse.json({ received: true, warning: err.message });
  }
}