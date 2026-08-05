import { Suspense } from "react";
import { safeDbConnect } from "@/lib/mongodb";
import Template from "@/models/Template";
import TemplatesClient from "./TemplatesClient";

// Required: mongoose/MongoDB's driver needs a real Node.js runtime (it opens actual TCP
// sockets), not the lightweight edge runtime.
export const runtime = 'nodejs';

export default async function TemplatesPage() {
  let initialTemplates = [];

  // safeDbConnect() can never throw — it always returns { ok, conn, error }. This removes any
  // chance of an uncaught exception crashing the Worker (Error 1101).
  const { ok: connected } = await safeDbConnect();

  if (connected) {
    try {
      const docs = await Template.find({}).lean();
      initialTemplates = JSON.parse(JSON.stringify(docs));
    } catch (err) {
      console.error("Failed to load templates server-side:", err);
      initialTemplates = [];
    }
  } else {
    console.error("Failed to load templates server-side: database connection failed.");
  }

  return (
    <Suspense fallback={<div>Loading Page Infrastructure...</div>}>
      <TemplatesClient initialTemplates={initialTemplates} />
    </Suspense>
  );
}