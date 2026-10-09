'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { PRODUCTS, PRODUCTS_BY_ID, formatPrice } from '@/data/products';

export default function HomePage() {
  const router = useRouter();
  const {
    products,
    cart,
    addToCart,
    updateQuantity,
    isFavorite,
    toggleFavorite,
    isCartOpen,
    openCart,
    closeCart,
    isSearchOpen,
    openSearch,
    closeSearch,
    totalCount,
    totalPrice,
    cartEntries,
    toastMessage,
    showToast
  } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const slides = [
    {
      eyebrow: 'NOUVELLE COLLECTION',
      top: 'Élégance',
      accent: 'au quotidien',
      desc: 'Des abayas modernes et des Crocs tendance pour un style qui vous ressemble.',
      image: '/images/hero-abaya-pink.jpg'
    },
    {
      eyebrow: 'LA COLLECTION ABAYAS',
      top: 'La beauté',
      accent: 'en toute simplicité',
      desc: 'Découvrez des pièces élégantes et confortables à porter chaque jour.',
      image: '/images/hero-abaya-pink.jpg'
    },
    {
      eyebrow: 'NOTRE UNIVERS',
      top: 'Style &',
      accent: 'douceur',
      desc: 'Des essentiels féminins sélectionnés avec soin pour vous.',
      image: '/images/hero-abaya-pink.jpg'
    }
  ];

  // Close modals on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart();
        closeSearch();
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeCart, closeSearch]);

  const searchResults = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  return (
    <div className="oumalya-home">
      {/* SVG Symbols definition */}
      <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} xmlns="http://www.w3.org/2000/svg">
        <symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" fill="none" r="7.2" stroke="currentColor" strokeWidth="1.7"></circle><path d="m16 16 5.1 5.1" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7"></path></symbol>
        <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="7.5" fill="none" r="4.2" stroke="currentColor" strokeWidth="1.7"></circle><path d="M4.8 21v-2.3c0-3.1 3.1-5.6 7.2-5.6s7.2 2.5 7.2 5.6V21" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7"></path></symbol>
        <symbol id="i-bag" viewBox="0 0 24 24"><path d="M4.5 8.3h15l1 12.8H3.5l1-12.8Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6"></path><path d="M8.2 9.7V6.2a3.8 3.8 0 0 1 7.6 0v3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6"></path></symbol>
        <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7"></path></symbol>
        <symbol id="i-back" viewBox="0 0 24 24"><path d="M20 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7"></path></symbol>
        <symbol id="i-heart" viewBox="0 0 24 24"><path d="M20.8 8.4c0-3.6-4.2-5.3-6.8-2.6L12 7.7l-2-1.9C7.4 3.1 3.2 4.8 3.2 8.4c0 3.8 3.7 6.6 8.8 10.7 5.1-4.1 8.8-6.9 8.8-10.7Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8"></path></symbol>
        <symbol id="i-truck" viewBox="0 0 24 24"><path d="M2 4h12v13H2zM14 9h4l4 5v3h-8z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6"></path><circle cx="6" cy="18" fill="white" r="2" stroke="currentColor" strokeWidth="1.6"></circle><circle cx="18.5" cy="18" fill="white" r="2" stroke="currentColor" strokeWidth="1.6"></circle></symbol>
        <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 2 4 5v7c0 5.6 3.7 8.2 8 10 4.3-1.8 8-4.4 8-10V5z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6"></path><path d="m8.2 11.9 2.6 2.6 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6"></path></symbol>
        <symbol id="i-card" viewBox="0 0 24 24"><rect fill="none" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" width="20" x="2" y="4"></rect><path d="M2 9h20M6 15h5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6"></path></symbol>
        <symbol id="i-headphones" viewBox="0 0 24 24"><path d="M3 13v-2a9 9 0 0 1 18 0v2M3 13h3v7H4a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2Zm18 0h-3v7h2a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.6"></path></symbol>
        <symbol id="i-menu" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"></path></symbol>
        <symbol id="i-close" viewBox="0 0 24 24"><path d="M5 5 19 19M19 5 5 19" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8"></path></symbol>
      </svg>

      {/* Header */}
      <header className="site-header" id="accueil">
        <button
          aria-expanded={menuOpen}
          aria-label="Ouvrir le menu"
          className="icon-btn menu-btn"
          id="menuToggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg><use href="#i-menu"></use></svg>
        </button>
        <Link aria-label="OUMALYA CLOTHING, accueil" className="brand" href="/">
          <span className="brand-name">OUMALYA</span>
          <span className="brand-sub">CLOTHING</span>
        </Link>
        <nav aria-label="Navigation principale" className={`main-nav ${menuOpen ? 'open' : ''}`} id="mainNav">
          <Link className="active" href="/" onClick={() => setMenuOpen(false)}>Accueil</Link>
          <Link href="/boutique" onClick={() => setMenuOpen(false)}>Boutique</Link>
          <Link href="/boutique?categorie=abayas" onClick={() => setMenuOpen(false)}>Abayas</Link>
          <Link href="/boutique?categorie=crocs" onClick={() => setMenuOpen(false)}>Crocs</Link>
          <Link href="/apropos" onClick={() => setMenuOpen(false)}>À propos</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
        </nav>
        <div className="header-actions">
          <button aria-label="Rechercher" className="icon-btn" id="searchToggle" onClick={openSearch}>
            <svg><use href="#i-search"></use></svg>
          </button>
          <Link aria-label="Mon compte" className="icon-btn account-btn" id="accountToggle" href="/contact">
            <svg><use href="#i-user"></use></svg>
          </Link>
          <button aria-label="Voir le panier" className="icon-btn" id="cartToggle" onClick={openCart}>
            <svg><use href="#i-bag"></use></svg>
            <span className="cart-badge" id="cartCount">{totalCount}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section aria-label="Collection OUMALYA" className="hero">
          <img
            alt="Abaya rose élégante et sac à main"
            className="hero-photo"
            fetchPriority="high"
            src={slides[currentSlide].image}
          />
          <div className="hero-content">
            <p className="eyebrow">{slides[currentSlide].eyebrow}</p>
            <h1>
              {slides[currentSlide].top} <span>{slides[currentSlide].accent}</span>
            </h1>
            <p className="hero-description">{slides[currentSlide].desc}</p>
            <Link className="pill-button" href="/boutique">
              Découvrir la collection <svg><use href="#i-arrow"></use></svg>
            </Link>
          </div>
          <button
            aria-label="Bannière précédente"
            className="slider-arrow left"
            id="prevSlide"
            onClick={() => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length)}
          >
            <svg><use href="#i-back"></use></svg>
          </button>
          <button
            aria-label="Bannière suivante"
            className="slider-arrow right"
            id="nextSlide"
            onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)}
          >
            <svg><use href="#i-arrow"></use></svg>
          </button>
          <div aria-label="Choix de la bannière" className="slider-dots">
            {slides.map((_, idx) => (
              <button
                key={idx}
                aria-current={idx === currentSlide ? 'true' : 'false'}
                aria-label={`Diapositive ${idx + 1}`}
                className={idx === currentSlide ? 'active' : ''}
                data-slide={idx}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </section>

        <div className="container">
          {/* Categories Section */}
          <section aria-label="Nos catégories" className="categories">
            <article className="category abaya" id="abayas">
              <img alt="Abaya noire fluide" className="category-photo" loading="lazy" src="/images/category-abayas.jpg" />
              <div className="category-copy">
                <h2>Abayas</h2>
                <p>Élégance, confort et modernité</p>
                <Link className="pill-button" href="/boutique?categorie=abayas">
                  Voir la collection <svg><use href="#i-arrow"></use></svg>
                </Link>
              </div>
            </article>
            <article className="category crocs" id="crocs">
              <img alt="Crocs roses décorées" className="category-photo" loading="lazy" src="/images/category-crocs.jpg" />
              <div className="category-copy">
                <h2>Crocs</h2>
                <p>Confort et style au quotidien</p>
                <Link className="pill-button" href="/boutique?categorie=crocs">
                  Voir la collection <svg><use href="#i-arrow"></use></svg>
                </Link>
              </div>
            </article>
          </section>

          {/* Benefits Section */}
          <section aria-label="Nos engagements" className="benefits" id="apropos">
            <div className="benefit">
              <svg><use href="#i-truck"></use></svg>
              <strong>Livraison rapide</strong>
              <span>Partout au Sénégal</span>
            </div>
            <div className="benefit">
              <svg><use href="#i-shield"></use></svg>
              <strong>Produits de qualité</strong>
              <span>Sélectionnés avec soin</span>
            </div>
            <div className="benefit">
              <svg><use href="#i-card"></use></svg>
              <strong>Paiement à la livraison</strong>
              <span>Simple et sécurisé</span>
            </div>
            <div className="benefit">
              <svg><use href="#i-headphones"></use></svg>
              <strong>Assistance client</strong>
              <span>Toujours à votre écoute</span>
            </div>
          </section>

          {/* New Arrivals Section */}
          <section className="new-arrivals" id="nouveautes">
            <div className="section-heading">
              <h2>Nos nouveautés</h2>
              <div className="heading-rule"></div>
              <Link className="view-all" href="/boutique" id="viewAll">
                Voir tout <svg><use href="#i-arrow"></use></svg>
              </Link>
            </div>
            <div className="product-grid">
              {products.slice(0, 8).map(p => (
                <article key={p.id} className="product-card" id={`produit-${p.id}`}>
                  <div className="product-image-wrap">
                    <Link href={`/produit?id=${p.id}`}>
                      <img alt={p.name} loading="lazy" src={p.img || p.image} />
                    </Link>
                    <button
                      aria-label={`Ajouter ${p.name} aux favoris`}
                      aria-pressed={isFavorite(p.id)}
                      className={`favorite ${isFavorite(p.id) ? 'is-favorite' : ''}`}
                      onClick={() => toggleFavorite(p.id)}
                    >
                      <svg style={{ fill: isFavorite(p.id) ? '#eb5c8e' : 'none' }}>
                        <use href="#i-heart"></use>
                      </svg>
                    </button>
                  </div>
                  <Link href={`/produit?id=${p.id}`}>
                    <p className="product-name">{p.name}</p>
                  </Link>
                  <p className="price">{formatPrice(p.price)}</p>
                  <button className="add-cart" data-product={p.id} onClick={() => addToCart(p.id)}>
                    <svg><use href="#i-bag"></use></svg>
                    Ajouter au panier
                  </button>
                </article>
              ))}
            </div>
          </section>

          {/* Promo Section */}
          <section aria-label="Notre collection Crocs" className="promo">
            <img alt="Crocs roses Hello Kitty en gros plan" className="promo-photo" loading="lazy" src="/images/promo-crocs.jpg" />
            <div className="promo-copy">
              <h2>Confort &amp; Élégance</h2>
              <p>Découvrez notre sélection de Crocs tendance pour toutes les occasions.</p>
              <Link className="pill-button" href="/boutique?categorie=crocs">
                Découvrir les Crocs <svg><use href="#i-arrow"></use></svg>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="home-footer-inner">
          <div>
            <strong>OUMALYA CLOTHING</strong>
            <p>Abayas élégantes &amp; Crocs tendance au Sénégal.</p>
          </div>
          <nav aria-label="Navigation de bas de page">
            <Link href="/boutique">Boutique</Link>
            <Link href="/apropos">À propos</Link>
            <Link href="/livraison">Livraison &amp; FAQ</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/panier">Panier</Link>
            <Link href="/favoris">Favoris</Link>
            <Link href="/admin">Admin</Link>
          </nav>
        </div>
      </footer>

      {/* Screen Overlay */}
      <div
        className={`screen-overlay ${isCartOpen || isSearchOpen ? 'open' : ''}`}
        id="overlay"
        onClick={() => {
          closeCart();
          closeSearch();
        }}
      />

      {/* Cart Drawer */}
      <aside
        aria-hidden={!isCartOpen}
        aria-label="Mon panier"
        aria-modal="true"
        className={`drawer ${isCartOpen ? 'open' : ''}`}
        id="cartDrawer"
        role="dialog"
      >
        <div className="drawer-header">
          <h2>Mon panier</h2>
          <button aria-label="Fermer le panier" className="icon-btn" id="closeCart" onClick={closeCart}>
            <svg><use href="#i-close"></use></svg>
          </button>
        </div>
        <div className="drawer-list" id="cartList">
          {cartEntries.length === 0 ? (
            <p className="empty-cart">Votre panier est vide pour le moment.</p>
          ) : (
            cartEntries.map((item, idx) => (
              <div key={`${item.p.id}-${item.size}-${idx}`} className="drawer-item">
                <img src={item.p.image} alt={item.p.name} />
                <div className="drawer-item-info">
                  <strong>{item.p.name}</strong>
                  {formatPrice(item.p.price)}
                  <div className="qty-controls">
                    <button
                      aria-label="Retirer une unité"
                      onClick={() => updateQuantity(item.p.id, item.size, -1)}
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      aria-label="Ajouter une unité"
                      onClick={() => updateQuantity(item.p.id, item.size, 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="drawer-bottom">
          <div className="cart-total">
            <span>Total</span>
            <span id="cartTotal">{formatPrice(totalPrice)}</span>
          </div>
          <button
            className="pill-button checkout"
            id="checkout"
            onClick={() => {
              if (cartEntries.length === 0) {
                showToast('Ajoutez un produit avant de commander.');
                return;
              }
              closeCart();
              router.push('/commande');
            }}
          >
            Préparer ma commande <svg><use href="#i-arrow"></use></svg>
          </button>
        </div>
      </aside>

      {/* Search Modal */}
      <section
        aria-label="Recherche de produits"
        aria-modal="true"
        className={`search-modal ${isSearchOpen ? 'open' : ''}`}
        id="searchModal"
        role="dialog"
      >
        <h2>Rechercher</h2>
        <input
          autoComplete="off"
          id="searchInput"
          placeholder="Abaya, Crocs, rose..."
          type="search"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="search-results" id="searchResults">
          {searchResults.length === 0 ? (
            <p>Aucun résultat.</p>
          ) : (
            searchResults.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  closeSearch();
                  router.push(`/produit?id=${p.id}`);
                }}
              >
                {p.name} — {formatPrice(p.price)}
              </button>
            ))
          )}
        </div>
      </section>

      {/* Toast Notification */}
      <div aria-live="polite" className={`toast ${toastMessage ? 'show' : ''}`} id="toast" role="status">
        {toastMessage}
      </div>
    </div>
  );
}
