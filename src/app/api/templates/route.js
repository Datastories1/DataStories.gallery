export const dynamic = 'force-dynamic';
export const revalidate = 0;

import dbConnect from "@/lib/mongodb";
import Template from "@/models/Template";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    // Fetch live documents as plain JavaScript objects directly from MongoDB
    const data = await Template.find({}).lean();

    // Safely serialize BSON ObjectIDs and dates to plain strings
    const sanitizedTemplates = JSON.parse(JSON.stringify(data || []));

    return NextResponse.json(sanitizedTemplates, { status: 200 });
  } catch (error) {
    console.error("Database Error in /api/templates:", error);
    return NextResponse.json({ error: "Failed to fetch data from MongoDB" }, { status: 500 });
  }
}