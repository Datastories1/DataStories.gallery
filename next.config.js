/** @type {import('next').NextConfig} */
const nextConfig = {
  // your custom next config options if any
};

if (process.env.NODE_ENV !== "production") {
  try {
    const openNext = await import("@opennextjs/cloudflare");
    const initFn = openNext.initOpenNextCloudflareForDev || openNext.default?.initOpenNextCloudflareForDev;
    
    if (typeof initFn === "function") {
      initFn();
    }
  } catch (err) {
    // Gracefully bypass if Cloudflare dev tools are not needed locally
    console.warn("⚠️ OpenNext Cloudflare dev helper skipped:", err.message);
  }
}

export default nextConfig;