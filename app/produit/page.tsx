'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import SubpageLayout from '@/components/SubpageLayout';
import { useCart } from '@/context/CartContext';
import { PRODUCTS, PRODUCTS_BY_ID, formatPrice, getProductImages } from '@/data/products';

function ProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id') || 'crocs-rose';
  const { products, productsById, addToCart, isFavorite, toggleFavorite, showToast } = useCart();
  const p = productsById[id] || products.find(x => x.id === id) || products[0];

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);

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
            {(() => {
              const productImages = getProductImages(p);
              const hasMultiple = productImages.length > 1;
              const activeImg = productImages[activeImgIndex] || p.img;

              return (
                <>
                  <div className="gallery-main" style={{ position: 'relative', overflow: 'hidden' }}>
                    <img id="productImage" alt={p.name} src={activeImg} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <span className="gallery-tag" id="productBadge">{p.badges}</span>

                    {hasMultiple && (
                      <>
                        {/* Flèche Gauche */}
                        <button
                          type="button"
                          aria-label="Photo précédente"
                          onClick={() => setActiveImgIndex(prev => (prev > 0 ? prev - 1 : productImages.length - 1))}
                          style={{
                            position: 'absolute',
                            left: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.94)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
                            border: '1.5px solid rgba(235, 92, 142, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '26px',
                            lineHeight: 1,
                            color: '#120e10',
                            zIndex: 4,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          ‹
                        </button>

                        {/* Flèche Droite */}
                        <button
                          type="button"
                          aria-label="Photo suivante"
                          onClick={() => setActiveImgIndex(prev => (prev < productImages.length - 1 ? prev + 1 : 0))}
                          style={{
                            position: 'absolute',
                            right: '14px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '44px',
                            height: '44px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.94)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
                            border: '1.5px solid rgba(235, 92, 142, 0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '26px',
                            lineHeight: 1,
                            color: '#120e10',
                            zIndex: 4,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          ›
                        </button>

                        {/* Compteur */}
                        <div
                          style={{
                            position: 'absolute',
                            top: '14px',
                            left: '14px',
                            background: 'rgba(18, 14, 16, 0.72)',
                            color: '#ffffff',
                            padding: '4px 10px',
                            borderRadius: '100px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backdropFilter: 'blur(6px)',
                            zIndex: 3
                          }}
                        >
                          {activeImgIndex + 1} / {productImages.length}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Vignettes (Thumbs) */}
                  <div className="thumbs" style={{ display: 'flex', gap: '8px', marginTop: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {productImages.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        className={`thumb ${activeImgIndex === idx ? 'selected' : ''}`}
                        type="button"
                        aria-label={`Photo ${idx + 1}`}
                        onClick={() => setActiveImgIndex(idx)}
                        style={{
                          border: activeImgIndex === idx ? '2px solid var(--pink)' : '1px solid #ede5e8',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          padding: 0,
                          width: '68px',
                          height: '68px',
                          flexShrink: 0,
                          cursor: 'pointer',
                          background: '#fcf8fa',
                          boxShadow: activeImgIndex === idx ? '0 0 0 2px rgba(235, 92, 142, 0.25)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <img src={imgUrl} alt={`Aperçu ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}
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
