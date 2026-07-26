/** @type {import('next').NextConfig} */
const nextConfig = {
  swcMinify: false,
  webpack: (config) => {
    config.optimization.minimize = false;
    return config;
  },
};

if (process.env.NODE_ENV !== "production") {
  try {
    const openNext = await import("@opennextjs/cloudflare");
    const initFn = openNext.initOpenNextCloudflareForDev || openNext.default?.initOpenNextCloudflareForDev;
    
    if (typeof initFn === "function") {
      initFn();
    }
  } catch (err) {
    console.warn("⚠️ OpenNext Cloudflare dev helper skipped:", err.message);
  }
}

export default nextConfig;