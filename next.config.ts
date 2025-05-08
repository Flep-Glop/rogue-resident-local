import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    styledComponents: true,
  },
  // Turbopack replaces Webpack during development (`next dev --turbopack`).
  // The `turbopack` key lets us add loader rules that were previously expressed
  // in the custom `webpack()` function.
  turbopack: {
    rules: {
      "*.md": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
      "*.txt": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
      "*.node": {
        loaders: ["node-loader"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
