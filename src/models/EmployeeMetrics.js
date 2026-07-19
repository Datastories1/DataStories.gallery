import mongoose from "mongoose";

const EmployeeMetricsSchema = new mongoose.Schema({
  employeeName: {
    type: String,
    required: true,
    unique: true
  },
  assignedTemplates: [{
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
    title: String,
    priceAtCreation: Number
  }],
  totalRevenueGenerated: {
    type: Number,
    default: 0
  },
  successfulSalesCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

export default mongoose.models.EmployeeMetrics || mongoose.model("EmployeeMetrics", EmployeeMetricsSchema);