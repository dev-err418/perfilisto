import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  poweredByHeader: false,
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
