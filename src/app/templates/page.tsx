import { templates } from "@/lib/templates";

export const metadata = {
  title: "Templates — datastories.gallery",
  description: "Browse Power BI templates with instant delivery.",
};

export default function TemplatesPage() {
  return (
    <div>
      <h1>Templates</h1>
      <p>Browse all available Power BI dashboard layouts.</p>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        {templates.map((t) => (
          <a key={t.id} href={`/templates/${t.slug}`} style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, textDecoration: "none", color: "#111" }}>
            <div style={{ fontWeight: 700 }}>{t.name}</div>
            <div style={{ marginTop: 8, color: "#444" }}>{t.shortDescription}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
