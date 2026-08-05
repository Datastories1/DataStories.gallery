import { notFound } from "next/navigation";
import { safeDbConnect } from "@/lib/mongodb";
import Template from "@/models/Template";
import DetailClient from "./DetailClient";

// Required: mongoose/MongoDB's driver needs a real Node.js runtime (it opens actual TCP
// sockets), not the lightweight edge runtime.
export const runtime = 'nodejs';

export default async function ViewDetailPage({ params }) {
  const { id } = await params;

  // safeDbConnect() can never throw — it always returns { ok, conn, error }. This removes any
  // chance of an uncaught exception crashing the Worker (Error 1101), which is what happened
  // before when dbConnect() was called outside its try/catch, or if a try/catch was ever
  // accidentally missed on a future page.
  const { ok: connected } = await safeDbConnect();

  if (!connected) {
    return (
      <div style={{ padding: "80px 20px", textAlign: "center", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: "24px", color: "#991b1b", marginBottom: "12px" }}>
          We couldn't load this page right now
        </h1>
        <p style={{ color: "#64748b", marginBottom: "24px" }}>
          Our database is taking longer than expected to respond. Please refresh the page in a
          few seconds.
        </p>
      </div>
    );
  }

  let templateDoc = null;
  try {
    templateDoc = await Template.findById(id).lean();
  } catch (err) {
    console.error("Detail page template lookup failed:", err);
    templateDoc = null;
  }

  if (!templateDoc) {
    notFound();
  }

  // Server Components can only pass plain JSON-serializable data down to Client Components.
  const template = JSON.parse(JSON.stringify(templateDoc));

  return <DetailClient template={template} />;
}