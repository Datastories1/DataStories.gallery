export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Template from "@/models/Template";
import Stripe from "stripe";

export const runtime = 'nodejs';

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY || "sk_test_dummy_fallback_key_for_build";
  return new Stripe(secretKey, { httpClient: Stripe.createFetchHttpClient() });
}

export async function GET(req) {
  let stripe;
  try {
    stripe = getStripe();
  } catch (err) {
    return NextResponse.json({ error: "Server configuration error: Stripe initialization failed." }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id parameter" }, { status: 400 });
    }

    // 1. Fetch transaction metadata from Stripe securely
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "This session has not been verified as paid." }, { status: 400 });
    }

    const dashboardId = session.metadata?.dashboardId;

    // 2. Establish MongoDB Connection
    await dbConnect();
    
    // Using .lean() fetches a plain JavaScript object, bypassing Mongoose filtering altogether!
    const template = await Template.findById(dashboardId).lean();

    if (!template) {
      return NextResponse.json({ error: "Dashboard item not found in database records." }, { status: 404 });
    }

    // 3. SECURE VERIFICATION LOG: See exactly what MongoDB returned in your terminal window
    console.log("Database lookup successful! Document structure retrieved:", template);

    // 4. Extract link using a case-insensitive fallback logic
    const finalDownloadUrl = template.link || template.Link || "";

    // 5. Send fields cleanly back to the client UI
    return NextResponse.json({
      templateName: template.title || template.name,
      downloadUrl: finalDownloadUrl, // Now guaranteed to capture either 'link' or 'Link'!
    });
  } catch (err) {
    console.error("Verification endpoint crashed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}