'use client';

import React from 'react';
import Link from 'next/link';
import SubpageLayout from '@/components/SubpageLayout';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/data/products';

export default function CartPage() {
  const { cartEntries, totalCount, totalPrice, updateQuantity, removeFromCart } = useCart();

  return (
    <SubpageLayout>
      <div className="container">
        {/* Breadcrumbs */}
        <div className="breadcrumbs">
          <Link href="/">Accueil</Link> › <strong>Mon panier</strong>
        </div>

        {/* Section Head */}
        <div className="section-head" style={{ margin: '13px 0 24px' }}>
          <div>
            <p className="page-kicker">VOTRE SÉLECTION</p>
            <h1 className="serif page-title">
              Votre <span className="highlight">panier</span>
            </h1>
            <p>Retrouvez ici les pièces que vous aimez.</p>
          </div>
          <Link className="small-link" href="/boutique">
            ← Continuer mes achats
          </Link>
        </div>

        {/* Cart Layout */}
        <div className="cart-layout">
          <section className="card list-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '13px' }}>
              <strong style={{ fontSize: '13px' }}>Mes articles</strong>
              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
                <strong id="itemsCount">{totalCount}</strong> article(s)
              </span>
            </div>

            <div id="cartContents">
              {cartEntries.length === 0 ? (
                <div className="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 8h14l1 13H4L5 8Z" />
                    <path d="M9 9V6a3 3 0 0 1 6 0v3" />
                  </svg>
                  <h2>Votre panier est vide</h2>
                  <p>Ajoutez vos coups de cœur pour préparer votre commande.</p>
                  <Link className="btn btn-primary" href="/boutique">
                    Découvrir la boutique{' '}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14m-6-6 6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              ) : (
                cartEntries.map((item, idx) => (
                  <div key={`${item.p.id}-${item.size}-${idx}`} className="cart-row">
                    <Link href={`/produit?id=${item.p.id}`}>
                      <img alt={item.p.name} src={item.p.img} />
                    </Link>
                    <div>
                      <div className="item-meta">{item.p.label}</div>
                      <Link href={`/produit?id=${item.p.id}`}>
                        <h3>{item.p.name}</h3>
                      </Link>
                      <div className="line-sub">
                        {item.size === 'default' ? 'Taille à confirmer' : `Taille : ${item.size}`} · {item.p.color}
                      </div>
                      <div className="mini-qty">
                        <button
                          aria-label="Réduire la quantité"
                          type="button"
                          onClick={() => updateQuantity(item.p.id, item.size, -1)}
                        >
                          −
                        </button>
                        <span>{item.qty}</span>
                        <button
                          aria-label="Augmenter la quantité"
                          type="button"
                          onClick={() => updateQuantity(item.p.id, item.size, 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="cart-remove"
                        type="button"
                        onClick={() => removeFromCart(item.p.id, item.size)}
                      >
                        Supprimer
                      </button>
                    </div>
                    <span className="line-price">{formatPrice(item.qty * item.p.price)}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="card summary-box">
            <h2>Récapitulatif</h2>
            <div className="summary-line">
              <span>Sous-total</span>
              <strong id="subtotal">{formatPrice(totalPrice)}</strong>
            </div>
            <div className="summary-line">
              <span>Livraison</span>
              <span>À confirmer</span>
            </div>
            <div className="summary-line total">
              <span>Total articles</span>
              <strong id="cartTotal">{formatPrice(totalPrice)}</strong>
            </div>

            <Link
              href={cartEntries.length ? '/commande' : '#'}
              className="btn btn-primary"
              id="cartProceed"
              style={{
                pointerEvents: cartEntries.length ? 'auto' : 'none',
                opacity: cartEntries.length ? 1 : 0.55
              }}
              aria-disabled={!cartEntries.length}
            >
              Passer commande{' '}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14m-6-6 6 6-6 6" />
              </svg>
            </Link>

            <p className="summary-notice">
              Aucun paiement n’est effectué ici. Les frais de livraison et la disponibilité seront confirmés par la boutique.
            </p>
          </aside>
        </div>

        {/* Feature Strip */}
        <div className="feature-strip">
          <div className="feature">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14l1 13H4L5 8Z" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            <span>
              <strong>Pièces sélectionnées</strong>
              <small>Collection OUMALYA</small>
            </span>
          </div>
          <div className="feature">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 2h4l2 5-3 2a14 14 0 0 0 6 6l2-3 5 2v4c0 2-2 4-4 4A18 18 0 0 1 2 6c0-2 2-4 4-4Z" />
            </svg>
            <span>
              <strong>Commande simplifiée</strong>
              <small>En quelques étapes</small>
            </span>
          </div>
          <div className="feature">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
              <path d="m8.5 12 2.3 2.3 4.7-4.7" />
            </svg>
            <span>
              <strong>Sans paiement en ligne</strong>
              <small>Validation manuelle</small>
            </span>
          </div>
        </div>
      </div>
    </SubpageLayout>
  );
}
