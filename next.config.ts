import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ktixltgtvmdrtvsvjyrq.supabase.co", // your Supabase project hostname
      },
    ],
  },
};

export default nextConfig;
