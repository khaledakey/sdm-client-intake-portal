/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  async headers() {
    return [
      {
        // Public intake wizard: allowed to be iframed by the marketing site only.
        source: '/get-started',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://saoirsedigital.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
