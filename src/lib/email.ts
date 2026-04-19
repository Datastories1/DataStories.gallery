import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDeliveryEmail(params: {
  to: string;
  templateName: string;
  downloadUrl: string;
}) {
  const from = process.env.EMAIL_FROM!;
  const support = process.env.SUPPORT_EMAIL!;

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
