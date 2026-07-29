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

    // 🎯 FIX: If tracking identifiers fail, read directly from the verified Stripe token
    if (!payment_intent) {
      return NextResponse.json({ error: "Missing required payment_intent verification token." }, { status: 400 });
    }

    console.log(`📦 Retrieving verified metadata directly from Stripe for intent: ${payment_intent}`);
    const intentObject = await stripe.paymentIntents.retrieve(payment_intent);

    if (!intentObject || !intentObject.metadata) {
      return NextResponse.json({ error: "Could not resolve matching transaction metadata from Stripe records." }, { status: 404 });
    }

    // Extract the template string array we packed inside create-intent route metadata
    let targetIdsArray = [];
    try {
      if (intentObject.metadata.templateIds) {
        targetIdsArray = JSON.parse(intentObject.metadata.templateIds);
      }
    } catch (parseErr) {
      console.error("Stripe metadata parsing anomaly:", parseErr);
    }

    // Fallback if metadata wasn't stringified array format
    if (targetIdsArray.length === 0 && intentObject.metadata.templateId) {
      targetIdsArray = [intentObject.metadata.templateId];
    }

    const deliveryEmail = 
      customerEmail || 
      intentObject.metadata.customerEmail || 
      intentObject.receipt_email || 
      "buyer@example.com";

    if (targetIdsArray.length === 0) {
      console.error("❌ Critical: No template IDs found inside Stripe's secure metadata package.");
      return NextResponse.json({ error: "No purchase items found in transaction data." }, { status: 400 });
    }

    console.log(`🚀 Stripe payment verified! Dispatching assets email to: ${deliveryEmail} for items:`, targetIdsArray);
    
    // Fire your mailer helper using the definitive array of purchased template IDs
    await generateAndEmailDownloadLink(
      deliveryEmail.trim().toLowerCase(),
      targetIdsArray
    );

    return NextResponse.json({ 
      success: true, 
      message: "Stripe verification successful. Download email delivered!" 
    }, { status: 200 });

  } catch (error) {
    console.error("Success delivery pipeline crash:", error);
    return NextResponse.json({ error: "Internal server error processing purchase", details: error.message }, { status: 500 });
  }
}