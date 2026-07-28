import { NextResponse } from "next/server";
import { Stripe } from "stripe";
import connectDB from "@/lib/mongodb";
import Template from "@/models/Template";

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey || secretKey.trim() === "") {
      return NextResponse.json({ error: "Server configuration error: STRIPE_SECRET_KEY is missing." }, { status: 500 });
    }

    const stripe = new Stripe(secretKey);
    const body = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items provided for checkout." }, { status: 400 });
    }

    await connectDB();

    let calculatedAmount = 0;
    for (const item of items) {
      const template = await Template.findById(item.id || item._id);
      if (template && template.price) {
        calculatedAmount += Number(template.price) * 100 * (item.quantity || 1);
      }
    }

    if (calculatedAmount <= 0) {
      return NextResponse.json({ error: "Invalid calculated total amount." }, { status: 400 });
    }

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(calculatedAmount),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        items: JSON.stringify(items.map(i => ({ id: i.id || i._id, quantity: i.quantity || 1 })))
      }
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret }, { status: 200 });
  } catch (err) {
    console.error("Create intent error:", err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}