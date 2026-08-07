/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pdf-chatbot/shared'],
  webpack: (config, { dev }) => {
    if (dev) {
      // Disable Webpack filesystem caching in dev mode to prevent Windows pack file locking ENOENT errors
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;
