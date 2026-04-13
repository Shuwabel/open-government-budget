/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Suppress warnings by setting explicit root
  outputFileTracingRoot: process.cwd(),
}

export default nextConfig
