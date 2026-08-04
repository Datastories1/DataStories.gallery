import { Resend } from "resend";

export async function sendWelcomeAccountEmail(customerEmail, userName) {
  try {
    if (!customerEmail) {
      console.error("❌ [Account Mailer] Aborted: no customerEmail provided.");
      return false;
    }

    const cleanCustomerEmail = String(customerEmail).trim().toLowerCase();
    console.log(`📨 [Account Mailer] Generating welcoming framework content for buyer: ${cleanCustomerEmail}`);

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("❌ [Account Mailer] CRITICAL ERROR: RESEND_API_KEY variable is blank!");
      return false;
    }

    const resend = new Resend(apiKey);

    const payload = {
      // Use the verified production sender domain (same one downloadMailer.js already uses
      // successfully). "onboarding@resend.dev" is Resend's shared sandbox/test domain — sending
      // real account-creation emails from it in production is unreliable (deliverability issues,
      // spam filtering, or silent rejection), which is the most likely reason this wasn't landing.
      from: "Data Stories <Info@datastories.gallery>",
      to: [cleanCustomerEmail],
      subject: "Welcome to Data Stories!",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 30px; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #1e3a8a; margin-bottom: 5px; font-size: 24px; font-weight: 700;">Welcome, ${userName || "Valued Customer"}!</h2>
          <p style="font-size: 15px; color: #64748b; margin-top: 10px;">
            Your workspace account has been created successfully under:
          </p>
          <p style="font-size: 15px; font-weight: 600; color: #0f172a;">${cleanCustomerEmail}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 15px; color: #64748b;">
            You can now log in to your portal dashboard at any time to manage your purchased templates and account details.
          </p>
        </div>
      `
    };

    console.log(`📡 [Account Mailer] Calling Resend API to welcome buyer: ${cleanCustomerEmail}`);
    const responseBlock = await resend.emails.send(payload);

    if (responseBlock.error) {
      console.error("❌ [Account Mailer] Resend API engine returned failure response:", responseBlock.error);
      return false;
    }

    const assignedId = responseBlock.data?.id || "ID_NOT_RETURNED";
    console.log(`✅ [Account Mailer] Welcome profile message successfully pushed out. Transaction ID: ${assignedId}`);
    return { success: true, id: assignedId };
  } catch (err) {
    console.error("❌ [Account Mailer] Fatal initialization failure caught:", err);
    throw err;
  }
}