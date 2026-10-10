'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product, formatPrice } from '@/data/products';

export interface OrderItem {
  id: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  img: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: {
    prenom: string;
    nom: string;
    telephone: string;
    ville: string;
    adresse: string;
    livraison: string;
    note?: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
}

type TabKey = 'dashboard' | 'products' | 'orders' | 'settings';

export default function AdminPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    resetProducts,
    showToast
  } = useCart();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Notifications state
  const [notifOpen, setNotifOpen] = useState(false);
  const [readOrderIds, setReadOrderIds] = useState<string[]>([]);

  // Product Filtering & Search
  const [productSearch, setProductSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'abayas' | 'crocs'>('all');

  // Order Filtering & Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'>('all');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Product Form Data
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    category: 'abayas' as 'abayas' | 'crocs',
    price: 0,
    color: '',
    badge: 'Nouveauté',
    sizesText: 'S, M, L, XL',
    desc: '',
    detail: '',
    img: '/images/hero-abaya-pink.jpg'
  });

  // Settings State
  const [settings, setSettings] = useState({
    storePhone: '78 599 91 86',
    storeEmail: 'contact@oumalya.sn',
    dakarFee: 2000,
    banlieueFee: 3000,
    regionFee: 5000,
    announcement: 'Livraison express à Dakar en 24h & expédition sécurisée dans toutes les régions du Sénégal'
  });

  // Sound chime for new incoming orders
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  // Check settings & read orders
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('oumalya_store_settings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }

      const savedReads = localStorage.getItem('oumalya_read_orders');
      if (savedReads) {
        setReadOrderIds(JSON.parse(savedReads));
      }
    } catch {}
  }, []);

  // Fetch orders from API
  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time automatic polling every 4.5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const latest: Order[] = await res.json();
          if (Array.isArray(latest)) {
            setOrders(prev => {
              if (prev.length > 0) {
                const prevIds = new Set(prev.map(o => o.id));
                const newArrivals = latest.filter(o => !prevIds.has(o.id));
                if (newArrivals.length > 0) {
                  playChime();
                  const first = newArrivals[0];
                  showToast(
                    `🔔 Nouvelle commande reçue ! ${first.customer.prenom} ${first.customer.nom} (${first.customer.ville}) — ${formatPrice(first.total)}`
                  );
                }
              }
              return latest;
            });
          }
        }
      } catch {}
    }, 4500);

    return () => clearInterval(interval);
  }, [showToast]);

  const handleLogout = () => {
    showToast('Redirection vers la boutique publique...');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  // Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
        }
        showToast(`Statut mis à jour : ${getStatusLabel(newStatus)}`);
      } else {
        showToast('Erreur lors de la mise à jour du statut');
      }
    } catch {
      showToast('Erreur réseau');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    const allIds = orders.map(o => o.id);
    setReadOrderIds(allIds);
    try {
      localStorage.setItem('oumalya_read_orders', JSON.stringify(allIds));
    } catch {}
    showToast('Toutes les commandes sont marquées comme lues');
  };

  // Open single order from notifications
  const handleSelectNotifOrder = (order: Order) => {
    if (!readOrderIds.includes(order.id)) {
      const updated = [...readOrderIds, order.id];
      setReadOrderIds(updated);
      try {
        localStorage.setItem('oumalya_read_orders', JSON.stringify(updated));
      } catch {}
    }
    setOrderSearch(order.id);
    setActiveTab('orders');
    setNotifOpen(false);
  };

  // Open WhatsApp to Contact Customer
  const openWhatsAppCustomer = (order: Order) => {
    const cleanPhone = order.customer.telephone.replace(/[^0-9]/g, '');
    const itemsSummary = order.items.map(it => `${it.qty}x ${it.name} (${it.size})`).join(', ');
    const message = `Bonjour Madame / Monsieur ${order.customer.prenom} ${order.customer.nom},\n\n` +
      `C'est le service client OUMALYA CLOTHING. Nous vous contactons concernant votre commande #${order.id} :\n` +
      `• Articles : ${itemsSummary}\n` +
      `• Montant total : ${formatPrice(order.total)}\n` +
      `• Lieu de livraison : ${order.customer.ville} (${order.customer.adresse})\n\n` +
      `Notre équipe prépare votre colis avec le plus grand soin. Êtes-vous disponible pour la livraison ? ✨`;

    const fullPhone = cleanPhone.startsWith('221') ? cleanPhone : `221${cleanPhone}`;
    window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Open Product Modal for Creation
  const openCreateProduct = () => {
    setProductModalMode('create');
    setProductForm({
      id: '',
      name: '',
      category: 'abayas',
      price: 0,
      color: '',
      badge: 'Nouveauté',
      sizesText: 'S, M, L, XL',
      desc: '',
      detail: '',
      img: '/images/hero-abaya-pink.jpg'
    });
    setIsProductModalOpen(true);
  };

  // Open Product Modal for Edit
  const openEditProduct = (p: Product) => {
    setProductModalMode('edit');
    setProductForm({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      color: p.color || 'Noir',
      badge: p.badge || p.badges || 'Nouveauté',
      sizesText: Array.isArray(p.sizes) ? p.sizes.join(', ') : '',
      desc: p.desc || p.description || '',
      detail: p.detail || '',
      img: p.img || p.image || '/images/hero-abaya-pink.jpg'
    });
    setIsProductModalOpen(true);
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
        setProductForm(prev => ({ ...prev, img: json.url }));
        showToast('Image téléchargée avec succès !');
      } else {
        showToast(json.error || 'Erreur lors du téléchargement');
      }
    } catch {
      showToast('Échec du téléversement de l\'image');
    } finally {
      setIsUploading(false);
    }
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      showToast('Veuillez renseigner le nom du produit');
      return;
    }

    setIsSaving(true);
    const parsedSizes = productForm.sizesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      id: productForm.id,
      name: productForm.name.trim(),
      category: productForm.category,
      cat: productForm.category,
      label: productForm.category === 'crocs' ? 'CROCS · COLLECTION' : 'ABAYAS · COLLECTION',
      catLabel: productForm.category === 'crocs' ? 'CROCS · COLLECTION' : 'ABAYAS · COLLECTION',
      price: Number(productForm.price) || 0,
      color: productForm.color.trim() || 'Noir',
      badge: productForm.badge,
      badges: productForm.badge,
      sizes: parsedSizes.length ? parsedSizes : (productForm.category === 'crocs' ? ['36', '37', '38', '39', '40'] : ['S', 'M', 'L', 'XL']),
      desc: productForm.desc.trim(),
      description: productForm.desc.trim(),
      detail: productForm.detail.trim(),
      img: productForm.img,
      image: productForm.img
    };

    if (productModalMode === 'create') {
      await addProduct(payload);
    } else {
      await updateProduct(payload as Product);
    }

    setIsSaving(false);
    setIsProductModalOpen(false);
  };

  // Delete Product
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    await deleteProduct(deletingProduct.id);
    setDeletingProduct(null);
  };

  // Save Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('oumalya_store_settings', JSON.stringify(settings));
      showToast('Paramètres de la boutique enregistrés avec succès');
    } catch {
      showToast('Erreur lors de la sauvegarde');
    }
  };

  // Computed Unread Notifications
  const unreadOrders = useMemo(() => {
    const readSet = new Set(readOrderIds);
    return orders.filter(o => !readSet.has(o.id) && o.status === 'pending');
  }, [orders, readOrderIds]);

  // Computed KPIs & Stats
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const abayasCount = products.filter(p => p.category === 'abayas').length;
    const crocsCount = products.filter(p => p.category === 'crocs').length;

    return {
      totalOrders,
      pendingOrders,
      totalRevenue,
      avgOrderValue,
      totalProducts: products.length,
      abayasCount,
      crocsCount
    };
  }, [orders, products]);

  // Dynamic 7-day revenue chart from real orders (no fake data)
  const chartData = useMemo(() => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const now = new Date();
    const last7: { dayLabel: string; dayRevenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().slice(0, 10);
      const dayLabel = days[d.getDay()];
      const dayOrders = orders.filter(
        o => o.createdAt && o.createdAt.slice(0, 10) === dayKey && o.status !== 'cancelled'
      );
      const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      last7.push({ dayLabel, dayRevenue });
    }
    const maxRev = Math.max(1, ...last7.map(x => x.dayRevenue));
    const points = last7.map((item, idx) => {
      const x = 30 + idx * 90;
      const y = item.dayRevenue > 0 ? 170 - (item.dayRevenue / maxRev) * 130 : 170;
      return { ...item, x, y };
    });
    const hasAnySales = orders.some(o => o.status !== 'cancelled' && (o.total || 0) > 0);
    return { points, hasAnySales, last7 };
  }, [orders]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      const q = productSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.color.toLowerCase().includes(q) ||
        p.price.toString().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [products, categoryFilter, productSearch]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
      const q = orderSearch.toLowerCase().trim();
      const fullName = `${o.customer.prenom} ${o.customer.nom}`.toLowerCase();
      const matchSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        fullName.includes(q) ||
        o.customer.telephone.includes(q) ||
        o.customer.ville.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Status Helpers
  function getStatusLabel(status: Order['status']) {
    switch (status) {
      case 'pending': return 'En attente';
      case 'confirmed': return 'Confirmée';
      case 'shipping': return 'En livraison';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
    }
  }

  function getStatusBadge(status: Order['status']) {
    return (
      <span className={`status-pill ${status}`}>
        ● {getStatusLabel(status)}
      </span>
    );
  }

  // ==================== MAIN DASHBOARD LAYOUT ====================
  return (
    <div className="oumalya-admin">
      {/* SIDEBAR */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-title">OUMALYA</span>
            <span className="brand-sub">HAUTE COUTURE & BOUTIQUE</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Tableau de bord
          </button>

          <button
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => { setActiveTab('products'); setSidebarOpen(false); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Catalogue Produits
            <span className="nav-badge">{products.length}</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Commandes
            {unreadOrders.length > 0 && (
              <span className="nav-badge" style={{ background: '#d82b4f', color: '#fff' }}>
                {unreadOrders.length}
              </span>
            )}
          </button>

          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setSidebarOpen(false); }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Paramètres Boutique
          </button>

          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <Link
              href="/"
              target="_blank"
              className="btn btn-outline"
              style={{ width: '100%', fontSize: '12px', justifyContent: 'center' }}
            >
              Voir la boutique ↗
            </Link>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar-circle">O</div>
            <div className="user-meta">
              <strong>Admin Oumalya</strong>
              <small>Accès direct</small>
            </div>
            <button
              onClick={handleLogout}
              title="Retour à la boutique publique"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--muted)',
                padding: '4px',
                fontSize: '12px'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="admin-main-wrap">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: 'inline-flex',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px'
              }}
            >
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <h1 className="topbar-title">
              {activeTab === 'dashboard' && 'Tableau de bord exécutif'}
              {activeTab === 'products' && 'Gestion du catalogue produits'}
              {activeTab === 'orders' && 'Commandes & Suivi livraisons'}
              {activeTab === 'settings' && 'Configuration de la boutique'}
            </h1>
          </div>

          <div className="topbar-actions">
            {/* NOTIFICATION BELL */}
            <div className="notif-wrapper">
              <button
                type="button"
                className={`notif-bell-btn ${unreadOrders.length > 0 ? 'has-new' : ''}`}
                onClick={() => setNotifOpen(!notifOpen)}
                title={unreadOrders.length > 0 ? `${unreadOrders.length} nouvelle(s) commande(s)` : 'Notifications de commande'}
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {unreadOrders.length > 0 && (
                  <span className="notif-badge">
                    {unreadOrders.length}
                  </span>
                )}
              </button>

              {/* NOTIFICATION DROPDOWN */}
              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <div className="notif-title">
                      <span>🔔</span> Nouvelles Commandes ({unreadOrders.length})
                    </div>
                    {unreadOrders.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={markAllAsRead}
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>

                  <div className="notif-body">
                    {orders.slice(0, 8).map(o => {
                      const isUnread = !readOrderIds.includes(o.id) && o.status === 'pending';
                      return (
                        <div
                          key={o.id}
                          className={`notif-item ${isUnread ? 'unread' : ''}`}
                          onClick={() => handleSelectNotifOrder(o)}
                        >
                          <div className="notif-item-top">
                            <span className="notif-customer">
                              {isUnread && <span style={{ color: 'var(--pink)', marginRight: '5px' }}>●</span>}
                              {o.customer.prenom} {o.customer.nom}
                            </span>
                            <span className="notif-time">
                              {new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="notif-location">
                            📍 <strong>Lieu :</strong> {o.customer.ville}
                            {o.customer.adresse && o.customer.adresse !== o.customer.ville ? ` — ${o.customer.adresse}` : ''}
                          </div>

                          <div className="notif-item-bottom">
                            <span className="notif-total">{formatPrice(o.total)}</span>
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openWhatsAppCustomer(o);
                              }}
                            >
                              WhatsApp
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {orders.length === 0 && (
                      <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: '12.5px' }}>
                        Aucune commande reçue pour le moment.
                      </div>
                    )}
                  </div>

                  <div className="notif-footer">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      style={{ width: '100%', fontSize: '12px' }}
                      onClick={() => {
                        setActiveTab('orders');
                        setNotifOpen(false);
                      }}
                    >
                      Voir toutes les commandes ({orders.length}) →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {activeTab === 'products' && (
              <button onClick={openCreateProduct} className="btn btn-primary">
                + Ajouter un produit
              </button>
            )}

            {activeTab === 'orders' && (
              <button onClick={fetchOrders} className="btn btn-outline" disabled={isLoadingOrders}>
                {isLoadingOrders ? 'Actualisation...' : '↻ Rafraîchir'}
              </button>
            )}

            <button onClick={handleLogout} className="btn btn-outline btn-sm">
              Déconnexion
            </button>
          </div>
        </header>

        {/* CONTENT TABS */}
        <main className="admin-content-area">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              {/* KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Chiffre d&apos;Affaires</span>
                    <span className="kpi-icon">💰</span>
                  </div>
                  <div className="kpi-value">{formatPrice(stats.totalRevenue)}</div>
                  <div className="kpi-sub">
                    {stats.totalRevenue > 0 ? (
                      <span className="kpi-trend">↑ En activité · Total cumulé</span>
                    ) : (
                      'En attente de commandes réelles'
                    )}
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Commandes</span>
                    <span className="kpi-icon">📦</span>
                  </div>
                  <div className="kpi-value">{stats.totalOrders}</div>
                  <div className="kpi-sub">
                    {stats.pendingOrders > 0 ? (
                      <span style={{ color: '#d82b4f', fontWeight: 700 }}>
                        {stats.pendingOrders} à traiter
                      </span>
                    ) : stats.totalOrders > 0 ? (
                      'Toutes traitées'
                    ) : (
                      'Aucune commande reçue'
                    )}
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Articles en vente</span>
                    <span className="kpi-icon">👗</span>
                  </div>
                  <div className="kpi-value">{stats.totalProducts}</div>
                  <div className="kpi-sub">
                    {stats.abayasCount} Abayas · {stats.crocsCount} Crocs
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-header">
                    <span className="kpi-label">Panier Moyen</span>
                    <span className="kpi-icon">✨</span>
                  </div>
                  <div className="kpi-value">{formatPrice(stats.avgOrderValue)}</div>
                  <div className="kpi-sub">
                    {stats.totalOrders > 0 ? 'Par commande client' : 'En attente de ventes'}
                  </div>
                </div>
              </div>

              {/* Grid: Revenue Chart + Category Breakdown */}
              <div className="dashboard-grid">
                {/* Real Dynamic Revenue Chart */}
                <div className="panel-card">
                  <div className="panel-header">
                    <div>
                      <h3 className="panel-title">Tendance des Ventes (F CFA)</h3>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                        Progression réelle des ventes sur les 7 derniers jours
                      </p>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--pink)' }}>
                      Derniers 7 jours
                    </span>
                  </div>

                  {!chartData.hasAnySales ? (
                    <div style={{
                      height: '220px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      color: 'var(--muted)',
                      padding: '20px'
                    }}>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📈</div>
                      <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>
                        Aucune vente enregistrée pour le moment
                      </p>
                      <span style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px', maxWidth: '320px' }}>
                        La courbe d&apos;évolution des ventes se tracera automatiquement dès vos premières commandes réelles.
                      </span>
                    </div>
                  ) : (
                    <div className="chart-wrap">
                      <svg className="chart-svg" viewBox="0 0 600 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#eb5c8e" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#eb5c8e" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        <line x1="0" y1="50" x2="600" y2="50" stroke="#f2ecee" strokeDasharray="4" />
                        <line x1="0" y1="100" x2="600" y2="100" stroke="#f2ecee" strokeDasharray="4" />
                        <line x1="0" y1="150" x2="600" y2="150" stroke="#f2ecee" strokeDasharray="4" />

                        <polygon
                          className="chart-area"
                          points={`30,190 ${chartData.points.map(p => `${p.x},${p.y}`).join(' ')} 570,190`}
                        />

                        <polyline
                          className="chart-line"
                          points={chartData.points.map(p => `${p.x},${p.y}`).join(' ')}
                        />

                        {chartData.points.map((p, idx) => (
                          <circle key={idx} cx={p.x} cy={p.y} className="chart-dot">
                            <title>{`${p.dayLabel}: ${formatPrice(p.dayRevenue)}`}</title>
                          </circle>
                        ))}
                      </svg>

                      <div className="chart-labels">
                        {chartData.points.map((p, idx) => (
                          <span key={idx}>{p.dayLabel}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories & Fast Actions */}
                <div className="panel-card">
                  <div className="panel-header">
                    <h3 className="panel-title">Répartition Collections</h3>
                  </div>

                  <div className="progress-row">
                    <div className="progress-info">
                      <span>Abayas & Hijabs</span>
                      <span>{stats.abayasCount} réf. ({Math.round((stats.abayasCount / Math.max(1, stats.totalProducts)) * 100)}%)</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${(stats.abayasCount / Math.max(1, stats.totalProducts)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="progress-row">
                    <div className="progress-info">
                      <span>Crocs Customisées</span>
                      <span>{stats.crocsCount} réf. ({Math.round((stats.crocsCount / Math.max(1, stats.totalProducts)) * 100)}%)</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill crocs"
                        style={{ width: `${(stats.crocsCount / Math.max(1, stats.totalProducts)) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--stroke-light)' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px' }}>
                      Raccourcis Directs
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        onClick={openCreateProduct}
                        className="btn btn-outline"
                        style={{ justifyContent: 'flex-start', fontSize: '12px' }}
                      >
                        + Créer un nouveau produit
                      </button>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="btn btn-outline"
                        style={{ justifyContent: 'flex-start', fontSize: '12px' }}
                      >
                        📦 Voir toutes les commandes ({stats.totalOrders})
                      </button>
                      <button
                        onClick={() => setActiveTab('settings')}
                        className="btn btn-outline"
                        style={{ justifyContent: 'flex-start', fontSize: '12px' }}
                      >
                        ⚙️ Modifier les tarifs de livraison
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Orders Overview */}
              <div className="panel-card">
                <div className="panel-header">
                  <div>
                    <h3 className="panel-title">Dernières Commandes Clients</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--muted)' }}>
                      Accédez aux coordonnées et contactez les clientes en un clic sur WhatsApp
                    </p>
                  </div>
                  <button onClick={() => setActiveTab('orders')} className="btn btn-outline btn-sm">
                    Gérer toutes les commandes →
                  </button>
                </div>

                <div className="data-table-card" style={{ boxShadow: 'none', border: 'none' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>N° Commande</th>
                        <th>Cliente</th>
                        <th>Téléphone</th>
                        <th>Lieu de livraison</th>
                        <th>Articles</th>
                        <th>Total</th>
                        <th>Statut</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map(o => (
                        <tr key={o.id}>
                          <td>
                            <strong>{o.id}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              {new Date(o.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </div>
                          </td>
                          <td>
                            <strong>{o.customer.prenom} {o.customer.nom}</strong>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{o.customer.telephone}</span>
                          </td>
                          <td>
                            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}>
                              📍 {o.customer.ville}
                            </div>
                            {o.customer.adresse && o.customer.adresse !== o.customer.ville && (
                              <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{o.customer.adresse}</div>
                            )}
                          </td>
                          <td>
                            {o.items.map(it => `${it.qty}x ${it.name}`).join(', ')}
                          </td>
                          <td>
                            <strong style={{ color: 'var(--pink)' }}>{formatPrice(o.total)}</strong>
                          </td>
                          <td>
                            {getStatusBadge(o.status)}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => openWhatsAppCustomer(o)}
                              className="btn btn-success btn-sm"
                              title="Ouvrir WhatsApp avec message personnalisé"
                            >
                              WhatsApp
                            </button>
                          </td>
                        </tr>
                      ))}
                      {orders.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                            Aucune commande enregistrée pour le moment.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <div>
              {/* Toolbar */}
              <div className="toolbar-card">
                <div className="search-box">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Rechercher par nom, couleur, prix..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                  />
                </div>

                <div className="filter-pills">
                  <button
                    className={`filter-pill ${categoryFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('all')}
                  >
                    Tous ({products.length})
                  </button>
                  <button
                    className={`filter-pill ${categoryFilter === 'abayas' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('abayas')}
                  >
                    Abayas ({products.filter(p => p.category === 'abayas').length})
                  </button>
                  <button
                    className={`filter-pill ${categoryFilter === 'crocs' ? 'active' : ''}`}
                    onClick={() => setCategoryFilter('crocs')}
                  >
                    Crocs ({products.filter(p => p.category === 'crocs').length})
                  </button>
                </div>

                <button onClick={openCreateProduct} className="btn btn-primary">
                  + Ajouter un produit
                </button>
              </div>

              {/* Products Table */}
              <div className="data-table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Catégorie</th>
                      <th>Prix unitaire</th>
                      <th>Couleur</th>
                      <th>Tailles</th>
                      <th>Badge</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="product-cell">
                            <img src={p.img || p.image} alt={p.name} className="product-thumb" />
                            <div>
                              <strong style={{ display: 'block', fontSize: '13.5px' }}>{p.name}</strong>
                              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>ID: {p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`category-tag ${p.category}`}>
                            {p.category === 'crocs' ? 'Crocs' : 'Abaya'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--pink)', fontSize: '14px' }}>
                            {formatPrice(p.price)}
                          </strong>
                        </td>
                        <td>{p.color || 'Noir'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {Array.isArray(p.sizes) ? p.sizes.map(s => (
                              <span
                                key={s}
                                style={{
                                  fontSize: '10.5px',
                                  padding: '2px 6px',
                                  background: '#f2ecee',
                                  borderRadius: '4px',
                                  fontWeight: 600
                                }}
                              >
                                {s}
                              </span>
                            )) : 'Standard'}
                          </div>
                        </td>
                        <td>
                          {p.badge || p.badges ? (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              background: '#fef1f5',
                              color: 'var(--pink)',
                              borderRadius: '100px',
                              fontWeight: 700
                            }}>
                              {p.badge || p.badges}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => openEditProduct(p)}
                              className="btn btn-outline btn-sm"
                              title="Modifier la fiche produit"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => setDeletingProduct(p)}
                              className="btn btn-danger btn-sm"
                              title="Supprimer définitivement"
                            >
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                          Aucun produit ne correspond à votre recherche.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ORDERS */}
          {activeTab === 'orders' && (
            <div>
              {/* Orders Toolbar */}
              <div className="toolbar-card">
                <div className="search-box">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Rechercher par cliente, téléphone, ville..."
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                  />
                </div>

                <div className="filter-pills">
                  <button
                    className={`filter-pill ${orderStatusFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('all')}
                  >
                    Toutes ({orders.length})
                  </button>
                  <button
                    className={`filter-pill ${orderStatusFilter === 'pending' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('pending')}
                  >
                    En attente ({orders.filter(o => o.status === 'pending').length})
                  </button>
                  <button
                    className={`filter-pill ${orderStatusFilter === 'confirmed' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('confirmed')}
                  >
                    Confirmées ({orders.filter(o => o.status === 'confirmed').length})
                  </button>
                  <button
                    className={`filter-pill ${orderStatusFilter === 'shipping' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('shipping')}
                  >
                    En livraison ({orders.filter(o => o.status === 'shipping').length})
                  </button>
                  <button
                    className={`filter-pill ${orderStatusFilter === 'delivered' ? 'active' : ''}`}
                    onClick={() => setOrderStatusFilter('delivered')}
                  >
                    Livrées ({orders.filter(o => o.status === 'delivered').length})
                  </button>
                </div>
              </div>

              {/* Orders Table */}
              <div className="data-table-card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Réf. Commande</th>
                      <th>Date</th>
                      <th>Cliente & Contact</th>
                      <th>Lieu & Adresse de livraison</th>
                      <th>Articles commandés</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(o => (
                      <tr key={o.id}>
                        <td>
                          <strong>{o.id}</strong>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                          {new Date(o.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td>
                          <strong>{o.customer.prenom} {o.customer.nom}</strong>
                          <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--pink)', fontWeight: 600 }}>
                            {o.customer.telephone}
                          </div>
                        </td>
                        <td style={{ maxWidth: '240px' }}>
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}>
                            📍 {o.customer.ville}
                          </div>
                          {o.customer.adresse && o.customer.adresse !== o.customer.ville && (
                            <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '2px' }}>
                              {o.customer.adresse}
                            </div>
                          )}
                          {o.customer.note && (
                            <div style={{ fontSize: '11px', color: '#b78103', background: '#fff8e6', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>
                              Note : {o.customer.note}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            {o.items.map((it, idx) => (
                              <div key={idx} style={{ fontSize: '12px' }}>
                                • <strong>{it.qty}x</strong> {it.name} <span style={{ color: 'var(--muted)' }}>({it.size})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--pink)', fontSize: '14px' }}>
                            {formatPrice(o.total)}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--muted)' }}>
                            Frais livr. à convenir
                          </div>
                        </td>
                        <td>
                          <select
                            value={o.status}
                            onChange={e => handleUpdateOrderStatus(o.id, e.target.value as Order['status'])}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '8px',
                              border: '1px solid var(--stroke)',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              background: '#fff',
                              cursor: 'pointer'
                            }}
                          >
                            <option value="pending">En attente</option>
                            <option value="confirmed">Confirmée</option>
                            <option value="shipping">En livraison</option>
                            <option value="delivered">Livrée</option>
                            <option value="cancelled">Annulée</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => openWhatsAppCustomer(o)}
                            className="btn btn-success btn-sm"
                            title="Ouvrir la discussion WhatsApp avec message complet"
                          >
                            WhatsApp
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
                          Aucune commande trouvée.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SETTINGS */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: '800px' }}>
              <div className="panel-card" style={{ marginBottom: '24px' }}>
                <div className="panel-header">
                  <h3 className="panel-title">Coordonnées & Contact Boutique</h3>
                </div>

                <form onSubmit={handleSaveSettings}>
                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">Numéro WhatsApp Clientèle</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settings.storePhone}
                        onChange={e => setSettings({ ...settings, storePhone: e.target.value })}
                        placeholder="78 599 91 86"
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Email Professionnel</label>
                      <input
                        type="email"
                        className="form-input"
                        value={settings.storeEmail}
                        onChange={e => setSettings({ ...settings, storeEmail: e.target.value })}
                        placeholder="contact@oumalya.sn"
                      />
                    </div>

                    <div className="form-field full">
                      <label className="form-label">Bandeau d&apos;annonce supérieur</label>
                      <input
                        type="text"
                        className="form-input"
                        value={settings.announcement}
                        onChange={e => setSettings({ ...settings, announcement: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                    <button type="submit" className="btn btn-primary">
                      Enregistrer les paramètres
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetProducts();
                        showToast('Catalogue réinitialisé aux valeurs par défaut');
                      }}
                      className="btn btn-outline"
                    >
                      Restaurer catalogue de base
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================== PRODUCT ADD / EDIT MODAL WITH LIVE SMARTPHONE MOCKUP ==================== */}
      {isProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProductModalOpen(false)}>
          <div className="modal-window" onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h2>
                {productModalMode === 'create' ? 'Ajouter une nouvelle création' : 'Modifier la fiche produit'}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="btn btn-outline btn-icon"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="modal-content-grid">
              {/* Form Pane */}
              <div className="modal-form-pane">
                <form onSubmit={handleSaveProduct}>
                  <div className="form-grid">
                    <div className="form-field full">
                      <label className="form-label">Nom du modèle *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Abaya Soie de Médine Rose Poudré"
                        value={productForm.name}
                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Catégorie</label>
                      <select
                        className="form-select"
                        value={productForm.category}
                        onChange={e => {
                          const cat = e.target.value as 'abayas' | 'crocs';
                          setProductForm({
                            ...productForm,
                            category: cat,
                            sizesText: cat === 'crocs' ? '36, 37, 38, 39, 40' : 'S, M, L, XL'
                          });
                        }}
                      >
                        <option value="abayas">Abayas & Hijabs</option>
                        <option value="crocs">Crocs Customisées</option>
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Prix unitaire (F CFA) *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={productForm.price}
                        onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Couleur principale</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Rose Poudré, Noir Ébène"
                        value={productForm.color}
                        onChange={e => setProductForm({ ...productForm, color: e.target.value })}
                      />
                    </div>

                    <div className="form-field">
                      <label className="form-label">Badge promotionnel</label>
                      <select
                        className="form-select"
                        value={productForm.badge}
                        onChange={e => setProductForm({ ...productForm, badge: e.target.value })}
                      >
                        <option value="Nouveauté">Nouveauté</option>
                        <option value="Populaire">Populaire</option>
                        <option value="Édition Limitée">Édition Limitée</option>
                        <option value="Coup de Cœur">Coup de Cœur</option>
                        <option value="Rupture Proche">Rupture Proche</option>
                      </select>
                    </div>

                    <div className="form-field full">
                      <label className="form-label">Tailles disponibles (séparées par une virgule)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: S, M, L, XL ou 37, 38, 39"
                        value={productForm.sizesText}
                        onChange={e => setProductForm({ ...productForm, sizesText: e.target.value })}
                      />
                    </div>

                    {/* Image Upload Area */}
                    <div className="form-field full">
                      <label className="form-label">Photographie du produit</label>
                      <div className="upload-card">
                        <img
                          src={productForm.img}
                          alt="Aperçu"
                          className="upload-thumb"
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/images/hero-abaya-pink.jpg';
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ marginBottom: '8px', fontSize: '12px' }}
                            placeholder="URL de l'image ou téléversez ci-dessous"
                            value={productForm.img}
                            onChange={e => setProductForm({ ...productForm, img: e.target.value })}
                          />
                          <div className="file-btn">
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              disabled={isUploading}
                            >
                              {isUploading ? 'Téléchargement...' : '📁 Choisir une photo depuis votre PC'}
                            </button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={isUploading}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="form-field full">
                      <label className="form-label">Description courte</label>
                      <textarea
                        rows={2}
                        className="form-textarea"
                        placeholder="Brève description de la coupe..."
                        value={productForm.desc}
                        onChange={e => setProductForm({ ...productForm, desc: e.target.value })}
                      />
                    </div>

                    <div className="form-field full">
                      <label className="form-label">Détails matière & entretien</label>
                      <textarea
                        rows={2}
                        className="form-textarea"
                        placeholder="Conseils de lavage, provenance du tissu..."
                        value={productForm.detail}
                        onChange={e => setProductForm({ ...productForm, detail: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setIsProductModalOpen(false)}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSaving}
                    >
                      {isSaving ? 'Enregistrement...' : productModalMode === 'create' ? 'Créer le produit' : 'Sauvegarder les modifications'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Simulator Pane: Live Mobile iPhone Mockup */}
              <div className="modal-preview-pane">
                <span className="preview-title">Aperçu Mobile en Temps Réel</span>

                <div className="phone-mockup">
                  <div className="phone-camera" />
                  <div className="phone-screen">
                    <div className="phone-product-card">
                      <div className="phone-photo-wrap">
                        <img
                          src={productForm.img}
                          alt="Preview"
                          onError={e => {
                            (e.target as HTMLImageElement).src = '/images/hero-abaya-pink.jpg';
                          }}
                        />
                        <span className="phone-tag">{productForm.badge}</span>
                      </div>
                      <div className="phone-details">
                        <span className="phone-cat">
                          {productForm.category === 'crocs' ? 'Crocs OUMALYA' : 'Abayas & Hijabs'}
                        </span>
                        <div className="phone-name">
                          {productForm.name || 'Nom du produit...'}
                        </div>
                        <div className="phone-price">
                          {formatPrice(productForm.price || 0)}
                        </div>
                        <button type="button" className="phone-btn">
                          Commander sur WhatsApp →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '16px', textAlign: 'center', maxWidth: '240px' }}>
                  Ce simulateur reproduit exactement la carte produit visible par vos clientes sur smartphone.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== DELETE PRODUCT CONFIRMATION MODAL ==================== */}
      {deletingProduct && (
        <div className="modal-overlay" onClick={() => setDeletingProduct(null)}>
          <div className="modal-window" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h2 style={{ color: '#d82b4f' }}>Supprimer le produit ?</h2>
              <button onClick={() => setDeletingProduct(null)} className="btn btn-outline btn-icon">
                ✕
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: 'var(--ink)' }}>
                Êtes-vous sûre de vouloir supprimer définitivement le modèle <strong>{deletingProduct.name}</strong> ?
              </p>
              <p style={{ margin: '0 0 24px', fontSize: '12px', color: 'var(--muted)' }}>
                Cette action retirera le produit immédiatement de la boutique en ligne.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={() => setDeletingProduct(null)} className="btn btn-outline">
                  Annuler
                </button>
                <button onClick={handleConfirmDelete} className="btn btn-danger">
                  Oui, supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
