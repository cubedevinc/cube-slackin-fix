import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  env: {
    AUTH0_BASE_URL: process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.AUTH0_BASE_URL || 'http://localhost:3000',
  },
};


if (process.env.ANALYZE === 'true') {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: true,
  });
  module.exports = withBundleAnalyzer(nextConfig);
} else {
  module.exports = nextConfig;
}
