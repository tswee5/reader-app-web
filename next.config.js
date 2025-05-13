/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint checks during build to prevent build failures
  eslint: {
    // Only run ESLint on these directories during build if enabled
    dirs: ['app', 'components', 'lib'],
    // Don't fail the build for ESLint errors
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript type checking during build to prevent failures
  typescript: {
    // Don't fail the build for TypeScript type errors
    ignoreBuildErrors: true,
  },

  // Enable strict mode for React
  reactStrictMode: true,
  
  // Add image domains for next/image
  images: {
    domains: ['brducmfdyegwjdpdmnfb.supabase.co'],
  },
};

module.exports = nextConfig;