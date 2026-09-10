import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.NEXT_OUTPUT === "export" ? { output: "export" as const } : {}),
  poweredByHeader: false,
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
