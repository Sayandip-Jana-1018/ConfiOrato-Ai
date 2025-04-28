/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  serverExternalPackages: ['@tensorflow/tfjs', '@mediapipe/holistic', '@mediapipe/camera_utils', '@mediapipe/drawing_utils', '@mediapipe/hands', '@mediapipe/pose'],
  // Completely disable TypeScript type checking
  typescript: {
    ignoreBuildErrors: true,
  },
  // Completely disable ESLint
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ignore all errors during build
  swcMinify: true,
  experimental: {
    forceSwcTransforms: true,
  }
};

module.exports = nextConfig;
