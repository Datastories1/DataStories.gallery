// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   swcMinify: false,
//   webpack: (config, { isServer }) => {
//     config.optimization.minimize = false;

//     if (isServer) {
//       // Prevents Webpack from failing when Node.js core modules are bundled for server/API routes
//       config.resolve.fallback = {
//         ...config.resolve.fallback,
//         net: false,
//         tls: false,
//         fs: false,
//         dns: false,
//         stream: false,
//         http: false,
//         https: false,
//         child_process: false,
//       };
//     }

//     return config;
//   },
// };

// if (process.env.NODE_ENV !== "production") {
//   try {
//     const openNext = await import("@opennextjs/cloudflare");
//     const initFn = openNext.initOpenNextCloudflareForDev || openNext.default?.initOpenNextCloudflareForDev;
    
//     if (typeof initFn === "function") {
//       initFn();
//     }
//   } catch (err) {
//     console.warn("⚠️ OpenNext Cloudflare dev helper skipped:", err.message);
//   }
// }

// export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence Turbopack warning (Next.js 16 uses Turbopack by default)
  turbopack: {},
};

// OpenNext Cloudflare dev helper (only in development)
if (process.env.NODE_ENV !== "production") {
  try {
    const { initOpenNextCloudflareForDev } = await import("@opennextjs/cloudflare");
    if (typeof initOpenNextCloudflareForDev === "function") {
      initOpenNextCloudflareForDev();
    }
  } catch (err) {
    console.warn("⚠️ OpenNext Cloudflare dev helper skipped:", err.message);
  }
}

export default nextConfig;