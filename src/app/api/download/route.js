export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
export const runtime = 'nodejs';
const templateStructure = new mongoose.Schema({
  title: String,
  Link: String 
}, { strict: false });

const TemplateModel = mongoose.models.Template || mongoose.model("Template", templateStructure);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return new NextResponse("Security verification download token is missing.", { status: 400 });
    }

    // 1. Verify and decode the JWT payload
    let decodedPayload;
    try {
      const secretKey = process.env.JWT_SECRET || "JWT_SECRET_PASSPHRASE_KEY";
      decodedPayload = jwt.verify(token, secretKey);
    } catch (jwtError) {
      console.error("❌ JWT Validation Failure:", jwtError.message);
      return new NextResponse("Your download window link has expired or is invalid.", { status: 401 });
    }

    const { templateId } = decodedPayload;
    if (!templateId) {
      return new NextResponse("Invalid security payload structure.", { status: 400 });
    }

    // 2. Connect to MongoDB
    if (mongoose.connection.readyState !== 1) {
      if (!process.env.MONGODB_URI) {
        throw new Error("Missing MONGODB_URI connection string.");
      }
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 3. Search database
    const targetQueryId = mongoose.Types.ObjectId.isValid(templateId) 
      ? new mongoose.Types.ObjectId(templateId) 
      : templateId;

    const template = await TemplateModel.findOne({
      $or: [
        { _id: targetQueryId },
        { _id: String(templateId) }
      ]
    });

    const databaseFileLink = template ? (template.Link || template.link) : null;

    if (!template || !databaseFileLink) {
      return new NextResponse("The requested template asset profile could not be found in the database.", { status: 404 });
    }

    // 4. FIX: Target the storage folder nested inside your src directory!
    const parsedFileName = path.basename(databaseFileLink); 
    const filePath = path.join(process.cwd(), "src", "storage", parsedFileName);

    console.log(`📂 Attempting to read file from: ${filePath}`);

    // 5. Verify the archive file is on your disk
    if (!fs.existsSync(filePath)) {
      return new NextResponse(
        `FILE SYSTEM ERROR:\nThe database record exists, but the physical file "${parsedFileName}" is missing from your src/storage folder.\n\nExpected Path: ${filePath}`,
        { status: 404 }
      );
    }

    // 6. Direct Binary Streaming Download Response
    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${parsedFileName}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });

  } catch (error) {
    console.error("❌ Critical Error inside Download Route:", error);
    return new NextResponse("Internal Server Error processing secure asset download.", { status: 500 });
  }
}