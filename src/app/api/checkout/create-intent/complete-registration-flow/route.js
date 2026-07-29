import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import { sendWelcomeAccountEmail } from "@/lib/accountMailer";
import { sendDownloadEmail } from '@/lib/downloadMailer';

export const runtime = 'nodejs';

const baseUserStructure = new mongoose.Schema({
  userName: { type: String, required: true },
  name: { type: String }, 
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true }, 
  country: { type: String, required: true },    
  organizationName: { type: String, default: "" },
  organization: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
}, { collection: "users" });

const UserSchema = mongoose.models.User || mongoose.model("User", baseUserStructure);

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();

    const userName = body.userName || "Valued Customer";
    const email = body.email;
    const password = body.password;
    const organizationName = body.organizationName || "";
    const items = body.items || [];
    const sessionTrackerId = body.sessionTrackerId;
    
    const phoneNumber = body.phoneNumber || body.phone || "Not Provided"; 
    const country = body.country || body.countryOrRegion || "Jordan";

    console.log("Processing Unified Flow -> Email:", email, " | items count:", items.length);

    if (!email || !password) {
      return NextResponse.json({ error: "Missing account parameter data." }, { status: 400 });
    }

    const exactUserExists = await UserSchema.findOne({ email: email.toLowerCase().trim() });
    if (exactUserExists) {
      return NextResponse.json(
        { error: "CONFLICT_ACCOUNT_EXISTS", message: "Account already exists with this email address." }, 
        { status: 400 }
      );
    }

    const encryptedPassword = await bcrypt.hash(password, 10);
    const freshUserObject = await UserSchema.create({
      userName: userName,
      name: userName,
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber, 
      country: country,        
      organizationName: organizationName,
      organization: organizationName,
      password: encryptedPassword
    });

    if (sessionTrackerId) {
      try {
        await fetch(`${req.nextUrl.origin}/api/tracking`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionTrackerId,
            status: "sold",
            items: items
          })
        });
      } catch (trackErr) {
        console.error("Backend funnel analytics sync bypass:", trackErr);
      }
    }

    try {
      await sendWelcomeAccountEmail(freshUserObject.email, userName);
    } catch (mailErr) {
      console.error("Welcome email delivery issue:", mailErr);
    }

    try {
      if (typeof sendDownloadEmail === "function") {
        await sendDownloadEmail(freshUserObject.email, items);
      } else {
        await fetch(`${req.nextUrl.origin}/api/emails/send-purchase-confirmation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: freshUserObject.email, items: items })
        });
      }
    } catch (purchaseMailErr) {
      console.error("Purchase email delivery issue:", purchaseMailErr);
    }

    return NextResponse.json({ success: true, email: freshUserObject.email }, { status: 201 });
  } catch (error) {
    console.error("Unified Registration & Checkout Processing Script Failure:", error);
    return NextResponse.json({ error: "Pipeline validation fail: " + error.message }, { status: 500 });
  }
}