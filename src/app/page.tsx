import { templates } from "@/lib/templates";

export default function Home() {
  return (
    <div>
      <h1>Power BI Templates — Instant Delivery</h1>
      <p>
        Professional ready-made dashboard layouts you can download immediately after purchase.
      </p>

      <h2 style={{ marginTop: 32 }}>Featured Templates</h2>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {templates.map((t) => (
          <a
            key={t.id}
            href={`/templates/${t.slug}`}
            style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, textDecoration: "none", color: "#111" }}
          >
            <div style={{ fontWeight: 700 }}>{t.name}</div>
            <div style={{ marginTop: 8, color: "#444" }}>{t.shortDescription}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
