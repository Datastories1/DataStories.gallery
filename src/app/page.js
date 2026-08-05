import { Suspense } from "react";
import { safeDbConnect } from "@/lib/mongodb";
import Template from "@/models/Template";
import TemplatesClient from "./TemplatesClient";

// Required: mongoose/MongoDB's driver needs a real Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Prevent static optimization caching locks on serverless

export default async function TemplatesPage() {
  let initialTemplates = [];

  try {
    // 1. Establish connection using safeDbConnect with a hard timeout wrapper
    const dbPromise = safeDbConnect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database connection timeout")), 8000)
    );

    const connectionResult = await Promise.race([dbPromise, timeoutPromise]);
    const connected = connectionResult?.ok;

    if (connected) {
      // 2. Fetch docs safely with query timeout protection (.maxTimeMS)
      const docs = await Template.find({}).maxTimeMS(5000).lean();
      initialTemplates = JSON.parse(JSON.stringify(docs));
    } else {
      console.error("Failed to load templates server-side: database connection failed.");
    }
  } catch (err) {
    console.error("Failed to load templates server-side due to timeout or error:", err);
    initialTemplates = [];
  }

  return (
    <Suspense fallback={<div>Loading Page Infrastructure...</div>}>
      <TemplatesClient initialTemplates={initialTemplates} />
    </Suspense>
  );
}