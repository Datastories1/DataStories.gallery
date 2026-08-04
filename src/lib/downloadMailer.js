import { Resend } from "resend";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";

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
    const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy_fallback_key");

    const cleanCustomerEmail = String(customerEmail).trim().toLowerCase();
    console.log(`📨 [Mailer System] Running asset generation for real buyer: ${cleanCustomerEmail}`);

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ [Mailer System] CRITICAL ERROR: RESEND_API_KEY environment variable is missing!");
      return false;
    }

    // Resolve the public base URL. Strip any trailing slash so we never end up with "//api".
    const rawBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const baseUrl = rawBaseUrl.trim().replace(/\/+$/, "");

    // A localhost/empty base URL is only valid on your own dev machine. If this ships to a real
    // buyer, the link is dead on arrival ("invalid link" / can't reach page) even though the
    // token itself is fine. Fail loudly instead of silently emailing a broken link.
    if (!baseUrl || baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
      console.error(
        `❌ [Mailer System] CRITICAL ERROR: NEXT_PUBLIC_SITE_URL is missing or points to localhost ("${rawBaseUrl}"). ` +
        `Refusing to email a download link the buyer can't reach. Set NEXT_PUBLIC_SITE_URL to your real ` +
        `production domain (e.g. https://datastories.gallery) in your deployment environment variables.`
      );
      return false;
    }

    await dbConnect();

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

    const templatesData = await TemplateModel.find({
      $or: [
        { _id: { $in: queryIds } },
        { _id: { $in: itemIds } }
      ]
    });

    let itemsHtmlMarkup = "";
    const secretKey = process.env.JWT_SECRET || "JWT_SECRET_PASSPHRASE_KEY";

    const iterableItems = templatesData.length > 0 ? templatesData : itemIds.map(id => ({ _id: id, title: "Power BI Dashboard Template" }));

    for (const template of iterableItems) {
      const assetTitle = template.title || "Power BI Dashboard Template";
      const targetId = String(template._id);

      const downloadToken = jwt.sign(
        { templateId: targetId, customerEmail: cleanCustomerEmail },
        secretKey,
        { expiresIn: "14d" }
      );

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

export const sendDownloadEmail = generateAndEmailDownloadLink;
export default generateAndEmailDownloadLink;