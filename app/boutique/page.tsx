'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { PRODUCTS, Product, formatPrice } from '@/data/products';

function BoutiqueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    products,
    cart,
    addToCart,
    updateQuantity,
    isFavorite,
    toggleFavorite,
    favorites,
    isCartOpen,
    openCart,
    closeCart,
    totalCount,
    totalPrice,
    cartEntries,
    toastMessage,
    showToast
  } = useCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('default');

  // Quick view modal state
  const [modalProduct, setModalProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  // Sync category with URL search param (?categorie=abayas, etc.)
  useEffect(() => {
    const cat = searchParams.get('categorie');
    if (cat === 'abayas' || cat === 'crocs') {
      setCategory(cat);
    } else {
      setCategory('all');
    }
  }, [searchParams]);

  const selectCategory = (val: string, scroll = false) => {
    setCategory(val);
    if (scroll) {
      document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const filteredProducts = useMemo(() => {
    let list = products.filter(p => {
      const matchesCat =
        category === 'all' ||
        (category === 'favorites' && favorites[p.id]) ||
        category === p.category;

      const normQuery = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normName = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchesQuery = normName.includes(normQuery);

      return matchesCat && matchesQuery;
    });

    if (sort === 'price-up') {
      list.sort((a, b) => a.price - b.price || a.order - b.order);
    } else if (sort === 'price-down') {
      list.sort((a, b) => b.price - a.price || a.order - b.order);
    } else if (sort === 'name') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    }

    return list;
  }, [products, category, query, sort, favorites]);

  const openQuick = (p: Product) => {
    setModalProduct(p);
    setSelectedSize(null);
  };

  const closeQuick = () => {
    setModalProduct(null);
    setSelectedSize(null);
  };

  const handleModalAdd = () => {
    if (!modalProduct) return;
    if (!selectedSize) {
      showToast('Choisissez une taille pour continuer');
      return;
    }
    addToCart(modalProduct.id, selectedSize);
    closeQuick();
    openCart();
  };

  // Close modals on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeCart();
        closeQuick();
        setMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeCart]);

  return (
    <div className="oumalya-boutique">
      {/* SVG symbols */}
      <svg aria-hidden="true" height="0" style={{ position: 'absolute', overflow: 'hidden' }} width="0">
        <defs>
          <symbol id="ico-search" viewBox="0 0 24 24"><circle cx="10.7" cy="10.7" r="7.5"></circle><path d="m16.3 16.3 5 5"></path></symbol>
          <symbol id="ico-bag" viewBox="0 0 24 24"><path d="M4.2 8.5h15.6l1 12H3.2z"></path><path d="M8 9V6a4 4 0 0 1 8 0v3"></path></symbol>
          <symbol id="ico-heart" viewBox="0 0 24 24"><path d="M20.4 8.6c0-4.1-4.8-5.9-7.7-2.7L12 6.6l-.7-.7c-2.9-3.2-7.7-1.4-7.7 2.7 0 4.1 4.1 7.2 8.4 10.5 4.3-3.3 8.4-6.4 8.4-10.5Z"></path></symbol>
          <symbol id="ico-right" viewBox="0 0 24 24"><path d="M4 12h16M13 5l7 7-7 7"></path></symbol>
          <symbol id="ico-close" viewBox="0 0 24 24"><path d="M5 5 19 19M19 5 5 19"></path></symbol>
          <symbol id="ico-menu" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"></path></symbol>
          <symbol id="ico-user" viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="4.2"></circle><path d="M4.8 21v-2.3c0-3.1 3.1-5.6 7.2-5.6s7.2 2.5 7.2 5.6V21"></path></symbol>
          <symbol id="ico-right-small" viewBox="0 0 24 24"><path d="m8 4 8 8-8 8"></path></symbol>
        </defs>
      </svg>

      {/* Header */}
      <header className="site-header" id="top">
        <button
          aria-expanded={menuOpen}
          aria-label="Ouvrir la navigation"
          className="iconbtn menu-trigger"
          id="menuToggle"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg><use href="#ico-menu"></use></svg>
        </button>
        <Link aria-label="OUMALYA CLOTHING — accueil" className="brand" href="/">
          <strong>OUMALYA</strong>
          <small>CLOTHING</small>
        </Link>
        <nav aria-label="Navigation principale" className={`nav ${menuOpen ? 'open' : ''}`} id="mainNav">
          <Link href="/" onClick={() => setMenuOpen(false)}>Accueil</Link>
          <Link className="active" href="/boutique" onClick={() => setMenuOpen(false)}>Boutique</Link>
          <button
            type="button"
            className={category === 'abayas' ? 'active' : ''}
            style={{ background: 'none', border: 'none', font: 'inherit', padding: 0, cursor: 'pointer', color: 'inherit' }}
            onClick={() => { selectCategory('abayas', true); setMenuOpen(false); }}
          >
            Abayas
          </button>
          <button
            type="button"
            className={category === 'crocs' ? 'active' : ''}
            style={{ background: 'none', border: 'none', font: 'inherit', padding: 0, cursor: 'pointer', color: 'inherit' }}
            onClick={() => { selectCategory('crocs', true); setMenuOpen(false); }}
          >
            Crocs
          </button>
          <Link href="/apropos" onClick={() => setMenuOpen(false)}>À propos</Link>
          <Link href="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
        </nav>
        <div className="actions">
          <button
            aria-label="Rechercher"
            className="iconbtn"
            id="searchToggle"
            onClick={() => {
              document.getElementById('catalogue')?.scrollIntoView({ behavior: 'smooth' });
              document.getElementById('productSearch')?.focus();
            }}
          >
            <svg><use href="#ico-search"></use></svg>
          </button>
          <Link aria-label="Contacter la boutique" className="iconbtn account-link" href="/contact">
            <svg><use href="#ico-user"></use></svg>
          </Link>
          <button aria-label="Voir le panier" className="iconbtn" id="cartToggle" onClick={openCart}>
            <svg><use href="#ico-bag"></use></svg>
            <span className="counter" id="cartCount">{totalCount}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Accueil</Link>
            <svg><use href="#ico-right-small"></use></svg>
            <strong>Boutique</strong>
          </div>

          <section aria-labelledby="shopTitle" className="shop-hero">
            <div className="hero-copy">
              <p className="kicker">LA COLLECTION OUMALYA</p>
              <h1 id="shopTitle">
                Trouvez votre<br />
                <em>coup de cœur.</em>
              </h1>
              <p className="subtitle">
                Une sélection d&apos;abayas élégantes et de Crocs tendance, pensées pour vous.
              </p>
              <a className="small-link" href="#catalogue">
                Explorer la boutique <svg><use href="#ico-right"></use></svg>
              </a>
            </div>
            <img
              alt="Présentation d'une abaya rose élégante"
              className="hero-figure"
              src="/images/hero-abaya-pink.jpg"
            />
            <div className="hero-floating">
              <img alt="Crocs roses décorées" src="/images/product-crocs-rose.jpg" />
            </div>
            <div className="hero-sticker">
              Style &amp;<br />douceur ✳
            </div>
          </section>

          <section aria-label="Choisir une collection">
            <div className="category-row">
              <div>
                <h2>À chaque envie, son style</h2>
                <p>Découvrez nos deux univers.</p>
              </div>
              <div className="category-cards">
                <button
                  aria-pressed={category === 'abayas'}
                  className={`category-mini ${category === 'abayas' ? 'active' : ''}`}
                  data-category="abayas"
                  type="button"
                  onClick={() => selectCategory('abayas', true)}
                >
                  <img alt="Abayas" src="/images/category-abayas.jpg" />
                  Abayas <small>{products.filter(p => p.category === 'abayas').length.toString().padStart(2, '0')}</small>
                </button>
                <button
                  aria-pressed={category === 'crocs'}
                  className={`category-mini ${category === 'crocs' ? 'active' : ''}`}
                  data-category="crocs"
                  type="button"
                  onClick={() => selectCategory('crocs', true)}
                >
                  <img alt="Crocs" src="/images/category-crocs.jpg" />
                  Crocs <small>{products.filter(p => p.category === 'crocs').length.toString().padStart(2, '0')}</small>
                </button>
              </div>
            </div>
          </section>

          <section aria-label="Notre catalogue" id="catalogue">
            <div className="catalog-heading">
              <div>
                <h2>La boutique</h2>
                <p>Nos pièces sélectionnées avec soin pour votre dressing.</p>
              </div>
              <div className="catalog-controls">
                <div className="search-box">
                  <svg><use href="#ico-search"></use></svg>
                  <input
                    autoComplete="off"
                    id="productSearch"
                    placeholder="Rechercher abaya, crocs, rose..."
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                </div>
                <label className="sort-label">
                  <select
                    aria-label="Trier les produits"
                    className="sort-select"
                    id="sortBy"
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                  >
                    <option value="default">Trier par : vedettes</option>
                    <option value="price-up">Prix : croissant</option>
                    <option value="price-down">Prix : décroissant</option>
                    <option value="name">Nom : A → Z</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="filter-bar">
              <div aria-label="Filtrer par catégorie" className="filter-options" role="group">
                <button
                  aria-pressed={category === 'all'}
                  className={`filter-chip ${category === 'all' ? 'active' : ''}`}
                  data-category="all"
                  onClick={() => selectCategory('all')}
                >
                  Tout voir
                </button>
                <button
                  aria-pressed={category === 'abayas'}
                  className={`filter-chip ${category === 'abayas' ? 'active' : ''}`}
                  data-category="abayas"
                  onClick={() => selectCategory('abayas')}
                >
                  Abayas
                </button>
                <button
                  aria-pressed={category === 'crocs'}
                  className={`filter-chip ${category === 'crocs' ? 'active' : ''}`}
                  data-category="crocs"
                  onClick={() => selectCategory('crocs')}
                >
                  Crocs
                </button>
                <button
                  aria-pressed={category === 'favorites'}
                  className={`filter-chip ${category === 'favorites' ? 'active' : ''}`}
                  data-category="favorites"
                  onClick={() => selectCategory('favorites')}
                >
                  ♡ Favoris
                </button>
              </div>
              <span className="result-count" id="resultCount">
                {filteredProducts.length} produit{filteredProducts.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div aria-live="polite" className="product-grid" id="productsGrid">
              {filteredProducts.length === 0 ? (
                <div className="empty-state">
                  <h3>Aucun article trouvé</h3>
                  <p>Essayez un autre mot-clé ou une autre catégorie.</p>
                  <button
                    className="pinkbtn"
                    id="clearFilters"
                    onClick={() => {
                      setQuery('');
                      selectCategory('all');
                    }}
                  >
                    Voir tous les produits
                  </button>
                </div>
              ) : (
                filteredProducts.map(p => (
                  <article key={p.id} className="product-card">
                    <div className="picture">
                      <Link href={`/produit?id=${p.id}`} className="product-pic-link">
                        <img src={p.img} alt={p.name} loading="lazy" />
                      </Link>
                      <span className="product-badge">{p.badge}</span>
                      <button
                        aria-label={`Favoris : ${p.name}`}
                        aria-pressed={isFavorite(p.id)}
                        className={`wishlist ${isFavorite(p.id) ? 'on' : ''}`}
                        data-fav={p.id}
                        onClick={() => toggleFavorite(p.id)}
                      >
                        <svg><use href="#ico-heart"></use></svg>
                      </button>
                      <button
                        className="quick-btn"
                        data-quick={p.id}
                        onClick={() => openQuick(p)}
                      >
                        Aperçu rapide
                      </button>
                    </div>
                    <div className="product-body">
                      <div className="product-meta">{p.catLabel}</div>
                      <h3 className="product-name">
                        <Link href={`/produit?id=${p.id}`}>{p.name}</Link>
                      </h3>
                      <p className="price">{formatPrice(p.price)}</p>
                      <div className="swatches">
                        <i
                          className={`swatch ${p.color === 'Rose' ? 'pink' : p.color === 'Taupe' ? 'taupe' : 'black'}`}
                          aria-label={`Couleur ${p.color}`}
                          title={p.color}
                        />
                      </div>
                      <button
                        className="product-action"
                        data-add={p.id}
                        onClick={() => openQuick(p)}
                      >
                        <svg><use href="#ico-bag"></use></svg> Ajouter au panier
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <p className="art-note">
              * Prix indicatifs et photographies d&apos;abayas illustratives, à remplacer par les articles réels de la boutique.
            </p>
          </section>

          <section className="promo" id="apropos">
            <div className="promo-content">
              <p className="kicker">OUMALYA CLOTHING</p>
              <h2>Un style qui<br />vous ressemble.</h2>
              <p>
                Entre douceur, simplicité et modernité, trouvez les pièces qui vous accompagnent au quotidien.
              </p>
              <a className="small-link" href="#catalogue">
                Découvrir la sélection <svg><use href="#ico-right"></use></svg>
              </a>
            </div>
            <img
              alt="Collection de Crocs roses décorées"
              className="promo-pic"
              src="/images/promo-crocs.jpg"
            />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer" id="contact">
        <div className="container">
          <div className="footer-inner">
            <div>
              <Link className="brand footer-brand" href="/">
                <strong>OUMALYA</strong>
                <small>CLOTHING</small>
              </Link>
              <p>
                Abayas élégantes &amp; Crocs tendance. Une boutique pensée pour celles qui aiment se démarquer en douceur.
              </p>
            </div>
            <div>
              <h3>Navigation</h3>
              <div className="footer-links">
                <Link href="/">Accueil</Link>
                <Link href="/boutique">Boutique</Link>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'left', padding: 0, font: 'inherit', cursor: 'pointer' }}
                  onClick={() => selectCategory('abayas', true)}
                >
                  Abayas
                </button>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'inherit', textAlign: 'left', padding: 0, font: 'inherit', cursor: 'pointer' }}
                  onClick={() => selectCategory('crocs', true)}
                >
                  Crocs
                </button>
              </div>
            </div>
            <div>
              <h3>Informations</h3>
              <div className="footer-links">
                <span>Contact WhatsApp : à renseigner</span>
                <span>Livraison : à confirmer</span>
                <span>Paiement : à confirmer</span>
              </div>
            </div>
            <div>
              <h3>Assistance</h3>
              <div className="footer-links">
                <Link href="/livraison">Livraison &amp; FAQ</Link>
                <Link href="/panier">Mon panier</Link>
                <Link href="/favoris">Mes favoris</Link>
                <Link href="/contact">Contact</Link>
                <Link href="/admin">Administration</Link>
              </div>
            </div>
          </div>
          <div className="footer-end">
            <span>© 2026 OUMALYA CLOTHING. Tous droits réservés.</span>
            <span>Créé avec soin ♡</span>
          </div>
        </div>
      </footer>

      {/* Screen Overlay */}
      <div
        className={`overlay ${isCartOpen || !!modalProduct ? 'open' : ''}`}
        id="overlay"
        onClick={() => {
          closeCart();
          closeQuick();
        }}
      />

      {/* Cart Drawer */}
      <aside
        aria-hidden={!isCartOpen}
        aria-label="Mon panier"
        aria-modal="true"
        className={`cart-panel ${isCartOpen ? 'open' : ''}`}
        id="cartPanel"
        role="dialog"
      >
        <div className="cart-header">
          <h2>Mon panier</h2>
          <button aria-label="Fermer le panier" className="iconbtn" id="closeCart" onClick={closeCart}>
            <svg><use href="#ico-close"></use></svg>
          </button>
        </div>
        <div className="cart-lines" id="cartLines">
          {cartEntries.length === 0 ? (
            <div className="cart-empty">
              <svg><use href="#ico-bag"></use></svg>
              <p>Votre panier attend vos coups de cœur ♡</p>
            </div>
          ) : (
            cartEntries.map((item, idx) => (
              <div key={`${item.p.id}-${item.size}-${idx}`} className="cart-line">
                <img src={item.p.img} alt={item.p.name} />
                <div className="line-text">
                  <strong>{item.p.name}</strong>
                  <small>{formatPrice(item.p.price)}</small>
                  <span className="variant">
                    {item.size === 'default' ? 'Taille à confirmer' : `Taille : ${item.size}`}
                  </span>
                  <div className="stepper">
                    <button
                      aria-label="Diminuer"
                      onClick={() => updateQuantity(item.p.id, item.size, -1)}
                    >
                      −
                    </button>
                    <span>{item.qty}</span>
                    <button
                      aria-label="Augmenter"
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
        <div className="cart-footer">
          <div className="cart-total">
            <span>Total</span>
            <span id="cartTotal">{formatPrice(totalPrice)}</span>
          </div>
          <button
            className="pinkbtn cart-checkout"
            id="checkout"
            onClick={() => {
              if (cartEntries.length === 0) {
                showToast('Votre panier est vide');
                return;
              }
              closeCart();
              router.push('/commande');
            }}
          >
            Passer la commande <svg><use href="#ico-right"></use></svg>
          </button>
        </div>
      </aside>

      {/* Quick View Modal */}
      <aside
        aria-hidden={!modalProduct}
        aria-label="Aperçu rapide"
        aria-modal="true"
        className={`quick-modal ${modalProduct ? 'open' : ''}`}
        id="quickModal"
        role="dialog"
      >
        {modalProduct && (
          <div className="modal-dialog">
            <button aria-label="Fermer l'aperçu" className="modal-close" id="closeModal" onClick={closeQuick}>
              <svg><use href="#ico-close"></use></svg>
            </button>
            <div className="modal-figure">
              <img id="modalImage" src={modalProduct.img} alt={modalProduct.name} />
            </div>
            <div className="modal-body">
              <span className="product-meta" id="modalCategory">{modalProduct.catLabel}</span>
              <h2 id="modalTitle">{modalProduct.name}</h2>
              <p className="price" id="modalPrice">{formatPrice(modalProduct.price)}</p>
              <p className="modal-desc" id="modalDescription">{modalProduct.description}</p>
              <div className="modal-options">
                <label>Sélectionner la taille / pointure</label>
                <div className="sizes" id="sizes">
                  {modalProduct.sizes.map(size => (
                    <button
                      key={size}
                      type="button"
                      className={selectedSize === size ? 'selected' : ''}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <button className="pinkbtn add-btn" id="modalAdd" onClick={handleModalAdd}>
                <svg><use href="#ico-bag"></use></svg> Ajouter au panier
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Toast Notification */}
      <div aria-live="polite" className={`toast ${toastMessage ? 'show' : ''}`} id="toast" role="status">
        {toastMessage}
      </div>
    </div>
  );
}

export default function BoutiquePage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <BoutiqueContent />
    </Suspense>
  );
}
