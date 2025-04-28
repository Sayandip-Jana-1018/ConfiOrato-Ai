import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  output: 'standalone',
  // Ensure MediaPipe and TensorFlow.js work properly in production
  serverExternalPackages: ['@tensorflow/tfjs', '@mediapipe/holistic', '@mediapipe/camera_utils', '@mediapipe/drawing_utils', '@mediapipe/hands', '@mediapipe/pose'],
  // Disable type checking during build for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build for faster builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
