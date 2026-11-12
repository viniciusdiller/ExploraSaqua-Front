/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "172.16.32.199",
        port: "3005",
        pathname: "/uploads/**",
      },
    ],
  },
  experimental: {
    allowedDevOrigins: ["http://172.16.32.199:3004"],
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: "http://localhost:3005/uploads/:path*",
      },
    ];
  },
};
export default nextConfig;
