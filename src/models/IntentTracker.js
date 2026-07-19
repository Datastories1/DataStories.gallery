import mongoose from "mongoose";

const IntentTrackerSchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "templates", 
    required: true
  },
  templateTitle: {
    type: String,
    required: true
  },
  templatePrice: {
    type: Number,
    required: true
  },
  authorName: {
    type: String,
    required: true 
  },
  status: {
    type: String,
    // Expanded to support strict lowercase tracking pipeline and fallback values cleanly
    enum: [
      "viewed", 
      "added to cart", 
      "proceeded to payment", 
      "sold"
    ], 
    default: "viewed"
  },
  sessionTrackerId: {
    type: String,
    required: true
  }
}, { timestamps: true });

export default mongoose.models.IntentTracker || mongoose.model("IntentTracker", IntentTrackerSchema, "internal_analytics");