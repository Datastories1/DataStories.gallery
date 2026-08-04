import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb"; // Using centralized connection utility
import mongoose from "mongoose";
export const runtime = 'nodejs';

import { generateAndEmailDownloadLink } from "../../../../lib/downloadMailer";
import { sendWelcomeAccountEmail } from "../../../../lib/accountMailer";

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      isLoggedIn, 
      userName, 
      email, 
      password, 
      phoneNumber, 
      country, 
      organizationName, 
      cartItems 
    } = body;

    if (!email || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ message: "Incomplete order data payload context." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 1️⃣ Connect to MongoDB through mongoose connection utility to prevent timeout exceptions
    await dbConnect();
    const db = mongoose.connection.db;
    // Use mongoose's own ObjectId (mongoose.mongo.ObjectId), NOT the top-level "mongodb"
    // package's ObjectId. mongoose.connection.db is driven by mongoose's internal mongodb/bson
    // version, and its wire serializer rejects ObjectId instances built from a different bson
    // version (BSONVersionError). mongoose.mongo.ObjectId is guaranteed to match.
    const ObjectId = mongoose.mongo.ObjectId;

    // 🔍 Secure Item Verification: Double check IDs exist in the database
    const rawTemplateIds = cartItems.map(item => {
      const rawId = item.templateId || item._id;
      if (rawId && typeof rawId === "object" && rawId.$oid) return String(rawId.$oid);
      return String(rawId);
    }).filter(id => id && id !== "undefined" && id !== "null");

    const queryIds = rawTemplateIds.map(id => ObjectId.isValid(id) ? new ObjectId(id) : id);
    
    const verifiedTemplates = await db.collection("templates").find({
      $or: [
        { _id: { $in: queryIds } },
        { _id: { $in: rawTemplateIds } }
      ]
    }).toArray();

    const templateIds = verifiedTemplates.map(t => String(t._id));

    if (templateIds.length === 0) {
      console.error("❌ Critical: Mailer skipped. Absolutely no template documents could be resolved for this buyer in MongoDB matching: ", rawTemplateIds);
      return NextResponse.json({ 
        message: "Order received but requested template IDs could not be resolved inside your collection database records." 
      }, { status: 404 });
    }

    // 2️⃣ Account Handling for New Users
    if (!isLoggedIn) {
      const existingUser = await db.collection("users").findOne({ email: cleanEmail });
      
      if (existingUser) {
        return NextResponse.json({ 
          error: "CONFLICT_ACCOUNT_EXISTS", 
          message: "Account already exists under this email." 
        }, { status: 409 });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const newUserDoc = {
        userName: userName || "Valued Customer",
        name: userName || "Valued Customer",
        email: cleanEmail,
        password: hashedPassword,
        phoneNumber: phoneNumber || "Not Provided",
        country: country || "Jordan",
        organizationName: organizationName || "",
        organization: organizationName || "",
        createdAt: new Date(),
        role: "user"
      };

      await db.collection("users").insertOne(newUserDoc);
      console.log(`👤 New user profile registered successfully via process-order: ${cleanEmail}`);
    }

    // 3️⃣ FIRE BOTH EMAILS IN PARALLEL
    const emailPromises = [];

    if (typeof generateAndEmailDownloadLink === "function") {
      emailPromises.push(
        generateAndEmailDownloadLink(cleanEmail, templateIds)
          .then(() => console.log("✉️ [Parallel] Download email sent successfully."))
      );
    } else {
      console.error("❌ generateAndEmailDownloadLink is not a recognized function. Check your lib file.");
    }

    if (!isLoggedIn && typeof sendWelcomeAccountEmail === "function") {
      emailPromises.push(
        sendWelcomeAccountEmail(cleanEmail, userName || "Valued Customer")
          .then(() => console.log("✉️ [Parallel] Welcome email sent successfully."))
      );
    }

    if (emailPromises.length > 0) {
      const results = await Promise.allSettled(emailPromises);
      results.forEach((result, idx) => {
        if (result.status === "rejected") {
          console.error(`❌ Email Task #${idx + 1} failed execution error:`, result.reason);
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Order processed, secure emails dispatched concurrently." 
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Checkout Processing Exception:", error);
    return NextResponse.json({ message: error.message || "Internal server error." }, { status: 500 });
  }
}