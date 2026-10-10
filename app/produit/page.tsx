'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SubpageLayout from '@/components/SubpageLayout';
import { useCart } from '@/context/CartContext';
import { PRODUCTS, PRODUCTS_BY_ID, formatPrice } from '@/data/products';

function ProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || 'crocs-rose';
  const { products, productsById, addToCart, isFavorite, toggleFavorite, showToast } = useCart();
  const p = productsById[id] || products.find(x => x.id === id) || products[0];

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [qty, setQty] = useState<number>(1);

  if (!p) {
    return (
      <SubpageLayout>
        <div className="container" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <h2>Article introuvable</h2>
          <Link href="/boutique" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
            Retour à la boutique
          </Link>
        </div>
      </SubpageLayout>
    );
  }

  const handleAddToCart = (redirect = false) => {
    if (!selectedSize) {
      showToast('Choisissez votre taille ou votre pointure');
      document.getElementById('productSizes')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    addToCart(p.id, selectedSize, qty);
    if (redirect) {
      router.push('/panier');
    }
  };

  const related = products.filter(x => x.id !== p.id).slice(0, 3);

  return (
    <SubpageLayout>
      <div className="container" id="productPage">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Accueil</Link> › <Link href="/boutique">Boutique</Link> › <strong><span>{p.name}</span></strong>
        </div>

        {/* Product Layout */}
        <div className="product-layout">
          <div>
            <div className="gallery-main">
              <img id="productImage" alt={p.name} src={p.img} />
              <span className="gallery-tag" id="productBadge">{p.badges}</span>
            </div>
            <div className="thumbs">
              <button className="thumb selected" type="button" aria-label="Photo du produit">
                <img id="productThumbnail" src={p.img} alt="Aperçu de la photo" />
              </button>
            </div>
            <p style={{ fontSize: '10px', color: '#ae9fa3', marginTop: '12px' }}>
              Visuel indicatif · Référence à confirmer avant achat
            </p>
          </div>

          <div className="detail-copy">
            <p className="page-kicker" id="productCategory">{p.label}</p>
            <h1 className="serif" id="productName">{p.name}</h1>
            <div className="detail-price" id="productPrice">{formatPrice(p.price)}</div>
            <p className="detail-lead" id="productLead">{p.desc}</p>
            
            <div className="separator"></div>
            
            <div className="meta-label">
              Couleur : <span style={{ fontWeight: 500 }} id="productColor">{p.color}</span>
            </div>
            <div className="swatch-row">
              <span id="productSwatch" className={`swatch ${p.color === 'Rose' ? 'rose' : p.color === 'Taupe' ? 'taupe' : ''}`}></span>
              <span style={{ color: '#9a8d91' }}>Une couleur disponible sur cette fiche</span>
            </div>
            
            <div className="separator"></div>
            
            <div className="meta-label">
              Choisir une taille / pointure <span style={{ color: 'var(--pink)' }}>*</span>
            </div>
            <div className="size-row" id="productSizes">
              {(Array.isArray(p.sizes) && p.sizes.length ? p.sizes : ['Standard']).map(size => (
                <button
                  key={size}
                  className="size-btn"
                  type="button"
                  aria-pressed={selectedSize === size}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#9a8c90', marginTop: '13px' }}>
              La disponibilité sera confirmée avec la boutique.
            </p>

            <div className="qty-line">
              <div className="qty-box">
                <button
                  id="qtyMinus"
                  aria-label="Réduire la quantité"
                  type="button"
                  onClick={() => setQty(Math.max(1, qty - 1))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14" />
                  </svg>
                </button>
                <strong id="productQty">{qty}</strong>
                <button
                  id="qtyPlus"
                  aria-label="Augmenter la quantité"
                  type="button"
                  onClick={() => setQty(Math.min(99, qty + 1))}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </button>
              </div>

              <button
                className="btn btn-primary add-btn"
                id="productAdd"
                type="button"
                onClick={() => handleAddToCart(false)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 8h14l1 13H4L5 8Z" />
                  <path d="M9 9V6a3 3 0 0 1 6 0v3" />
                </svg>{' '}
                Ajouter au panier
              </button>

              <button
                id="productFav"
                className="icon-action"
                aria-label="Ajouter aux favoris"
                aria-pressed={isFavorite(p.id)}
                type="button"
                onClick={() => toggleFavorite(p.id)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill={isFavorite(p.id) ? 'var(--pink)' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
                </svg>
              </button>
            </div>

            <button
              className="btn btn-outline"
              style={{ width: '100%' }}
              id="productBuy"
              type="button"
              onClick={() => handleAddToCart(true)}
            >
              Commander cet article{' '}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </button>

            <div className="detail-points">
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 6h12v12H2zM14 10h4l4 5v3h-8" />
                  <circle cx="6" cy="19" r="2" />
                  <circle cx="18" cy="19" r="2" />
                </svg>{' '}
                Livraison au Sénégal : frais à confirmer
              </div>
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  <path d="m8.5 12 2.3 2.3 4.7-4.7" />
                </svg>{' '}
                Disponibilité à valider avant la commande
              </div>
              <div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.4a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3a8.5 8.5 0 0 1 8.5 8.5Z" />
                </svg>{' '}
                Assistance via le contact de la boutique
              </div>
            </div>

            <div style={{ marginTop: '31px' }}>
              <details className="disclosure" open>
                <summary>À propos de cet article</summary>
                <p id="productSpecs">{p.detail}</p>
              </details>
              <details className="disclosure">
                <summary>Livraison et commande</summary>
                <p>
                  Renseignez vos coordonnées à l’étape de commande. Un récapitulatif sera préparé pour être envoyé à la boutique. Aucun paiement n’est effectué sur ce site.
                </p>
              </details>
              <details className="disclosure">
                <summary>Guide des tailles</summary>
                <p>
                  Choisissez votre pointure ou votre taille habituelle, puis faites confirmer les mesures et disponibilités auprès de la boutique.
                </p>
              </details>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <section className="row-gap">
          <div className="section-head">
            <div>
              <p className="page-kicker">VOUS AIMEREZ AUSSI</p>
              <h2 className="serif section-title">À découvrir également</h2>
            </div>
            <Link className="small-link" href="/boutique">
              Voir la boutique{' '}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>
          </div>
          <div className="products-grid" id="relatedProducts">
            {related.map(item => (
              <article key={item.id} className="product-card">
                <Link href={`/produit?id=${item.id}`}>
                  <img src={item.img} alt={item.name} />
                </Link>
                <div className="tag">{item.label}</div>
                <Link className="name" href={`/produit?id=${item.id}`}>
                  {item.name}
                </Link>
                <div className="price">{formatPrice(item.price)}</div>
                <Link className="btn btn-outline shop" href={`/produit?id=${item.id}`}>
                  Voir le produit{' '}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14m-6-6 6 6-6 6" />
                  </svg>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </SubpageLayout>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ProductContent />
    </Suspense>
  );
}
