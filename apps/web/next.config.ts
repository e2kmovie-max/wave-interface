import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // Mongoose ships with optional native modules; keep it as an external on the server.
  serverExternalPackages: ["mongoose"],
  webpack: (
    config,
    { isServer }: { isServer: boolean },
  ) => {
    if (isServer) {
      // Externalize node: built-in imports so webpack does not attempt to
      // resolve them via the unsupported "node:" URL scheme.
      const prev = config.externals as unknown[];
      config.externals = [
        (
          ctx: { request?: string },
          cb: (err: null, result?: string) => void,
        ) => {
          if (ctx.request && /^node:/.test(ctx.request)) {
            return cb(null, `commonjs ${ctx.request}`);
          }
          cb(null);
        },
        ...(Array.isArray(prev) ? prev : prev ? [prev] : []),
      ];
    }
    return config;
  },
};

export default nextConfig;
