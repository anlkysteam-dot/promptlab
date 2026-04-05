import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "img.clerk.com", pathname: "/**" }],
  },
};

export default nextConfig;
