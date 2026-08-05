import { notFound } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Template from "@/models/Template";
import DetailClient from "./DetailClient";

// Required: mongoose/MongoDB's driver needs a real Node.js runtime (it opens actual TCP
// sockets), not the lightweight edge runtime. Every existing API route in this project already
// declares this — Server Components need it too, or the Worker throws when this file tries to
// connect to MongoDB (this was the cause of the "Worker threw exception" / Error 1101 crash).
export const runtime = 'nodejs';

export default async function ViewDetailPage({ params }) {
  const { id } = await params;

  let templateDoc = null;
  let connectionFailed = false;

  try {
    // dbConnect() and the query are wrapped in the SAME try/catch. Previously dbConnect() sat
    // outside the try/catch — so when the Atlas connection timed out or failed (common on the
    // free M0 tier under Cloudflare's connection pattern), it threw uncaught and crashed the
    // whole Worker (Error 1101) instead of being handled gracefully here.
    await dbConnect();
    templateDoc = await Template.findById(id).lean();
  } catch (err) {
    console.error("Detail page template lookup failed:", err);
    connectionFailed = true;
    templateDoc = null;
  }

  if (connectionFailed) {
    // The database itself was unreachable (timeout, network blip, etc.) — this is different
    // from "this id doesn't exist." Show a retry-friendly message instead of a hard 404, since
    // the template may well exist and a reload will likely succeed.
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

  if (!templateDoc) {
    notFound();
  }

  // Server Components can only pass plain JSON-serializable data down to Client Components.
  // This strips Mongo-specific types (ObjectId, Date instances, etc.) into plain
  // strings/objects safely.
  const template = JSON.parse(JSON.stringify(templateDoc));

  return <DetailClient template={template} />;
}