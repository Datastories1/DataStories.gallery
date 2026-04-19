import { templates } from "./templates";

type DeliveryResult = { downloadUrl: string };

export async function getDownloadUrl(templateId: string): Promise<DeliveryResult> {
  const template = templates.find((t) => t.id === templateId);
  if (!template) throw new Error("Template not found");

  const mode = process.env.DELIVERY_MODE || "drive";

  if (mode === "drive") {
    if (!template.driveDownloadUrl) throw new Error("Drive URL not configured");
    return { downloadUrl: template.driveDownloadUrl };
  }

  if (mode === "gcs") {
    // Lazy import to avoid dependency if not using GCS
    const { Storage } = await import("@google-cloud/storage");

    const json = process.env.GCS_SERVICE_ACCOUNT_JSON!;
    const credentials = JSON.parse(json);

    const storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials,
    });

    const bucketName = process.env.GCS_BUCKET!;
    const hours = Number(process.env.GCS_URL_EXPIRES_HOURS || "24");
    const expires = Date.now() + hours * 60 * 60 * 1000;

    if (!template.gcsObjectPath) throw new Error("GCS object path not configured");

    const [url] = await storage
      .bucket(bucketName)
      .file(template.gcsObjectPath)
      .getSignedUrl({ action: "read", expires });

    return { downloadUrl: url };
  }

  throw new Error(`Unknown DELIVERY_MODE: ${mode}`);
}
