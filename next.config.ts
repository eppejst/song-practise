import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only export statically in production — avoids generateStaticParams enforcement in dev
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? '',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
