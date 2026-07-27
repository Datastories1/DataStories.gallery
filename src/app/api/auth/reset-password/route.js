import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
export const runtime = 'node.js';
export async function POST(req) {
  try {
    await dbConnect();
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: "Missing required verification data." }, { status: 400 });
    }

    console.log("Attempting to verify recovery token:", token);

    // 💡 BYPASS MONGOOSE SCHEMA BUG: Access the raw MongoDB collection directly
    const usersCollection = mongoose.connection.db.collection("users");

    // Match non-expired token directly in the database
    const user = await usersCollection.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() } // Checks if expiration date is greater than right now
    });

    if (!user) {
      console.log("Token verification failed: Token not found or has expired.");
      return NextResponse.json({ error: "This recovery link is invalid or has expired. Please request a new link." }, { status: 400 });
    }

    console.log("Token verified successfully for user:", user.email);

    // Hash and update user credentials
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the document directly and clear out the token fields
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: "", resetTokenExpires: "" } // Cleanly removes fields so link can't be reused
      }
    );

    console.log("Password updated successfully in MongoDB.");
    return NextResponse.json({ message: "Password updated successfully!" }, { status: 200 });
  } catch (err) {
    console.error("Reset confirmation error:", err);
    return NextResponse.json({ error: "Internal server error saving new password." }, { status: 500 });
  }
}