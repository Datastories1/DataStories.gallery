// import { NextResponse } from "next/server";
// import mongoose from "mongoose";
// import IntentTracker from "@/models/IntentTracker";
// export const runtime = 'nodejs';

// export async function GET() {
//   try {
//     if (mongoose.connection.readyState !== 1) {
//       await mongoose.connect(process.env.MONGODB_URI);
//     }

//     // Compute stats grouped by each individual Employee/Author name
//     const employeeMetrics = await IntentTracker.aggregate([
//       {
//         $group: {
//           _id: "$authorName",
//           totalRevenue: {
//             $sum: {
//               $cond: [{ $eq: ["$status", "Sold"] }, "$templatePrice", 0]
//             }
//           },
//           totalCompletedSales: {
//             $sum: { $cond: [{ $eq: ["$status", "Sold"] }, 1, 0] }
//           },
//           abandonedCheckoutClicks: {
//             $sum: { $cond: [{ $eq: ["$status", "Clicked"] }, 1, 0] }
//           }
//         }
//       },
//       { $sort: { totalRevenue: -1 } } // Order by top performing worker row
//     ]);

//     // Fetch raw click history data details
//     const granularLogs = await IntentTracker.find({}).sort({ createdAt: -1 }).limit(100);

//     return NextResponse.json({ employeeMetrics, granularLogs }, { status: 200 });
//   } catch (error) {
//     return NextResponse.json({ error: "Failed to compile analytical data" }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import IntentTracker from "@/models/IntentTracker";

export async function GET() {
  try {
    await dbConnect();

    const employeeMetrics = await IntentTracker.aggregate([
      {
        $group: {
          _id: "$authorName",
          totalRevenue: {
            $sum: { $cond: [{ $eq: ["$status", "Sold"] }, "$templatePrice", 0] }
          },
          totalCompletedSales: {
            $sum: { $cond: [{ $eq: ["$status", "Sold"] }, 1, 0] }
          },
          abandonedCheckoutClicks: {
            $sum: { $cond: [{ $eq: ["$status", "Clicked"] }, 1, 0] }
          }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    const granularLogs = await IntentTracker.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ employeeMetrics, granularLogs }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to compile analytical data" }, { status: 500 });
  }
}