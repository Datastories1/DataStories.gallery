import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { templates } from "@/lib/templates";
import { sendDeliveryEmail } from "@/lib/email";
import { getDownloadUrl } from "@/lib/delivery";

export const runtime = "nodejs"; // needed for some Stripe/GCS setups

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });

  const rawBody = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;

      // Retrieve full session with line items to identify purchased Price ID
      const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
        expand: ["line_items.data.price"],
      });

      const customerEmail =
        fullSession.customer_details?.email || fullSession.customer_email;

      if (!customerEmail) throw new Error("Customer email not found in session");

      const priceId = fullSession.line_items?.data?.[0]?.price?.id;
      if (!priceId) throw new Error("Price ID not found in line items");

      const template = templates.find((t) => t.stripePriceId === priceId);
      if (!template) throw new Error(`No template mapped to priceId: ${priceId}`);

      const { downloadUrl } = await getDownloadUrl(template.id);

      await sendDeliveryEmail({
        to: customerEmail,
        templateName: template.name,
        downloadUrl,
      });
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    // IMPORTANT: Stripe may retry on non-2xx.
    // Returning 200 avoids repeated emails if something non-critical fails.
    console.error("Webhook handling error:", err);
    return NextResponse.json({ received: true, warning: err.message });
  }
}
