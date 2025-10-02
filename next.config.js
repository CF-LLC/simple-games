/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: '/simple-games',
  assetPrefix: '/simple-games',
}

module.exports = nextConfig