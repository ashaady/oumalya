'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product, formatPrice } from '@/data/products';

export default function AdminPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    resetProducts,
    showToast
  } = useCart();

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Filtering & search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'abayas' | 'crocs'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete confirmation
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: 'abayas' as 'abayas' | 'crocs',
    price: 25000,
    color: 'Noir',
    badge: 'Nouveauté',
    sizesText: 'S, M, L, XL',
    desc: '',
    detail: '',
    img: '/images/hero-abaya-pink.jpg'
  });

  // Check existing session
  useEffect(() => {
    try {
      const savedAuth = sessionStorage.getItem('oumalya_admin_auth');
      if (savedAuth === 'true') {
        setIsAuthenticated(true);
      }
    } catch {}
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default passcode: "oumalya" or "admin"
    if (passcode.trim().toLowerCase() === 'oumalya' || passcode.trim() === 'admin' || passcode.trim() === '2026') {
      setIsAuthenticated(true);
      setAuthError('');
      try {
        sessionStorage.setItem('oumalya_admin_auth', 'true');
      } catch {}
      showToast('Connexion à l\'administration réussie');
    } else {
      setAuthError('Code d\'accès incorrect. (Indice par défaut : "oumalya")');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('oumalya_admin_auth');
    } catch {}
    showToast('Déconnexion effectuée');
  };

  // Open Create Modal
  const openCreateModal = () => {
    setModalMode('create');
    setEditingProduct(null);
    setFormData({
      id: '',
      name: '',
      category: 'abayas',
      price: 25000,
      color: 'Noir',
      badge: 'Nouveauté',
      sizesText: 'S, M, L, XL',
      desc: '',
      detail: 'Photographie illustrative. Matière, coupe exacte et tailles disponibles à confirmer avant la commande.',
      img: '/images/category-abayas.jpg'
    });
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    setModalMode('edit');
    setEditingProduct(p);
    setFormData({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      color: p.color,
      badge: p.badge || p.badges || 'Nouveauté',
      sizesText: Array.isArray(p.sizes) ? p.sizes.join(', ') : '',
      desc: p.desc || p.description || '',
      detail: p.detail || '',
      img: p.img || p.image || '/images/hero-abaya-pink.jpg'
    });
    setIsModalOpen(true);
  };

  // Handle Image Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      });

      const json = await res.json();
      if (json.success && json.url) {
        setFormData(prev => ({ ...prev, img: json.url }));
        showToast('Image téléchargée avec succès !');
      } else {
        showToast(json.error || 'Erreur lors du téléchargement');
      }
    } catch (err) {
      console.error(err);
      showToast('Échec de l\'envoi du fichier');
    } finally {
      setIsUploading(false);
    }
  };

  // Save product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Veuillez renseigner le nom du produit');
      return;
    }

    setIsSaving(true);
    const parsedSizes = formData.sizesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const productPayload = {
      id: formData.id,
      name: formData.name.trim(),
      category: formData.category,
      cat: formData.category,
      label: formData.category === 'crocs' ? 'CROCS · COLLECTION' : 'ABAYAS · COLLECTION',
      catLabel: formData.category === 'crocs' ? 'CROCS · COLLECTION' : 'ABAYAS · COLLECTION',
      price: Number(formData.price) || 0,
      color: formData.color.trim() || 'Noir',
      badge: formData.badge,
      badges: formData.badge,
      sizes: parsedSizes.length ? parsedSizes : (formData.category === 'crocs' ? ['36', '37', '38', '39', '40'] : ['S', 'M', 'L', 'XL']),
      desc: formData.desc.trim(),
      description: formData.desc.trim(),
      detail: formData.detail.trim(),
      img: formData.img,
      image: formData.img
    };

    if (modalMode === 'create') {
      await addProduct(productPayload);
    } else {
      await updateProduct(productPayload as Product);
    }

    setIsSaving(false);
    setIsModalOpen(false);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    await deleteProduct(deletingProduct.id);
    setDeletingProduct(null);
  };

  // Filtered products list
  const filteredList = useMemo(() => {
    return products.filter(p => {
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.price.toString().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, categoryFilter, search]);

  // Statistics
  const stats = useMemo(() => {
    const total = products.length;
    const abayas = products.filter(p => p.category === 'abayas').length;
    const crocs = products.filter(p => p.category === 'crocs').length;
    const avgPrice = total > 0 ? Math.round(products.reduce((acc, p) => acc + p.price, 0) / total) : 0;
    return { total, abayas, crocs, avgPrice };
  }, [products]);

  // Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="oumalya-admin">
        <header className="admin-header">
          <div className="admin-header-inner">
            <div className="admin-brand">
              <span className="admin-brand-title">OUMALYA CLOTHING</span>
              <span className="admin-badge">Administration</span>
            </div>
            <Link href="/" className="btn btn-outline btn-sm">
              ← Retour au site
            </Link>
          </div>
        </header>

        <main className="admin-container">
          <div className="login-card">
            <div className="login-logo">OUMALYA</div>
            <div className="login-sub">GESTION DE LA BOUTIQUE</div>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px' }}>
              Veuillez entrer votre code d&apos;accès administrateur pour gérer le catalogue et les produits.
            </p>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <input
                  type="password"
                  className="form-input"
                  placeholder="Code d'accès (ex : oumalya)"
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  autoFocus
                />
              </div>

              {authError && (
                <p style={{ color: '#d82b4f', fontSize: '12px', margin: '-8px 0 16px', fontWeight: 600 }}>
                  {authError}
                </p>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Déverrouiller l&apos;espace admin
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="oumalya-admin">
      {/* Admin Header */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-brand">
            <span className="admin-brand-title">OUMALYA CLOTHING</span>
            <span className="admin-badge">Admin</span>
          </div>

          <div className="admin-nav-actions">
            <Link href="/boutique" className="btn btn-outline btn-sm" target="_blank">
              👁️ Voir la boutique
            </Link>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => {
                if (window.confirm('Voulez-vous restaurer les 4 produits de démonstration d\'origine ?')) {
                  resetProducts();
                }
              }}
              title="Restaurer les produits par défaut"
            >
              🔄 Réinitialiser démo
            </button>
            <button type="button" className="btn btn-outline btn-sm" onClick={handleLogout}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="admin-container">
        {/* Dashboard Hero */}
        <div className="dashboard-hero">
          <div>
            <h1>Gestion du Catalogue</h1>
            <p>Ajoutez, modifiez ou mettez à jour les photos et prix de vos produits en temps réel.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span> Ajouter un produit
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <small>Total Produits</small>
            <div className="stat-val accent">{stats.total}</div>
          </div>
          <div className="stat-card">
            <small>Collection Abayas</small>
            <div className="stat-val">{stats.abayas}</div>
          </div>
          <div className="stat-card">
            <small>Collection Crocs</small>
            <div className="stat-val">{stats.crocs}</div>
          </div>
          <div className="stat-card">
            <small>Prix Moyen</small>
            <div className="stat-val">{formatPrice(stats.avgPrice)}</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="catalog-toolbar">
          <div className="search-input-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              className="search-input"
              placeholder="Rechercher par nom, couleur, prix..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button
              type="button"
              className={`filter-tab ${categoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              Tous ({products.length})
            </button>
            <button
              type="button"
              className={`filter-tab ${categoryFilter === 'abayas' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('abayas')}
            >
              Abayas ({stats.abayas})
            </button>
            <button
              type="button"
              className={`filter-tab ${categoryFilter === 'crocs' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('crocs')}
            >
              Crocs ({stats.crocs})
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="products-table-wrap">
          <table className="products-table">
            <thead>
              <tr>
                <th>Produit & Photo</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Pointures / Tailles</th>
                <th>Badge</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                    Aucun produit trouvé dans cette sélection.
                  </td>
                </tr>
              ) : (
                filteredList.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="product-thumb-cell">
                        <img
                          src={p.img || p.image}
                          alt={p.name}
                          className="table-thumb"
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/images/hero-abaya-pink.jpg';
                          }}
                        />
                        <div className="table-product-info">
                          <strong>{p.name}</strong>
                          <small>Couleur : {p.color} · Réf : {p.id}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`category-pill ${p.category}`}>
                        {p.category === 'crocs' ? 'Crocs' : 'Abaya'}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: 'var(--pink)', fontSize: '14px' }}>
                        {formatPrice(p.price)}
                      </strong>
                    </td>
                    <td>
                      <div className="size-tags">
                        {Array.isArray(p.sizes) ? (
                          p.sizes.map(s => (
                            <span key={s} className="size-tag">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="size-tag">Standard</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="tag-badge">{p.badge || p.badges || '—'}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <Link
                          href={`/produit?id=${p.id}`}
                          className="btn btn-outline btn-sm btn-icon"
                          title="Voir la fiche produit"
                          target="_blank"
                        >
                          👁️
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => openEditModal(p)}
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => setDeletingProduct(p)}
                          title="Supprimer ce produit"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal: Create / Edit Product */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === 'create' ? 'Ajouter un nouveau produit' : `Modifier : ${editingProduct?.name}`}</h2>
              <button
                type="button"
                className="btn btn-outline btn-sm btn-icon"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                {/* Image Section */}
                <div className="form-group full">
                  <label className="form-label">
                    Photo du produit <span className="req">*</span>
                  </label>
                  <div className="image-uploader">
                    <img
                      src={formData.img}
                      alt="Aperçu"
                      className="image-preview"
                      onError={e => {
                        (e.target as HTMLImageElement).src = '/images/hero-abaya-pink.jpg';
                      }}
                    />
                    <div className="upload-controls">
                      <div style={{ marginBottom: '10px' }}>
                        <label className="btn btn-primary btn-sm file-input-btn">
                          {isUploading ? 'Téléchargement...' : '📁 Choisir une photo depuis mon appareil'}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            disabled={isUploading}
                            onChange={handleFileUpload}
                          />
                        </label>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 10px' }}>
                        Formats acceptés : JPG, PNG, WEBP. L&apos;image est automatiquement enregistrée et optimisée.
                      </p>
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                          Ou chemin / URL personnalisée :
                        </span>
                        <input
                          type="text"
                          className="form-input"
                          style={{ marginTop: '4px' }}
                          value={formData.img}
                          onChange={e => setFormData({ ...formData, img: e.target.value })}
                          placeholder="/images/nom-photo.jpg ou URL web"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-grid">
                  {/* Name */}
                  <div className="form-group">
                    <label className="form-label">
                      Nom du produit <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="Ex : Abaya Soie de Médine Rose"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Category */}
                  <div className="form-group">
                    <label className="form-label">
                      Catégorie <span className="req">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={formData.category}
                      onChange={e => {
                        const newCat = e.target.value as 'abayas' | 'crocs';
                        setFormData({
                          ...formData,
                          category: newCat,
                          sizesText: newCat === 'crocs' ? '36, 37, 38, 39, 40, 41' : 'S, M, L, XL'
                        });
                      }}
                    >
                      <option value="abayas">Abayas</option>
                      <option value="crocs">Crocs</option>
                    </select>
                  </div>

                  {/* Price */}
                  <div className="form-group">
                    <label className="form-label">
                      Prix (en Francs CFA) <span className="req">*</span>
                    </label>
                    <input
                      type="number"
                      step="500"
                      min="0"
                      className="form-input"
                      required
                      placeholder="Ex : 25000"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>

                  {/* Color */}
                  <div className="form-group">
                    <label className="form-label">Couleur principale</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex : Noir, Rose poudré, Taupe..."
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                    />
                  </div>

                  {/* Badge */}
                  <div className="form-group">
                    <label className="form-label">Badge promotionnel</label>
                    <select
                      className="form-select"
                      value={formData.badge}
                      onChange={e => setFormData({ ...formData, badge: e.target.value })}
                    >
                      <option value="Nouveauté">Nouveauté</option>
                      <option value="Coup de cœur">Coup de cœur</option>
                      <option value="Best-seller">Best-seller</option>
                      <option value="Élégance">Élégance</option>
                      <option value="Édition limitée">Édition limitée</option>
                    </select>
                  </div>

                  {/* Sizes */}
                  <div className="form-group">
                    <label className="form-label">
                      Tailles / Pointures (séparées par une virgule)
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex : S, M, L, XL ou 36, 37, 38, 39"
                      value={formData.sizesText}
                      onChange={e => setFormData({ ...formData, sizesText: e.target.value })}
                    />
                  </div>

                  {/* Short Description */}
                  <div className="form-group full">
                    <label className="form-label">Description courte</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Phrase de présentation du modèle..."
                      value={formData.desc}
                      onChange={e => setFormData({ ...formData, desc: e.target.value })}
                    />
                  </div>

                  {/* Detail */}
                  <div className="form-group full">
                    <label className="form-label">Détails & Spécifications</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Matières, coupe, entretien, conseils..."
                      value={formData.detail}
                      onChange={e => setFormData({ ...formData, detail: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving || isUploading}
                >
                  {isSaving ? 'Enregistrement...' : modalMode === 'create' ? 'Ajouter à la boutique' : 'Sauvegarder les modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="modal-backdrop" onClick={() => setDeletingProduct(null)}>
          <div className="modal-card confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3>Supprimer cet article ?</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer définitivement <strong>{deletingProduct.name}</strong> du catalogue ? Cette action est immédiate.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setDeletingProduct(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
