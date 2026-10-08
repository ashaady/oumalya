'use client';

import React from 'react';
import Link from 'next/link';
import SubpageLayout from '@/components/SubpageLayout';
import { useCart } from '@/context/CartContext';
import { PRODUCTS, formatPrice } from '@/data/products';

export default function FavorisPage() {
  const { favorites } = useCart();
  const favoriteProducts = PRODUCTS.filter(p => !!favorites[p.id]);

  return (
    <SubpageLayout>
      <div className="container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Accueil</Link> › <strong>Mes favoris</strong>
        </div>

        {/* Page Hero */}
        <div className="page-hero">
          <p className="page-kicker">MA SÉLECTION</p>
          <h1 className="serif page-title">
            Vos <span className="highlight">coups de cœur</span>
          </h1>
          <p>
            Retrouvez ici les articles que vous avez enregistrés pendant votre visite.
          </p>
        </div>

        {/* Products Grid */}
        <div className="products-grid" id="favoriteProducts">
          {favoriteProducts.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
              </svg>
              <h2>Aucun favori pour le moment</h2>
              <p>Retrouvez ici les articles que vous aimez.</p>
              <Link href="/boutique" className="btn btn-primary">
                Explorer la boutique{' '}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" />
                </svg>
              </Link>
            </div>
          ) : (
            favoriteProducts.map(p => (
              <article key={p.id} className="product-card">
                <Link href={`/produit?id=${p.id}`}>
                  <img src={p.img} alt={p.name} />
                </Link>
                <div className="tag">{p.label}</div>
                <Link className="name" href={`/produit?id=${p.id}`}>
                  {p.name}
                </Link>
                <div className="price">{formatPrice(p.price)}</div>
                <Link className="btn btn-outline shop" href={`/produit?id=${p.id}`}>
                  Voir le produit{' '}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </Link>
              </article>
            ))
          )}
        </div>
      </div>
    </SubpageLayout>
  );
}
