/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.5.3", "192.168.5.24", "192.168.5.50"],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/api/**",
      },
    ],
  },
};

export default nextConfig;
