import mongoose from 'mongoose';

const TemplateSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: { type: String },
  price: { type: Number, required: true },
  tag: { type: String }, // e.g., 'New', 'Bestseller'
  thumbnailImage: { type: String, required: true }, // URL to the image
  category: { type: String },
  // These fields are for your "View Details" page
  details: {
    pagesCount: { type: Number },
    visualsCount: { type: Number },
    fullDescription: { type: String },
    howToUse: { type: String },
    galleryImages: [{ type: String }] // An array of image URLs
  },
  Link: { type: String }, // Made optional to prevent errors
  link: { type: String }  // ADD THIS LINE: Allows Mongoose to read lowercase 'link' from MongoDB!
}, { timestamps: true });

// This part is crucial for Next.js to prevent re-compiling the model
export default mongoose.models.Template || mongoose.model('Template', TemplateSchema);