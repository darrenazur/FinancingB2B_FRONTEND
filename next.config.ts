import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones on the Wi-Fi load the dev scripts (dev mode only; no effect on next start).
  allowedDevOrigins: ['192.168.1.164'],
};

export default nextConfig;
