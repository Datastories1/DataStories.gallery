import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY || "re_dummy_fallback_key_for_build";
  return new Resend(apiKey);
}

export async function sendDeliveryEmail(params: {
  to: string;
  templateName: string;
  downloadUrl: string;
}) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
  const support = process.env.SUPPORT_EMAIL || "support@example.com";

  const subject = `Your Power BI Template: ${params.templateName}`;

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6;">
    <h2>Thank you for your purchase!</h2>
    <p>Your template <b>${params.templateName}</b> is ready.</p>
    <p>
      <a href="${params.downloadUrl}" style="display:inline-block;padding:12px 16px;border-radius:8px;text-decoration:none;border:1px solid #333;">
        Download your template
      </a>
    </p>
    <p><b>Note:</b> If your download link expires, reply to this email and we’ll help you.</p>
    <p style="margin-top:24px;color:#666;">Support: ${support}</p>
  </div>
  `;

  const { error } = await resend.emails.send({
    from,
    to: params.to,
    subject,
    html,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}