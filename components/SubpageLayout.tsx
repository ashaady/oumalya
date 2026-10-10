'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';

interface SubpageLayoutProps {
  children: React.ReactNode;
}

export default function SubpageLayout({ children }: SubpageLayoutProps) {
  const pathname = usePathname();
  const { totalCount, toastMessage, categories } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="oumalya-subpages">
      {/* Header */}
      <header className="header">
        <button
          id="menuBtn"
          className="icon-action hamburger"
          aria-label="Ouvrir le menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <Link className="logo" href="/" aria-label="OUMALYA CLOTHING, accueil">
          <strong>OUMALYA</strong>
          <small>CLOTHING</small>
        </Link>

        <nav id="siteNav" className={`nav ${menuOpen ? 'open' : ''}`} aria-label="Menu principal">
          <Link href="/" className={pathname === '/' ? 'current' : ''} onClick={() => setMenuOpen(false)}>Accueil</Link>
          <Link href="/boutique" className={pathname === '/boutique' ? 'current' : ''} onClick={() => setMenuOpen(false)}>Boutique</Link>
          {categories.map(c => (
            <Link key={c.id} href={`/boutique?categorie=${c.id}`} onClick={() => setMenuOpen(false)}>
              {c.name}
            </Link>
          ))}
          <Link href="/apropos" className={pathname === '/apropos' ? 'current' : ''} onClick={() => setMenuOpen(false)}>À propos</Link>
          <Link href="/contact" className={pathname === '/contact' ? 'current' : ''} onClick={() => setMenuOpen(false)}>Contact</Link>
        </nav>

        <div className="header-tools">
          <Link href="/boutique" id="searchBtn" className="icon-action search-trigger" aria-label="Rechercher">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 5 5" />
            </svg>
          </Link>
          <Link href="/favoris" className="icon-action favorites-action" aria-label="Mes favoris">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </Link>
          <Link href="/panier" className="icon-action" aria-label="Voir le panier">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 8h14l1 13H4L5 8Z" />
              <path d="M9 9V6a3 3 0 0 1 6 0v3" />
            </svg>
            <span className="bubble" data-cart-count>{totalCount}</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <Link href="/" className="logo footer-brand">
                <strong>OUMALYA</strong>
                <small>CLOTHING</small>
              </Link>
              <p>Une sélection d’abayas élégantes et de Crocs tendance pour exprimer votre style en douceur.</p>
            </div>
            <div>
              <h3>La boutique</h3>
              <div className="footer-links">
                <Link href="/boutique">Tous les produits</Link>
                <Link href="/boutique?categorie=abayas">Abayas</Link>
                <Link href="/boutique?categorie=crocs">Crocs</Link>
                <Link href="/favoris">Mes favoris</Link>
              </div>
            </div>
            <div>
              <h3>Informations</h3>
              <div className="footer-links">
                <Link href="/apropos">Notre histoire</Link>
                <Link href="/livraison">Livraison &amp; FAQ</Link>
                <Link href="/contact">Nous contacter</Link>
                <Link href="/panier">Mon panier</Link>
                <Link href="/admin">Administration</Link>
              </div>
            </div>
            <div>
              <h3>Commande</h3>
              <div className="footer-links">
                <span>Sénégal · Livraison à confirmer</span>
                <span>WhatsApp : numéro à renseigner</span>
                <span>Prix indicatifs avant confirmation</span>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 OUMALYA CLOTHING. Tous droits réservés.</span>
            <span>Démo e-commerce · Commandes non transmises automatiquement</span>
          </div>
        </div>
      </footer>

      {/* Toast */}
      <div aria-live="polite" className={`toast ${toastMessage ? 'show' : ''}`} id="toast" role="status">
        {toastMessage}
      </div>
    </div>
  );
}
