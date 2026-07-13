/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/bankmmcterbaik",
  trailingSlash: true,
  images: { unoptimized: true },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
