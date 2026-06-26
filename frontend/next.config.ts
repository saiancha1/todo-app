import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo root also has a package-lock.json (the dev runner). Pin Turbopack's
  // workspace root to this app so it doesn't have to guess.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
