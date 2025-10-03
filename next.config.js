/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['xlsx', 'jspdf', 'jspdf-autotable'],
  },
  webpack: (config, { isServer }) => {
    // Handle node modules that need to be externalized
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        'xlsx': 'commonjs xlsx',
        'jspdf': 'commonjs jspdf',
        'jspdf-autotable': 'commonjs jspdf-autotable',
      })
    }

    // Handle canvas for PDF generation
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    }

    return config
  },
  // Optimize for production
  swcMinify: true,
  compress: true,
  // Handle large payloads
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
