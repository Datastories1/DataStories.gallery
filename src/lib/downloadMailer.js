import { Resend } from "resend";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const resend = new Resend(process.env.RESEND_API_KEY || "");

const templateStructure = new mongoose.Schema({
  title: String,
  Link: String
}, { strict: false });

const TemplateModel = mongoose.models.Template || mongoose.model("Template", templateStructure);

/**
 * Generates an encrypted/secure token and sends the download breakdown email to the buyer
 */
export async function generateAndEmailDownloadLink(customerEmail, templateIdOrArray) {
  try {
    const cleanCustomerEmail = String(customerEmail).trim().toLowerCase();
    console.log(`📨 [Mailer System] Running asset generation for real buyer: ${cleanCustomerEmail}`);
    
    if (!process.env.RESEND_API_KEY) {
      console.error("❌ [Mailer System] CRITICAL ERROR: RESEND_API_KEY environment variable is missing!");
      return false;
    }

    if (mongoose.connection.readyState !== 1) {
      if (!process.env.MONGODB_URI) {
        throw new Error("Missing MONGODB_URI connection string inside initialization.");
      }
      await mongoose.connect(process.env.MONGODB_URI);
    }

    let itemIds = [];
    if (Array.isArray(templateIdOrArray)) {
      itemIds = templateIdOrArray.map(id => String(id.templateId || id));
    } else if (templateIdOrArray) {
      itemIds = [String(templateIdOrArray.templateId || templateIdOrArray)];
    }

    if (itemIds.length === 0) {
      console.error("❌ [Mailer System] Aborted: No valid template ID items found in payload.");
      return false;
    }

    const queryIds = itemIds.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id);

    // Dynamic database search checking for string representation or standard ObjectIds
    const templatesData = await TemplateModel.find({
      $or: [
        { _id: { $in: queryIds } },
        { _id: { $in: itemIds } }
      ]
    });

    if (!templatesData || templatesData.length === 0) {
      console.warn(`⚠️ [Mailer System] Check warning: Could not locate template item ids inside database collections.`);
    }

    let itemsHtmlMarkup = "";
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const secretKey = process.env.JWT_SECRET || "JWT_SECRET_PASSPHRASE_KEY";

    // Loop through the items found, fallback gracefully if query came back blank during manual sandbox checkouts
    const iterableItems = templatesData.length > 0 ? templatesData : itemIds.map(id => ({ _id: id, title: "Power BI Dashboard Template" }));

    for (const template of iterableItems) {
      const assetTitle = template.title || "Power BI Dashboard Template";
      const targetId = String(template._id);

      const downloadToken = jwt.sign(
        { templateId: targetId, customerEmail: cleanCustomerEmail },
        secretKey,
        { expiresIn: "14d" }
      );

      // Matches your download path route scheme
      const protectedProxyUrl = `${baseUrl}/api/download?token=${downloadToken}`;

      itemsHtmlMarkup += `
        <div style="margin-bottom: 20px; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="font-weight: bold; color: #0f172a; font-size: 16px; margin-bottom: 8px;">
            📊 ${assetTitle}
          </div>
          <div style="margin-top: 10px;">
            <a href="${protectedProxyUrl}" style="display: inline-block; padding: 10px 18px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
              📥 Download Secure Asset Bundle
            </a>
          </div>
        </div>
      `;
    }

    const emailPayload = {
      from: "Data Stories <Info@datastories.gallery>",
      to: [cleanCustomerEmail],
      subject: `📥 Your Dashboard Assets Download Links`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #1e3a8a; margin-bottom: 5px; font-size: 24px; font-weight: 700;">Thank you for your purchase!</h2>
          <p style="font-size: 15px; color: #64748b; margin-top: 0;">Click below to instantly download your purchased templates directly to your device:</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          ${itemsHtmlMarkup}
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        </div>
      `
    };

    console.log(`📡 [Mailer System] Calling Resend API to deliver asset download link to: ${cleanCustomerEmail}`);
    const responseBlock = await resend.emails.send(emailPayload);
    
    if (responseBlock.error) {
      console.error("❌ [Mailer System] Resend rejected payload request:", responseBlock.error);
      return false;
    }

    const assignedId = responseBlock.data?.id || "ID_NOT_RETURNED";
    console.log(`✅ [Mailer System] Email accepted by Resend engine! Transaction ID: ${assignedId}`);
    return { success: true, messageId: assignedId };
  } catch (error) {
    console.error("❌ [Mailer System] Fatal crash exception inside execution loop:", error);
    throw error;
  }
}