import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the Turbopack workspace root to this project (a stray lockfile in a parent
  // folder would otherwise make Next infer the wrong root).
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
