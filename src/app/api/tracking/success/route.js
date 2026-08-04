import { NextResponse } from "next/server";
import Stripe from "stripe";
import dbConnect from "@/lib/mongodb";
import { generateAndEmailDownloadLink } from "@/lib/downloadMailer";

export const runtime = 'nodejs';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_fallback_key_for_build";
  return new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() });
}

export async function POST(request) {
  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json({ error: "Server configuration error: Stripe initialization failed." }, { status: 500 });
  }

  try {
    await dbConnect();

    const body = await request.json();
    const { payment_intent, customerEmail } = body;

    if (!payment_intent) {
      return NextResponse.json({ error: "Missing required payment_intent verification token." }, { status: 400 });
    }

    let targetIdsArray = [];
    let deliveryEmail = customerEmail || "buyer@datastories.gallery";

    // If it's a real Stripe payment intent ID, query Stripe securely
    if (payment_intent.startsWith("pi_")) {
      try {
        console.log(`📦 Retrieving verified metadata directly from Stripe for intent: ${payment_intent}`);
        const intentObject = await stripe.paymentIntents.retrieve(payment_intent);

        if (intentObject && intentObject.metadata) {
          // NOTE: /api/checkout writes the full list under "dashboardIds" (see paymentIntents.create
          // metadata). We check that key first, then fall back to "templateIds" in case an older/
          // different checkout path used that name, so neither naming breaks this route.
          const rawIdsJson = intentObject.metadata.dashboardIds || intentObject.metadata.templateIds;

          if (rawIdsJson) {
            try {
              const parsed = JSON.parse(rawIdsJson);
              if (Array.isArray(parsed)) targetIdsArray = parsed;
            } catch (parseErr) {
              console.error("Stripe metadata parsing anomaly:", parseErr);
            }
          }

          // Only fall back to a single ID if we truly got nothing above
          if (targetIdsArray.length === 0) {
            const singleId = intentObject.metadata.dashboardId || intentObject.metadata.templateId;
            if (singleId) targetIdsArray = [singleId];
          }

          deliveryEmail =
            customerEmail ||
            intentObject.metadata.customerEmail ||
            intentObject.receipt_email ||
            deliveryEmail;
        }
      } catch (stripeErr) {
        console.warn("⚠️ Non-critical Stripe retrieval issue (falling back gracefully):", stripeErr.message);
      }
    }

    // Fallback if no IDs were retrieved from Stripe metadata (e.g. local session string passed instead)
    if (targetIdsArray.length === 0) {
      console.log("ℹ️ Using fallback local handling for tracking token validation.");
    }

    // Only dispatch email if we have valid template targets
    if (targetIdsArray.length > 0) {
      console.log(`🚀 Dispatching assets email to: ${deliveryEmail} for items:`, targetIdsArray);
      await generateAndEmailDownloadLink(
        deliveryEmail.trim().toLowerCase(),
        targetIdsArray
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tracking verification processed successfully.",
      resolvedItemCount: targetIdsArray.length
    }, { status: 200 });

  } catch (error) {
    console.error("Success delivery pipeline crash:", error);
    return NextResponse.json({ error: "Internal server error processing purchase", details: error.message }, { status: 500 });
  }
}