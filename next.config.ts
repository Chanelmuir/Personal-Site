import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /music reads this file at request time, so make sure it ships with the function
  outputFileTracingIncludes: {
    "/music": ["./content/music/**"],
  },
};

export default nextConfig;
