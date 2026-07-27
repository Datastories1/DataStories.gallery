import { NextResponse } from "next/server";
import { Stripe } from "stripe";

import { sendDeliveryEmail } from "@/lib/email";
import { getDownloadUrl } from "@/lib/delivery";
import connectDB from "@/lib/mongodb";
import Template from "@/models/Template";

export const runtime = 'nodejs';

export async function POST(req) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_fallback_key_for_build");
  
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