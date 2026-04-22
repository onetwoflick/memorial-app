import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xtwyvfdqpjtxldxztxte.supabase.co", // your new Supabase project hostname
      },
    ],
  },
};

export default nextConfig;
