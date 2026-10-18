import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // react-pdf runs on the server only and shouldn't be bundled.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
