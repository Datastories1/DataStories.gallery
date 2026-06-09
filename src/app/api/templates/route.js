import dbConnect from "@/lib/mongodb";
import Template from "@/models/Template";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();
    // Fetch everything from the 'test' database collection
    const data = await Template.find({});
    
    // Always return an array, even if empty
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}