export type Template = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  previewImages: string[]; // put files in /public/previews/...
  stripePriceId: string;   // used to identify purchase via webhook
  stripePaymentLink: string;

  // Delivery options
  driveDownloadUrl?: string; // MVP direct link (can be view-only link)
  gcsObjectPath?: string;    // e.g. "templates/sales-kpi-v1.pbit"
};

export const templates: Template[] = [
  {
    id: "sales-kpi",
    slug: "sales-kpi-dashboard",
    name: "Sales KPI Dashboard",
    shortDescription: "A clean executive-ready Power BI layout for sales reporting.",
    longDescription:
      "This template is designed for small to mid-sized teams to track revenue, pipeline, conversion, and performance trends.",
    features: [
      "Executive overview page",
      "KPI cards + trend lines",
      "Segment filters (region/product/channel)",
      "Modern layout with clean spacing",
    ],
    previewImages: ["/previews/sales-kpi-1.png", "/previews/sales-kpi-2.png"],
    stripePriceId: "price_123", // <-- Put the Stripe Price ID here
    stripePaymentLink: "https://buy.stripe.com/xxx", // <-- Your Payment Link

    // MVP delivery:
    driveDownloadUrl: "https://drive.google.com/uc?export=download&id=FILE_ID"
    // OR use a shared link; better: "uc?export=download&id="
  },
];
