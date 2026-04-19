import { templates } from "@/lib/templates";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return templates.map((t) => ({ slug: t.slug }));
}

export default function TemplateDetail({ params }: { params: { slug: string } }) {
  const template = templates.find((t) => t.slug === params.slug);
  if (!template) return notFound();

  return (
    <div>
      <h1>{template.name}</h1>
      <p style={{ color: "#444" }}>{template.longDescription}</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0" }}>
        {template.previewImages.map((src) => (
          <img key={src} src={src} alt={template.name} style={{ width: 320, borderRadius: 12, border: "1px solid #eee" }} />
        ))}
      </div>

      <h3>What’s included</h3>
      <ul>
        {template.features.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>

      <div style={{ marginTop: 20 }}>
        <a
          href={template.stripePaymentLink}
          style={{
            display: "inline-block",
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid #111",
            textDecoration: "none",
            color: "#111",
            fontWeight: 700,
          }}
        >
          Buy Now (Stripe Checkout)
        </a>
      </div>

      <p style={{ marginTop: 12, color: "#666" }}>
        Instant delivery via email after successful payment.
      </p>
    </div>
  );
}
