/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Hataları görmezden gel ve build'e devam et
  },
  typescript: {
    ignoreBuildErrors: true, // Tip hatalarını görmezden gel
  },
};

export default nextConfig;