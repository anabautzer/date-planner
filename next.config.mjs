/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // TMDB posters, if you wire up the real API
    remotePatterns: [{ protocol: 'https', hostname: 'image.tmdb.org' }],
  },
};

export default nextConfig;
