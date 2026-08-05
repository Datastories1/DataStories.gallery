import { Suspense } from "react";
import dbConnect from "@/lib/mongodb";
import Template from "@/models/Template";
import TemplatesClient from "./TemplatesClient";
export const runtime = 'nodejs';

// Server Component: fetches the templates list directly from MongoDB at request time,
// on the server/edge. This removes the client-side "mount → hydrate → fetch /api/templates
// → wait → render" waterfall that was causing the slow loads and the occasional
// "No Templates Available" flash on the deployed site (most likely a client-side fetch
// timing out or racing other effects under real network latency).
export default async function TemplatesPage() {
  let initialTemplates = [];

  try {
    await dbConnect();
    const docs = await Template.find({}).lean();
    // Strip Mongo-specific types (ObjectId, Date, etc.) into plain JSON before handing off
    // to the Client Component.
    initialTemplates = JSON.parse(JSON.stringify(docs));
  } catch (err) {
    console.error("Failed to load templates server-side:", err);
    initialTemplates = [];
  }

  return (
    <Suspense fallback={<div>Loading Page Infrastructure...</div>}>
      <TemplatesClient initialTemplates={initialTemplates} />
    </Suspense>
  );
}