import { notFound } from "next/navigation";
import dbConnect from "@/lib/mongodb";
import Template from "@/models/Template";
import DetailClient from "./DetailClient";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // Prevent static caching hanging issues on serverless

export default async function ViewDetailPage({ params }) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  if (!id) {
    notFound();
  }

  let templateDoc = null;

  try {
    // 1. Establish connection with a strict timeout wrapper or standard await
    const dbPromise = dbConnect();
    
    // Add a race timeout so Cloudflare never hangs indefinitely if MongoDB Atlas is slow to respond
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Database connection timeout")), 8000)
    );

    await Promise.race([dbPromise, timeoutPromise]);

    // 2. Fetch data safely using lean query with timeout protection
    templateDoc = await Template.findById(id).maxTimeMS(5000).lean();

  } catch (err) {
    console.error("❌ Detail page lookup error:", err.message);
    // Return a fallback or trigger notFound gracefully instead of hanging
    notFound();
  }

  if (!templateDoc) {
    notFound();
  }

  // Clean serialization for client component boundary
  const template = JSON.parse(JSON.stringify(templateDoc));

  return <DetailClient template={template} />;
}