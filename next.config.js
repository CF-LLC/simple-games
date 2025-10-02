/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/simple-games' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/simple-games' : '',
}

module.exports = nextConfig