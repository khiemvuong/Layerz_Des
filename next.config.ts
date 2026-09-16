import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-85ee30a54207460388ecc8b899ca0275.r2.dev",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
