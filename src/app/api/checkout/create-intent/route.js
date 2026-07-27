import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import dbConnect from "@/lib/mongodb";
import Template from "@/models/Template";
export const runtime = 'edge';
export async function POST(req) {
  try {
    const { items, customerEmail } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart items are required" }, { status: 400 });
    }

    await dbConnect();

    const templateIds = items.map(item => {
      if (!item) return null;
      if (typeof item === 'object') {
        return item._id?.$oid ? item._id.$oid : String(item._id);
      }
      return String(item);
    }).filter(Boolean);

    const templates = await Template.find({ _id: { $in: templateIds } });

    if (!templates || templates.length === 0) {
      return NextResponse.json({ error: "No templates found in database" }, { status: 404 });
    }

    const grandTotalCents = templates.reduce((acc, template) => {
      const itemPrice = template.price || 0;
      return acc + Math.round(itemPrice * 100);
    }, 0);

    if (grandTotalCents <= 0) {
      return NextResponse.json({ error: "Invalid order amount total calculated" }, { status: 400 });
    }

    const firstTemplateId = String(templateIds[0]);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: grandTotalCents,
      currency: "usd",
      receipt_email: customerEmail || undefined,
      payment_method_types: ["card"],
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