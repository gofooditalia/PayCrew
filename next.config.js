/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // Ensure Prisma client files are included in build
  transpilePackages: ['@prisma/client']
};

module.exports = nextConfig;
