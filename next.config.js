/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Ensure Prisma client files are included in build
  transpilePackages: ['@prisma/client'],

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      // Add other domains if needed
      // {
      //   protocol: 'https',
      //   hostname: 'example.com',
      // },
    ],
    formats: ['image/avif', 'image/webp'],
  },
};

module.exports = nextConfig;
