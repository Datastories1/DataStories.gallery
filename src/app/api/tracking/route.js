import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { generateAndEmailDownloadLink } from "@/lib/downloadMailer";
export const runtime = 'node.js';
const Schema = mongoose.Schema;
const IntentTrackerSchema = mongoose.models.IntentTracker?.schema || new Schema(
  {
    sessionTrackerId: { type: String, required: true },
    templateId: { type: String, required: true },
    templateTitle: { type: String, default: "Untitled Template" },
    templatePrice: { type: Number, default: 0 },
    authorName: { type: String, default: "Future To BI Solutions" },
    status: { type: String, required: true }, 
    customerEmail: { type: String }
  },
  { timestamps: true }
);

const IntentTracker = mongoose.models.IntentTracker || mongoose.model("IntentTracker", IntentTrackerSchema);

const STATUS_WEIGHTS = {
  "viewed": 1,
  "added to cart": 2,
  "proceeded to payment": 3,
  "sold": 4
};

function shouldUpdateStatus(currentStatus, newStatus) {
  if (!currentStatus) return true;
  const currentWeight = STATUS_WEIGHTS[currentStatus.toLowerCase().trim()] || 0;
  const newWeight = STATUS_WEIGHTS[newStatus.toLowerCase().trim()] || 0;
  return newWeight >= currentWeight;
}

export async function POST(request) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const body = await request.json();
    const { sessionTrackerId, status, items, templateId, templateTitle, templatePrice, authorName, customerEmail } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing conversion status text" }, { status: 400 });
    }

    const processedStatus = String(status).toLowerCase().trim();

    // --- CASE A: BULK/CART ENTRY SUCCESS PROCESSING ---
    if (processedStatus === "sold" && !templateId) {
      let templateIdsArray = [];

      // Approach 1: Parse item elements directly if passed by payload
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const targetId = String(item._id || item.templateId || item.id);
          templateIdsArray.push(targetId);
          
          await IntentTracker.findOneAndUpdate(
            { sessionTrackerId: String(sessionTrackerId || "legacy_session"), templateId: targetId },
            {
              $set: {
                templateTitle: item.templateTitle || item.title || "Untitled Template",
                templatePrice: Number(item.templatePrice || item.price || 0),
                authorName: item.authorName || "Future To BI Solutions",
                status: processedStatus,
                customerEmail: customerEmail
              }
            },
            { upsert: true }
          );
        }
      } 
      
      // Approach 2 & 3 Fallback Safety: Scan database aggressively by Session Token OR Email Address
      if (templateIdsArray.length === 0) {
        console.log(`🔍 Processing emergency asset retrieval. Session ID: ${sessionTrackerId} | Email: ${customerEmail}`);
        
        const scanConditions = [];
        if (sessionTrackerId) scanConditions.push({ sessionTrackerId: String(sessionTrackerId) });
        if (customerEmail && customerEmail !== "anonymous_buyer") scanConditions.push({ customerEmail: String(customerEmail) });

        if (scanConditions.length > 0) {
          const matchedRecords = await IntentTracker.find({
            $or: scanConditions,
            status: { $ne: "sold" } // Grab items currently processing in checkout funnels
          });

          templateIdsArray = matchedRecords.map(rec => String(rec.templateId));

          if (templateIdsArray.length > 0) {
            console.log(`✅ Recovered ${templateIdsArray.length} items from structural background logs.`);
            await IntentTracker.updateMany(
              { templateId: { $in: templateIdsArray }, $or: scanConditions },
              { $set: { status: processedStatus, customerEmail: customerEmail } }
            );
          }
        }
      }

      // 🎯 FORCE MAIL DELIVERY OVERRIDE PIPELINE
      if (templateIdsArray.length > 0 && customerEmail && customerEmail !== "anonymous_buyer") {
        console.log(`✉️ Triggering checkout email engine sequence for: ${customerEmail}`);
        await generateAndEmailDownloadLink(customerEmail, templateIdsArray);
      } else {
        console.error("❌ Critical: Mailer skipped. Absolutely no template documents could be resolved for this buyer.");
      }

      return NextResponse.json({ success: true, trackingMode: "bulk", resolvedItemsCount: templateIdsArray.length });
    }

    // --- CASE B: SINGLE SPECIFIC OBJECT REDIRECT ---
    const targetTemplateId = templateId || body._id;
    if (!targetTemplateId) {
      return NextResponse.json({ error: "Missing item tracking tokens" }, { status: 400 });
    }

    const existingRecord = await IntentTracker.findOne({
      sessionTrackerId: String(sessionTrackerId || "legacy_session"),
      templateId: String(targetTemplateId)
    });

    if (existingRecord && !shouldUpdateStatus(existingRecord.status, processedStatus)) {
      return NextResponse.json({ success: true, message: "Higher status precedence verified." });
    }

    await IntentTracker.findOneAndUpdate(
      { sessionTrackerId: String(sessionTrackerId || "legacy_session"), templateId: String(targetTemplateId) },
      { 
        $set: { 
          templateTitle: templateTitle || body.title || "Untitled Template",
          templatePrice: Number(templatePrice || body.price || 0),
          authorName: authorName || "Future To BI Solutions",
          status: processedStatus,
          customerEmail: customerEmail
        } 
      },
      { upsert: true }
    );

    if (processedStatus === "sold" && customerEmail && customerEmail !== "anonymous_buyer") {
      console.log(`✉️ Triggering direct order single mail dispatch engine to: ${customerEmail}`);
      await generateAndEmailDownloadLink(customerEmail, targetTemplateId);
    }

    return NextResponse.json({ success: true, trackingMode: "single", status: processedStatus });

  } catch (error) {
    console.error("CRITICAL TRACKING ENGINE FAILURE:", error);
    return NextResponse.json({ error: "Internal systemic tracking crash", details: error.message }, { status: 500 });
  }
}