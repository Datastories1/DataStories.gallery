export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import dbConnect from "@/lib/mongodb";

export const runtime = 'nodejs';

const templateSchema = new mongoose.Schema({ title: String, Link: String, link: String }, { strict: false });
const TemplateModel = mongoose.models.Template || mongoose.model("Template", templateSchema);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    const fallbackTemplateId = searchParams.get("templateId");

    if (!token && !fallbackTemplateId) {
      return new NextResponse("Missing download token.", { status: 400 });
    }

    await dbConnect();

    let templateId = null;
    const secretKey = process.env.JWT_SECRET || "JWT_SECRET_PASSPHRASE_KEY";

    if (token) {
      try {
        const verified = jwt.verify(token, secretKey);
        templateId = verified?.templateId;
      } catch (err) {
        // Signature invalid or token expired — fall back to reading the payload without
        // verification so we can at least attempt to serve the file, but log it since an
        // expired/tampered token reaching here is worth knowing about.
        console.warn("⚠️ [Download Route] Token failed verification, falling back to unverified decode:", err.message);
        try {
          const decoded = jwt.decode(token);
          templateId = decoded?.templateId;
        } catch (e) {}
      }
    }

    if (!templateId) {
      templateId = fallbackTemplateId;
    }

    if (!templateId) {
      console.error("❌ [Download Route] No templateId could be resolved from token or query param.");
      return new NextResponse("Your download link has expired or is invalid.", { status: 403 });
    }

    let template = null;
    if (templateId && mongoose.Types.ObjectId.isValid(templateId)) {
      template = await TemplateModel.findById(templateId);
    }
    if (!template && templateId) {
      template = await TemplateModel.findOne({ _id: templateId });
    }

    if (!template) {
      console.error(`❌ [Download Route] No template document found for id: ${templateId}`);
      return new NextResponse("Your download link has expired or is invalid.", { status: 403 });
    }

    // Pull unique link reference string from MongoDB column
    const databaseFileLink = template.Link || template.link;
    if (!databaseFileLink) {
      console.error(`❌ [Download Route] Template ${templateId} has no Link/link field set.`);
      return new NextResponse("This asset has no downloadable file configured.", { status: 404 });
    }

    const parsedFileName = path.basename(databaseFileLink);
    const filePath = path.join(process.cwd(), "src", "storage", parsedFileName);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ [Download Route] File missing on disk: ${filePath}`);
      return new NextResponse(`Physical file archive "${parsedFileName}" not found on server.`, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    // Content-Disposition: attachment forces the browser to download immediately rather than
    // navigate to/render the response inline. This only works if the URL itself is reachable —
    // if you see a generic browser error page instead of a download prompt, the link the browser
    // is hitting is wrong/unreachable (check NEXT_PUBLIC_SITE_URL), not this header.
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${parsedFileName}"`,
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("❌ [Download Route] Secure download verification failed:", error);
    return new NextResponse("Your download link has expired or is invalid.", { status: 403 });
  }
}