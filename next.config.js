/** @type {import('next').NextConfig} */
const nextConfig = {};

if (process.env.NODE_ENV !== "production") {
  const { initOpenNextCloudflareForDev } = await import("@opennextjs/cloudflare");
  initOpenNextCloudflareForDev();
}

export default nextConfig;