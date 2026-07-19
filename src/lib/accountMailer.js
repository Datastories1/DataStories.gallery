import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export async function sendWelcomeAccountEmail(customerEmail, userName) {
  try {
    const cleanCustomerEmail = String(customerEmail).trim().toLowerCase();
    console.log(`📨 [Account Mailer] Generating welcoming framework content for buyer: ${cleanCustomerEmail}`);

    if (!process.env.RESEND_API_KEY) {
      console.error("❌ [Account Mailer] CRITICAL ERROR: RESEND_API_KEY variable is blank!");
      return false;
    }

    const payload = {
      from: "Data Stories <onboarding@resend.dev>",
      to: [cleanCustomerEmail], // 🚀 NO HARDCODING: Dispatches dynamically to the registered account target!
      subject: "Welcome to Data Stories!",
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${userName || "Valued Customer"}!</h2>
          <p>Your workspace account profile has been generated successfully under: <strong>${cleanCustomerEmail}</strong></p>
          <p>You can now log into your portal dashboard to manage your purchased configurations at any time.</p>
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