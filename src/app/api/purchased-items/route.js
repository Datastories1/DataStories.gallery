export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/mongodb";

export const runtime = 'nodejs';

const templateSchema = new mongoose.Schema({ title: String, Link: String, link: String }, { strict: false });
const TemplateModel = mongoose.models.Template || mongoose.model("Template", templateSchema);

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const templateIdsParam = searchParams.get("templateIds");
    const customerEmail = searchParams.get("customerEmail") || "buyer@datastories.gallery";

    await dbConnect();

    let idsToQuery = [];
    if (templateIdsParam) {
      try {
        const parsed = JSON.parse(templateIdsParam);
        if (Array.isArray(parsed)) {
          idsToQuery = parsed.map(item => typeof item === 'object' ? (item._id || item.id) : item).filter(Boolean);
        }
      } catch (e) {
        idsToQuery = templateIdsParam.split(",").map(s => s.trim()).filter(Boolean);
      }
    }

    let query = {};
    if (idsToQuery.length > 0) {
      const validQueryIds = idsToQuery.map(id => 
        mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
      );
      query = {
        $or: [
          { _id: { $in: validQueryIds } },
          { _id: { $in: idsToQuery } }
        ]
      };
    }

    let templates = await TemplateModel.find(query).lean();

    const secretKey = process.env.JWT_SECRET || "JWT_SECRET_PASSPHRASE_KEY";

    const enrichedTemplates = templates.map(template => {
      const targetId = String(template._id);
      const downloadToken = jwt.sign(
        { templateId: targetId, customerEmail: customerEmail },
        secretKey,
        { expiresIn: "7d" }
      );

      return {
        _id: targetId,
        title: template.title || "Power BI Dashboard Template",
        downloadUrl: `/api/download?token=${downloadToken}`
      };
    });

    return NextResponse.json({ success: true, templates: enrichedTemplates });
  } catch (error) {
    console.error("Purchased items error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}