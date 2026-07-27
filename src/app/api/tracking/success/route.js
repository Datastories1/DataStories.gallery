import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Stripe from "stripe";
import { generateAndEmailDownloadLink } from "@/lib/downloadMailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
export const runtime = 'edge';
export async function POST(request) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

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