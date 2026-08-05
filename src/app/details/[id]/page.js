import { notFound } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Template from "@/models/Template";
import DetailClient from "./DetailClient";
export const runtime = 'nodejs';
// Server Component: runs on the server/edge at request time. Fetches ONLY the single
// template matching this id directly from MongoDB — no HTTP round-trip to your own
// /api/templates route, and no downloading the entire templates collection just to find
// one document. This is the main fix for the slow load on the deployed site: previously
// the whole page waited on the client to hydrate, then fetch every template, then filter.
export default async function ViewDetailPage({ params }) {
  const { id } = await params;

  await dbConnect();

  let templateDoc = null;
  try {
    templateDoc = await Template.findById(id).lean();
  } catch (err) {
    // Invalid ObjectId format, or a genuine lookup failure — treat both as "not found"
    // rather than crashing the page.
    console.error("Detail page template lookup failed:", err);
    templateDoc = null;
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