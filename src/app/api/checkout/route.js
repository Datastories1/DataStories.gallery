import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
//  FIXED IMPORT: Import dbConnect as a default module import
import dbConnect from "@/lib/mongodb"; 
import Template from "@/models/Template";

export async function POST(req) {
  try {
    const { templateId, customerEmail } = await req.json();

    if (!templateId) {
      return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
    }

    // 1. Connect to MongoDB using your actual function name
    await dbConnect();

    // 2. Fetch the template data directly from your database
    const template = await Template.findById(templateId);
    if (!template) {
      return NextResponse.json({ error: "Template not found in database" }, { status: 404 });
    }

    // 3. Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail || undefined, // Pre-fills if email is present, otherwise ignores safely
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              // Adjust to your exact schema field name (e.g., template.title or template.name)
              name: template.title || template.name, 
              description: template.subtitle || "Power BI Template Download",
              images: template.thumbnailImage ? [template.thumbnailImage] : [],
            },
            // Stripe counts in cents. $300 becomes 30000 cents.
            unit_amount: Math.round(template.price * 100), 
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      // CRITICAL: Pass the ID into metadata so your webhook can find it later!
      metadata: {
        dashboardId: template._id.toString(),
      },
      // Redirect paths back to your application website
      // Inside your stripe.checkout.sessions.create configuration:
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/template`,
    });

    // Return the secure checkout link back to your client component
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}