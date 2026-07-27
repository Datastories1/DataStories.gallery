import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import { generateAndEmailDownloadLink } from "@/lib/downloadMailer";
export const runtime = 'edge';
export async function POST(req) {
  try {
    const { userName, email, password, phoneNumber, country, organizationName } = await req.json();

    if (!email || !password || !userName) {
      return NextResponse.json(
        { message: "Missing required profile credentials or setup parameters." },
        { status: 400 }
      );
    }

    // 1️⃣ Connect to Database
    const connection = await connectDB();
    
    // 2️⃣ Safely extract the db instance
    let db;
    if (connection && typeof connection.db === "function") {
      db = connection.db();
    } else if (connection && connection.db) {
      db = connection.db;
    } else {
      db = connection; 
    }

    if (!db || typeof db.collection !== "function") {
      throw new Error("Database connected, but collection pointer method is unavailable.");
    }

    // 3️⃣ Duplicate Account Check
    const existingUser = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "CONFLICT_ACCOUNT_EXISTS", message: "This email address is already registered." },
        { status: 409 }
      );
    }

    // 4️⃣ Hash Password & Save User
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUserDoc = {
      name: userName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phoneNumber: phoneNumber || "",
      country: country || "Jordan",
      organization: organizationName || "",
      createdAt: new Date(),
      role: "user"
    };

    await db.collection("users").insertOne(newUserDoc);

    // 5️⃣ Dispatch Purchase Confirmation Email
    try {
      if (typeof generateAndEmailDownloadLink === "function") {
        await generateAndEmailDownloadLink({
          email: email.toLowerCase(),
          name: userName
        });
        console.log(`✉️ Direct mail distribution successfully dispatched to: ${email.toLowerCase()}`);
      } else {
        console.warn("⚠️ Warning: generateAndEmailDownloadLink function is not available.");
      }
    } catch (mailError) {
      console.error("❌ Critical: Mail transmission module failure inside route handler:", mailError);
    }

    return NextResponse.json(
      { message: "Workspace user account compiled successfully." },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Core Registration Process System Exception:", error);
    return NextResponse.json(
      { message: error.message || "An unexpected processing error occurred on the internal server layers." },
      { status: 500 }
    );
  }
}