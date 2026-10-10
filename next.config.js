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
    return [
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
  }
};

module.exports = nextConfig;
