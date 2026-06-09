import dbConnect from "@/lib/mongodb";
import Template from "@/models/Template";
import { NextResponse } from "next/server";

export async function GET() {
  await dbConnect();

  // This is your sample data based on your screenshot
  const sampleTemplates = [
    {
      title: "HR Dashboard",
      subtitle: "Track hiring, retention, and performance.",
      price: 35,
      tag: "New",
      thumbnailImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000",
      category: "HR",
      details: {
        pagesCount: 5,
        visualsCount: 22,
        fullDescription: "A professional HR dashboard for tracking employee turnover and satisfaction.",
        howToUse: "Download the .pbix file and refresh the data source.",
        galleryImages: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000"]
      }
    },
    {
      title: "Banking Metrics",
      subtitle: "Track banking KPIs and reports.",
      price: 55,
      tag: "Bestseller",
      thumbnailImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1000",
      category: "Banking",
      details: {
        pagesCount: 8,
        visualsCount: 45,
        fullDescription: "Deep dive into financial metrics and branch performance.",
        howToUse: "Connect your SQL database to the Power BI template.",
        galleryImages: []
      }
    }
  ];

  try {
    // This clears the collection and adds the fresh data
    await Template.deleteMany({}); 
    await Template.insertMany(sampleTemplates);
    return NextResponse.json({ message: "Database seeded successfully!" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}