import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb"; // 💡 Connects your database cleanly
import mongoose from "mongoose";
import crypto from "crypto";
export const runtime = 'edge';
// Ensure Schema definitions are registered cleanly for MongoDB
const UserSchema = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetToken: { type: String },
  resetTokenExpires: { type: Date }
}, { collection: 'users' }));

export async function POST(req) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email address is required." }, { status: 400 });
    }

    // Lookup user profile matching entry
    const user = await mongoose.models.User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "This email address is not registered in our system." }, { status: 400 });
    }

    // Generate secure randomized reset token
    const token = crypto.randomBytes(32).toString("hex");

    // 💡 BYPASS MONGOOSE CACHING BUG: Write the token directly to the raw MongoDB collection
    await mongoose.connection.db.collection("users").updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken: token,
          resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 Hour lifespan
        }
      }
    );

    // Generate link url depending on running environment
    const origin = req.headers.get("origin") || "http://localhost:3000";
    const resetLink = `${origin}/reset-password?token=${token}`;

    // 💡 DIRECT HARDCODED KEY FALLBACKS (Bypasses any Windows env caching issues)
    const SERVICE_ID = process.env.EMAILJS_SERVICE_ID || "service_izldwlo";
    const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID || "template_zl9zlg9";
    const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY || "y9dAzHSQYIldcLgA-";
    const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || "PYmCtHowm2JIXQR1GSDZC";

    console.log("Recipient Verification - Database Email:", user.email, " | Form Input Email:", email);

    // Send the email using the EmailJS REST API
    const emailJsResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: SERVICE_ID,
        template_id: TEMPLATE_ID,
        user_id: PUBLIC_KEY,
        accessToken: PRIVATE_KEY,
        template_params: {
          to_email: user.email || email.toLowerCase().trim(),
          // 💡 Dynamic Name Fallback: If user.name is empty or missing, extract the username handle from email
          user_name: user.name && user.name.trim() ? user.name : (email ? email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1) : "Valued User"),
          reset_link: resetLink,
        },
      }),
    });

    if (!emailJsResponse.ok) {
      const errText = await emailJsResponse.text();
      console.error("EmailJS API Error Response:", errText);
      return NextResponse.json({ error: "Email delivery provider failed to dispatch message." }, { status: 500 });
    }

    return NextResponse.json({ message: "Reset link sent successfully!" }, { status: 200 });
  } catch (err) {
    console.error("Forgot password system error:", err);
    return NextResponse.json({ error: "Internal server error processing request." }, { status: 500 });
  }
}