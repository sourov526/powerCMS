import path from "node:path";

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  experimental: {
    // Allows importing code from outside `frontend/` (e.g. `admin/`, `api/`).
    externalDir: true,
  },
  webpack: (config, { isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.modules = config.resolve.modules || [];
    const repoNodeModules = path.join(process.cwd(), "node_modules");
    if (!config.resolve.modules.includes(repoNodeModules)) {
      config.resolve.modules.unshift(repoNodeModules);
    }

    // Ensure the server webpack runtime can locate emitted chunks during Next's
    // "Collecting page data" phase.
    if (isServer && config.output) {
      config.output.chunkFilename = "chunks/[id].js";
    }
    return config;
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "http", hostname: "localhost" },
      {
        protocol: "https",
         hostname: "pub-9114afd3649e48598438359a113cdc97.r2.dev",
      },
    ],
  },
};

export default config;
