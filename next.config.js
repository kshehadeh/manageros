/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['pub-56cc58f3bbba47f99bfd16db7875a540.r2.dev'],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
}
export default nextConfig
