import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { nextRuntime }) => {
    // The edge bundle (middleware) otherwise gets wrapped in eval() for
    // sourcemaps, which the real Edge Runtime forbids and which silently
    // breaks webpack's own `__dirname` shim (also eval-based), crashing
    // every request with "ReferenceError: __dirname is not defined".
    if (nextRuntime === "edge") {
      config.devtool = false;
    }
    return config;
  },
};

export default nextConfig;
