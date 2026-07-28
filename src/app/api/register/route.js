import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

export const runtime = 'nodejs';

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("RESEND_API_KEY not configured");
  }
  return new Resend(apiKey);
}

// Define MongoDB User Schema structure cleanly
const UserSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  country: { type: String, required: true },
  organizationName: { type: String, default: "" }
}, { timestamps: true });

// Prevent mongoose model re-compilation error during Next.js hot reloads
const User = mongoose.models.User || mongoose.model("User", UserSchema);

// Safe database connection utility helper
async function connectToDatabase() {
  if (mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGODB_URI) {
    throw new Error("Missing MONGODB_URI environmental key identifier inside environment vars.");
  }
  await mongoose.connect(process.env.MONGODB_URI);
}

export async function POST(req) {
  let resend;
  try {
    resend = getResend();
  } catch (err) {
    console.error("Resend Configuration Error:", err.message);
  }

  try {
    const body = await req.json();
    
    // 🌟 FIX: Support variations in frontend variable structures seamlessly
    // Extracts whatever values the frontend sends over to avoid "undefined" strings
    const email = body.email || body.emailAddress;
    const userName = body.userName || body.fullName;
    const password = body.password;
    const phoneNumber = body.phoneNumber;
    const country = body.country;
    const organizationName = body.organizationName || body.organizationNameOptional;

    // Strict validation check to ensure mandatory items exist before saving to MongoDB
    if (!userName || !email || !password || !phoneNumber || !country) {
      return NextResponse.json(
        { message: "All required input parameters (Name, Email, Password, Phone, Country) must be supplied." }, 
        { status: 400 }
      );
    }

    await connectToDatabase();
    const normalizedEmail = email.trim().toLowerCase();

    // Verification check: Make sure account doesn't already exist
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { message: "An account with this email address already exists in the system." }, 
        { status: 422 }
      );
    }

    // Encrypt password using secure salted bcrypt hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save record securely inside MongoDB
    const newUser = await User.create({
      userName: userName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phoneNumber: phoneNumber.trim(),
      country: country.trim(),
      organizationName: organizationName ? organizationName.trim() : ""
    });

    // 📬 TRANSMISSION: Send automated dynamic welcome letter email
    if (resend) {
      try {
        console.log(`Attempting to send dynamic welcome email directly to form input: ${newUser.email}`);
        
        await resend.emails.send({
          from: "Data Stories <onboarding@resend.dev>",
          to: newUser.email, // 🌟 DYNAMIC DELIVERY: Sends straight to your newly registered account email
          subject: "Thank you for signing up with Data Stories!",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; color: #334155;">
              <h2 style="color: #1E3A5F; margin-top: 0; margin-bottom: 6px; font-size: 22px;">Welcome to Data Stories!</h2>
              <p style="font-size: 14px; line-height: 1.5; color: #475569;">Hi <strong>${newUser.userName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.5; color: #475569;">Thank you for signing up with us! Your account registration profile workspace configuration deployment has completed successfully.</p>
              
              <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                <h3 style="margin: 0 0 10px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">Your Workspace Account Details:</h3>
                <p style="margin: 4px 0; font-size: 13.5px; color: #1e293b;"><strong>Account Name:</strong> ${newUser.userName}</p>
                <p style="margin: 4px 0; font-size: 13.5px; color: #1e293b;"><strong>Registered Email:</strong> ${newUser.email}</p>
                <p style="margin: 4px 0; font-size: 13.5px; color: #1e293b;"><strong>Country/Region:</strong> ${newUser.country}</p>
                ${newUser.organizationName ? `<p style="margin: 4px 0; font-size: 13.5px; color: #1e293b;"><strong>Organization Name:</strong> ${newUser.organizationName}</p>` : ""}
              </div>
              
              <p style="font-size: 14px; line-height: 1.5; color: #475569;">You can now access your interactive workspace profile tools to create and manage visualizations dashboard metrics.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Data Stories Inc. &copy; 2026</p>
            </div>
          `
        });
        console.log("Welcome delivery payload successfully transferred to Resend service network queues!");
      } catch (emailError) {
        // Prevents email sending errors from crashing the user signup confirmation screen
        console.error("Resend delivery service warning encounter:", emailError.message);
      }
    } else {
      console.warn("Resend skipped: API key not provided.");
    }

    return NextResponse.json(
      { message: "User account created successfully inside database architecture.", userId: newUser._id }, 
      { status: 201 }
    );

  } catch (error) {
    console.error("CRITICAL REGISTER ENDPOINT SYSTEM CRASH:", error);
    return NextResponse.json(
      { message: "Internal server error occurred.", error: error.message }, 
      { status: 500 }
    );
  }
}