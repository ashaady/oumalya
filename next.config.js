const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true
  },
  experimental: {
    serverComponentsExternalPackages: ['better-sqlite3']
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname);
    return config;
  },
  async rewrites() {
    const rewrites = [
      { source: '/index.html', destination: '/' },
      { source: '/boutique.html', destination: '/boutique' },
      { source: '/produit.html', destination: '/produit' },
      { source: '/panier.html', destination: '/panier' },
      { source: '/commande.html', destination: '/commande' },
      { source: '/apropos.html', destination: '/apropos' },
      { source: '/contact.html', destination: '/contact' },
      { source: '/livraison.html', destination: '/livraison' },
      { source: '/favoris.html', destination: '/favoris' }
    ];

    const fastapiUrl = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL;
    if (fastapiUrl) {
      rewrites.push({
        source: '/api/:path*',
        destination: `${fastapiUrl}/api/:path*`
      });
    }

    return rewrites;
  }
};

module.exports = nextConfig;
