import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Ensure User schema is registered with Mongoose
const UserSchema = mongoose.models.User || mongoose.model("User", new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String }
}, { collection: 'users' }));

export async function POST(req) {
  try {
    await dbConnect();
    const { name, email, password, phone } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await mongoose.models.User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    // Encrypt password securely using bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save user to your MongoDB cluster
    await mongoose.models.User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone || ""
    });

    return NextResponse.json({ message: "Registration successful!" }, { status: 201 });
  } catch (err) {
    console.error("Signup backend error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}