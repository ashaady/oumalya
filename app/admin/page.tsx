'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useAuth, useUser, SignIn, SignOutButton, UserButton } from '@clerk/nextjs';
import { useCart } from '@/context/CartContext';
import { Product, formatPrice } from '@/data/products';

const PRESET_IMAGES = [
  { label: 'Abaya Soie Rose (Hero)', url: '/images/hero-abaya-pink.jpg' },
  { label: 'Abaya Élégante Noire', url: '/images/product-abaya-noire.jpg' },
  { label: 'Abaya Douceur Taupe', url: '/images/product-abaya-taupe.jpg' },
  { label: 'Crocs Hello Kitty Noir', url: '/images/product-crocs-noir.jpg' },
  { label: 'Crocs Hello Kitty Rose', url: '/images/product-crocs-rose.jpg' },
  { label: 'Abaya Collection Index', url: '/images/index-abaya-noire.jpg' },
  { label: 'Abaya Taupe Index', url: '/images/index-abaya-taupe.jpg' },
  { label: 'Crocs Charms Promo', url: '/images/promo-crocs.jpg' }
];

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

const clerkOumalyaAppearance = {
  variables: {
    colorPrimary: '#eb5c8e',
    colorBackground: '#16141f',
    colorText: '#ffffff',
    colorTextSecondary: '#dedde8',
    colorInputBackground: '#201d2a',
    colorInputText: '#ffffff',
    colorTextOnPrimaryBackground: '#ffffff',
    colorDanger: '#ff4d6d',
    colorSuccess: '#2ec4b6',
    borderRadius: '14px',
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  elements: {
    rootBox: {
      width: '100%',
      maxWidth: '440px',
    },
    card: {
      background: '#16141f',
      border: '1px solid rgba(235, 92, 142, 0.35)',
      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 35px rgba(235, 92, 142, 0.12)',
      borderRadius: '20px',
      padding: '36px 30px',
    },
    headerTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontSize: '25px',
      fontWeight: '700',
      color: '#ffffff',
      letterSpacing: '0.01em',
    },
    headerSubtitle: {
      color: '#dedde8',
      fontSize: '14px',
      marginTop: '6px',
    },
    socialButtonsBlockButton: {
      background: '#23202e',
      border: '1px solid #433d56',
      color: '#ffffff',
      borderRadius: '12px',
      height: '48px',
    },
    socialButtonsBlockButtonText: {
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '14.5px',
    },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #eb5c8e 0%, #d8487d 100%)',
      border: 'none',
      borderRadius: '12px',
      color: '#ffffff',
      fontWeight: '600',
      fontSize: '14px',
      height: '46px',
      boxShadow: '0 6px 20px rgba(235, 92, 142, 0.35)',
    },
    footer: {
      display: 'none !important',
    },
    footerAction: {
      display: 'none !important',
    },
    footerActionText: {
      display: 'none !important',
    },
    footerActionLink: {
      display: 'none !important',
    },
    footerPages: {
      display: 'none !important',
    },
    devModeBadge: {
      display: 'none !important',
    },
    formFieldLabel: {
      color: '#ffffff',
      fontSize: '13px',
      fontWeight: '500',
    },
    formFieldInput: {
      background: '#201d2a',
      border: '1px solid #433d56',
      borderRadius: '10px',
      color: '#ffffff',
      fontSize: '14px',
      height: '44px',
    },
    dividerLine: {
      background: 'linear-gradient(90deg, transparent, rgba(235, 92, 142, 0.45), transparent)',
    },
    dividerText: {
      color: '#a5a4b5',
    },
  },
};

export default function AdminPage() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    resetProducts,
    categories,
    addCategory,
    deleteCategory,
    showToast
  } = useCart();

  // --- CLERK AUTH & 2-ADMIN WHITELIST VERIFICATION ---
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [adminStatus, setAdminStatus] = useState<'loading' | 'unauthenticated' | 'checking' | 'authorized' | 'rejected'>('loading');
  const [adminData, setAdminData] = useState<{
    authorized: boolean;
    clerk_user_id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role: string;
    admin_slot: number;
    total_admins: number;
    max_admins: number;
    message?: string;
  } | null>(null);
  const [adminErrorMsg, setAdminErrorMsg] = useState<string>('');

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    try {
      const token = await getToken();
      if (token) {
        return { 'Authorization': `Bearer ${token}` };
      }
    } catch {}
    return {};
  };

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setAdminStatus('unauthenticated');
      return;
    }

    let isMounted = true;
    const verifyAdminRole = async () => {
      setAdminStatus('checking');
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/admin/verify', {
          method: 'GET',
          headers
        });

        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setAdminData(data);
            setAdminStatus('authorized');
          }
        } else if (res.status === 403) {
          const errData = await res.json().catch(() => ({}));
          if (isMounted) {
            setAdminErrorMsg(errData.detail || "Accès refusé : la limite des 2 administrateurs autorisés a été atteinte pour Oumalya.");
            setAdminStatus('rejected');
          }
        } else {
          if (isMounted) {
            setAdminStatus('authorized');
          }
        }
      } catch (err) {
        if (isMounted) {
          setAdminStatus('authorized');
        }
      }
    };

    verifyAdminRole();
    return () => { isMounted = false; };
  }, [isLoaded, isSignedIn, getToken]);

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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('✨');
  const [newCatSizes, setNewCatSizes] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Order Filtering & Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'>('all');

  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState<'create' | 'edit'>('create');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Product Form Data
  const [productForm, setProductForm] = useState<{
    id: string;
    name: string;
    category: string;
    price: number | '';
    color: string;
    badge: string;
    sizesText: string;
    desc: string;
    detail: string;
    img: string;
  }>({
    id: '',
    name: '',
    category: 'abayas',
    price: '',
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
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/orders', { headers: authHeaders });
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
    if (adminStatus === 'authorized') {
      fetchOrders();
    }
  }, [adminStatus]);

  // Real-time automatic polling every 4.5 seconds
  useEffect(() => {
    if (adminStatus !== 'authorized') return;

    const interval = setInterval(async () => {
      try {
        const authHeaders = await getAuthHeaders();
        const res = await fetch('/api/orders', { headers: authHeaders });
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
  }, [adminStatus, showToast]);

  const handleLogout = () => {
    showToast('Redirection vers la boutique publique...');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  // Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const authHeaders = await getAuthHeaders();
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
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

  // Handle Category Creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Veuillez renseigner le nom de la catégorie');
      return;
    }
    setIsSavingCategory(true);
    const parsedSizes = newCatSizes
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    await addCategory({
      name: newCatName.trim(),
      icon: newCatIcon || '✨',
      defaultSizes: parsedSizes.length ? parsedSizes : ['Standard']
    });

    setIsSavingCategory(false);
    setNewCatName('');
    setNewCatSizes('');
    setIsCategoryModalOpen(false);
  };

  // Open Product Modal for Creation
  const openCreateProduct = () => {
    setProductModalMode('create');
    const initialCat = categories[0]?.id || 'abayas';
    const targetCat = categories.find(c => c.id === initialCat);
    setProductForm({
      id: '',
      name: '',
      category: initialCat,
      price: '',
      color: '',
      badge: 'Nouveauté',
      sizesText: targetCat?.defaultSizes?.join(', ') || 'S, M, L, XL',
      desc: '',
      detail: '',
      img: '/images/hero-abaya-pink.jpg'
    });
    setIsProductModalOpen(true);
  };

  // Open Product Modal for Edit
  const openEditProduct = (p: Product) => {
    setProductModalMode('edit');
    const cat = p.category || p.cat || categories[0]?.id || 'abayas';
    setProductForm({
      id: p.id,
      name: p.name,
      category: cat,
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

  // Process and upload any chosen image file (from input or drag & drop)
  const processImageFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Veuillez sélectionner un fichier image valide (JPG, PNG, WEBP...)');
      return;
    }

    setIsUploading(true);

    // 1. Instant 0ms visual preview via Object URL
    try {
      const previewUrl = URL.createObjectURL(file);
      setProductForm(prev => ({ ...prev, img: previewUrl }));
    } catch {}

    // 2. Read as Base64 Data URL for bulletproof fallback
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;

      try {
        const uploadData = new FormData();
        uploadData.append('file', file);

        const authHeaders = await getAuthHeaders();
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: authHeaders,
          body: uploadData
        });

        const json = await res.json();
        if (json.success && json.url) {
          setProductForm(prev => ({ ...prev, img: json.url }));
          showToast('✓ Photo enregistrée avec succès !');
        } else {
          setProductForm(prev => ({ ...prev, img: base64Data }));
          showToast('Photo appliquée localement');
        }
      } catch {
        setProductForm(prev => ({ ...prev, img: base64Data }));
        showToast('Photo appliquée localement');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      showToast('Erreur lors de la lecture du fichier image');
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      showToast('Veuillez renseigner le nom du modèle');
      return;
    }

    const numericPrice = Number(productForm.price);
    if (productForm.price === '' || isNaN(numericPrice) || numericPrice <= 0) {
      showToast('Veuillez renseigner un prix valide (supérieur à 0 F CFA)');
      return;
    }

    setIsSaving(true);
    const parsedSizes = productForm.sizesText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const targetCat = categories.find(c => c.id === productForm.category);
    const catLabel = targetCat?.label || `${(targetCat?.name || productForm.category).toUpperCase()} · COLLECTION`;
    const defaultSizes = targetCat?.defaultSizes || ['Standard'];

    const payload = {
      id: productForm.id,
      name: productForm.name.trim(),
      category: productForm.category,
      cat: productForm.category,
      label: catLabel,
      catLabel: catLabel,
      price: Math.max(0, Math.round(numericPrice)),
      color: productForm.color.trim() || 'Noir',
      badge: productForm.badge,
      badges: productForm.badge,
      sizes: parsedSizes.length ? parsedSizes : defaultSizes,
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

    const abayasCount = products.filter(p => (p.category || p.cat) === 'abayas').length;
    const crocsCount = products.filter(p => (p.category || p.cat) === 'crocs').length;

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
      const pCat = p.category || p.cat || 'abayas';
      const matchCat = categoryFilter === 'all' || pCat === categoryFilter;
      const q = productSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q)) ||
        (p.price !== undefined && p.price.toString().includes(q)) ||
        (p.id && p.id.toLowerCase().includes(q));
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

  // --- 1. LOADING / CHECKING STATE ---
  if (!isLoaded || adminStatus === 'loading' || adminStatus === 'checking') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        <div style={{
          width: '54px',
          height: '54px',
          border: '3px solid rgba(235, 92, 142, 0.2)',
          borderTopColor: '#eb5c8e',
          borderRadius: '50%',
          animation: 'spin 0.85s linear infinite',
          marginBottom: '20px',
          boxShadow: '0 0 25px rgba(235, 92, 142, 0.25)'
        }} />
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '26px',
          letterSpacing: '0.12em',
          background: 'linear-gradient(135deg, #ffffff 0%, #faedef 35%, #eb5c8e 75%, #d4af37 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: 0,
          fontWeight: 700
        }}>
          OUMALYA
        </h2>
        <div style={{
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.3em',
          color: '#d4af37',
          textTransform: 'uppercase',
          marginTop: '4px',
          marginBottom: '10px'
        }}>
          Maison de Mode · Dakar
        </div>
        <p style={{ color: '#9e9ea8', fontSize: '13px', marginTop: '4px' }}>
          {adminStatus === 'checking' ? 'Vérification des accès administrateur...' : 'Initialisation de l\'espace sécurisé...'}
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // --- 2. UNAUTHENTICATED STATE (CLERK SIGN IN) ---
  if (!isSignedIn || adminStatus === 'unauthenticated') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0d0d12',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        color: '#ffffff',
        fontFamily: "'DM Sans', sans-serif"
      }}>
        {/* Brand Header */}
        <div style={{
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          marginBottom: '26px'
        }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-block' }}>
            <h1 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '38px',
              letterSpacing: '0.15em',
              color: '#f0c868',
              margin: '0 0 6px 0',
              fontWeight: 700,
              textShadow: '0 2px 12px rgba(0,0,0,0.7)'
            }}>
              OUMALYA
            </h1>
          </Link>

          <div style={{
            fontSize: '10.5px',
            fontWeight: 700,
            letterSpacing: '0.28em',
            color: '#d4af37',
            textTransform: 'uppercase',
            marginBottom: '14px'
          }}>
            Maison de Mode · Dakar
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#ffffff',
            background: '#1a1824',
            border: '1px solid #eb5c8e',
            padding: '7px 18px',
            borderRadius: '999px',
            boxShadow: '0 4px 15px rgba(235, 92, 142, 0.2)'
          }}>
            <span style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#eb5c8e',
              boxShadow: '0 0 8px #eb5c8e'
            }} />
            Espace Administration Sécurisé
          </div>

          <p style={{
            color: '#f0eff7',
            fontSize: '14px',
            marginTop: '14px',
            lineHeight: 1.6,
            maxWidth: '430px',
            marginInline: 'auto',
            fontWeight: 400
          }}>
            Connexion réservée aux administrateurs autorisés de la boutique Oumalya. Authentifiez-vous pour gérer le catalogue, les stocks et les commandes.
          </p>
        </div>

        {/* Clerk Sign In Box */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '440px'
        }}>
          <SignIn
            routing="hash"
            appearance={clerkOumalyaAppearance}
          />
        </div>

        {/* Return Button */}
        <div style={{
          marginTop: '28px',
          textAlign: 'center'
        }}>
          <Link
            href="/"
            style={{
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 500,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '100px',
              border: '1px solid #eb5c8e',
              background: '#181622',
              transition: 'all 0.25s ease',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)'
            }}
          >
            <span>←</span>
            <span>Retour à la boutique publique</span>
          </Link>
        </div>

        {/* Specific Inline CSS for Clerk elements */}
        <style>{`
          .cl-rootBox {
            width: 100% !important;
            max-width: 440px !important;
          }
          .cl-card {
            background: #16141f !important;
            border: 1px solid rgba(235, 92, 142, 0.4) !important;
            box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 35px rgba(235, 92, 142, 0.12) !important;
            border-radius: 20px !important;
            padding: 34px 28px !important;
            color: #ffffff !important;
          }
          .cl-headerTitle {
            font-family: 'Playfair Display', Georgia, serif !important;
            color: #ffffff !important;
            font-size: 25px !important;
            fontWeight: 700 !important;
          }
          .cl-headerSubtitle {
            color: #d6d5e2 !important;
            font-size: 14px !important;
            font-weight: 400 !important;
          }
          .cl-socialButtonsBlockButton {
            background: #23202e !important;
            border: 1px solid #433d56 !important;
            color: #ffffff !important;
            border-radius: 12px !important;
            height: 48px !important;
            transition: all 0.2s ease !important;
          }
          .cl-socialButtonsBlockButton:hover {
            background: #2d283c !important;
            border-color: #eb5c8e !important;
            transform: translateY(-1px) !important;
          }
          .cl-socialButtonsBlockButtonText {
            color: #ffffff !important;
            font-weight: 600 !important;
            font-size: 14.5px !important;
          }
          .cl-formFieldLabel {
            color: #ffffff !important;
            font-size: 13px !important;
            font-weight: 500 !important;
          }
          .cl-formFieldInput {
            background: #201d2a !important;
            border: 1px solid #433d56 !important;
            color: #ffffff !important;
            border-radius: 10px !important;
            font-size: 14px !important;
            height: 44px !important;
          }
          .cl-formFieldInput:focus {
            border-color: #eb5c8e !important;
            box-shadow: 0 0 0 3px rgba(235, 92, 142, 0.25) !important;
          }
          .cl-formButtonPrimary {
            background: linear-gradient(135deg, #eb5c8e 0%, #d8487d 100%) !important;
            border: none !important;
            color: #ffffff !important;
            font-weight: 600 !important;
            border-radius: 12px !important;
            height: 46px !important;
            font-size: 14px !important;
            box-shadow: 0 6px 20px rgba(235, 92, 142, 0.35) !important;
          }
          .cl-formButtonPrimary:hover {
            background: linear-gradient(135deg, #f06999 0%, #e05286 100%) !important;
            box-shadow: 0 8px 26px rgba(235, 92, 142, 0.5) !important;
            transform: translateY(-1px) !important;
          }
          .cl-dividerLine {
            background: linear-gradient(90deg, transparent, rgba(235, 92, 142, 0.45), transparent) !important;
          }
          .cl-dividerText {
            color: #a5a4b5 !important;
            font-size: 11.5px !important;
            letter-spacing: 0.1em !important;
          }

          /* COMPLETELY HIDE: Footer, Sign up link, Secured by clerk, Development mode */
          .cl-footer,
          .cl-footerAction,
          .cl-footerActionText,
          .cl-footerActionLink,
          .cl-footerPages,
          .cl-footerPagesLink,
          .cl-devModeBadge,
          .cl-internal-b3fm6y,
          .cl-internal-1dauvpw,
          .cl-internal-1502444,
          [class*="footerAction"],
          [class*="footerPages"],
          [class*="devModeBadge"],
          [class*="developmentMode"] {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            max-height: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
            overflow: hidden !important;
          }
        `}</style>
      </div>
    );
  }

  // --- 3. REJECTED STATE (MAX 2 ADMINS ENFORCED) ---
  if (adminStatus === 'rejected') {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 15%, rgba(220, 53, 69, 0.16) 0%, rgba(18, 16, 23, 0.96) 50%, #0a090d 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        color: '#fff',
        fontFamily: "'DM Sans', sans-serif",
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(220, 53, 69, 0.15) 0%, transparent 68%)',
          filter: 'blur(65px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div style={{
          maxWidth: '520px',
          width: '100%',
          background: 'linear-gradient(165deg, rgba(23, 21, 28, 0.96) 0%, rgba(14, 13, 18, 0.98) 100%)',
          borderRadius: '22px',
          border: '1px solid rgba(220, 53, 69, 0.3)',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px rgba(220, 53, 69, 0.15)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'rgba(220, 53, 69, 0.12)',
            border: '1px solid rgba(220, 53, 69, 0.35)',
            color: '#ff4d6d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            margin: '0 auto 20px auto',
            boxShadow: '0 0 25px rgba(220, 53, 69, 0.2)'
          }}>
            🔒
          </div>

          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '27px',
            color: '#ffffff',
            margin: '0 0 8px 0',
            fontWeight: 600
          }}>
            Accès Administrateur Refusé
          </h2>

          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.25em',
            color: '#ff4d6d',
            textTransform: 'uppercase',
            marginBottom: '16px'
          }}>
            Limite de 2 Administrateurs Atteinte
          </div>

          <p style={{ color: '#d0d0d8', fontSize: '14.5px', lineHeight: 1.6, margin: '0 0 20px 0' }}>
            {adminErrorMsg || "La limite des 2 administrateurs Oumalya autorisés a été atteinte pour ce compte."}
          </p>

          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '14px 18px',
            borderRadius: '12px',
            fontSize: '13px',
            color: '#a0a0ab',
            marginBottom: '28px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#888' }}>Compte connecté :</span>
              <strong style={{ color: '#fff' }}>{user?.primaryEmailAddress?.emailAddress || user?.id}</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>
              Seuls les 2 premiers administrateurs enregistrés peuvent accéder aux outils de gestion de la boutique Oumalya.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <SignOutButton>
              <button style={{
                background: 'linear-gradient(135deg, #ff4d6d 0%, #d83252 100%)',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(220, 53, 69, 0.35)'
              }}>
                Se déconnecter
              </button>
            </SignOutButton>

            <Link
              href="/"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#fff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 500,
                fontSize: '13px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              Retour à la boutique
            </Link>
          </div>
        </div>
      </div>
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
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <UserButton />
              <div className="user-meta" style={{ minWidth: 0, overflow: 'hidden' }}>
                <strong style={{ fontSize: '13px', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {user?.fullName || user?.firstName || 'Admin Oumalya'}
                </strong>
                <span style={{ fontSize: '11px', color: '#d4af37', fontWeight: 600, display: 'block' }}>
                  ⭐ Admin #{adminData?.admin_slot || 1} / {adminData?.max_admins || 2}
                </span>
                <small style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {user?.primaryEmailAddress?.emailAddress}
                </small>
              </div>
            </div>
            <Link
              href="/"
              title="Voir la boutique publique"
              style={{
                color: 'var(--muted)',
                padding: '6px',
                display: 'inline-flex',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.05)'
              }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
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
                  {categories.map(c => {
                    const count = products.filter(p => (p.category || p.cat) === c.id).length;
                    return (
                      <button
                        key={c.id}
                        className={`filter-pill ${categoryFilter === c.id ? 'active' : ''}`}
                        onClick={() => setCategoryFilter(c.id)}
                      >
                        {c.icon ? `${c.icon} ` : ''}{c.name} ({count})
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="btn btn-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    title="Ajouter ou gérer des catégories de produits"
                  >
                    🏷️ Catégories ({categories.length})
                  </button>
                  <button onClick={openCreateProduct} className="btn btn-primary">
                    + Ajouter un produit
                  </button>
                </div>
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
                          <div
                            className="product-cell"
                            onClick={() => openEditProduct(p)}
                            style={{ cursor: 'pointer' }}
                            title="Cliquez pour changer la photo ou modifier ce produit"
                          >
                            <img src={p.img || p.image} alt={p.name} className="product-thumb" />
                            <div>
                              <strong style={{ display: 'block', fontSize: '13.5px' }}>{p.name}</strong>
                              <span style={{ fontSize: '11px', color: 'var(--muted)' }}>ID: {p.id}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <select
                            value={p.category || p.cat || categories[0]?.id || 'abayas'}
                            onChange={e => {
                              const newCatId = e.target.value;
                              const targetCat = categories.find(c => c.id === newCatId);
                              updateProduct({
                                id: p.id,
                                category: newCatId,
                                cat: newCatId,
                                label: targetCat?.label || `${(targetCat?.name || newCatId).toUpperCase()} · COLLECTION`,
                                catLabel: targetCat?.label || `${(targetCat?.name || newCatId).toUpperCase()} · COLLECTION`,
                                sizes: targetCat?.defaultSizes || ['Standard']
                              });
                            }}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              border: '1px solid var(--stroke)',
                              background: '#fdf7f9',
                              color: 'var(--ink)',
                              cursor: 'pointer'
                            }}
                            title="Changer rapidement la catégorie de ce produit"
                          >
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.icon ? `${c.icon} ` : ''}{c.name}
                              </option>
                            ))}
                          </select>
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
                              title="Modifier la photo ou les détails de ce modèle"
                            >
                              📷 Modifier
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <label className="form-label" style={{ margin: 0 }}>Catégorie *</label>
                        <button
                          type="button"
                          onClick={() => setIsCategoryModalOpen(true)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--pink)',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: '2px 4px'
                          }}
                        >
                          + Nouvelle catégorie
                        </button>
                      </div>
                      <select
                        className="form-select"
                        value={productForm.category}
                        onChange={e => {
                          const catId = e.target.value;
                          const targetCat = categories.find(c => c.id === catId);
                          setProductForm({
                            ...productForm,
                            category: catId,
                            sizesText: targetCat?.defaultSizes?.join(', ') || 'Standard'
                          });
                        }}
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.icon ? `${c.icon} ` : ''}{c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Prix unitaire (F CFA) *</label>
                      <input
                        type="number"
                        min="0"
                        step="500"
                        className="form-input"
                        placeholder="Ex: 25000"
                        value={productForm.price}
                        onKeyDown={e => {
                          if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                            e.preventDefault();
                          }
                        }}
                        onChange={e => {
                          const val = e.target.value.trim();
                          if (val === '') {
                            setProductForm(prev => ({ ...prev, price: '' }));
                            return;
                          }
                          const num = Number(val);
                          if (!isNaN(num) && num >= 0) {
                            setProductForm(prev => ({ ...prev, price: num }));
                          }
                        }}
                        required
                      />
                      <small style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>
                        Montant en F CFA (valeur positive uniquement)
                      </small>
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

                    {/* Image Selection Area */}
                    <div className="form-field full">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label className="form-label" style={{ margin: 0 }}>
                          Photographie du modèle *
                        </label>
                        {isUploading && (
                          <span style={{ color: 'var(--pink)', fontSize: '11.5px', fontWeight: 600 }}>
                            ⏳ Téléversement de l&apos;image en cours...
                          </span>
                        )}
                      </div>

                      {/* Dropzone & Direct File Pick Card */}
                      <div
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDropImage}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          border: isDragging ? '2px dashed var(--pink)' : '2px dashed #f2b9cf',
                          background: isDragging ? '#fef4f7' : '#fcf8fa',
                          borderRadius: '16px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          marginBottom: '14px'
                        }}
                      >
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <img
                            src={productForm.img}
                            alt="Aperçu sélectionné"
                            className="upload-thumb"
                            style={{
                              width: '84px',
                              height: '84px',
                              borderRadius: '12px',
                              objectFit: 'cover',
                              border: '2px solid var(--pink)',
                              boxShadow: '0 4px 12px rgba(235,92,142,0.15)',
                              display: 'block'
                            }}
                            onError={e => {
                              (e.target as HTMLImageElement).src = '/images/hero-abaya-pink.jpg';
                            }}
                          />
                          {isUploading && (
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(255,255,255,0.75)',
                              borderRadius: '12px',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '18px'
                            }}>
                              ⌛
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '18px' }}>📸</span>
                            <strong style={{ fontSize: '13.5px', color: 'var(--ink)' }}>
                              Cliquez ici ou glissez votre photo
                            </strong>
                          </div>
                          <p style={{ margin: '0 0 10px', fontSize: '12px', color: 'var(--muted)', lineHeight: 1.4 }}>
                            Glissez un fichier ou cliquez pour parcourir les dossiers de votre PC / smartphone (JPG, PNG, WEBP).
                          </p>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={isUploading}
                              onClick={e => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              style={{ fontSize: '12px', padding: '6px 14px' }}
                            >
                              {isUploading ? 'Traitement en cours...' : '📁 Choisir depuis mon appareil'}
                            </button>
                          </div>

                          {/* Hidden file input controlled via fileInputRef */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                          />
                        </div>
                      </div>

                      {/* Direct URL input */}
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginBottom: '4px' }}>
                          Lien ou URL directe de l&apos;image :
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '12px', padding: '8px 12px' }}
                          placeholder="Ex: /images/uploads/... ou lien web https://..."
                          value={productForm.img}
                          onChange={e => setProductForm({ ...productForm, img: e.target.value })}
                        />
                      </div>

                      {/* Preset Gallery */}
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', marginBottom: '8px' }}>
                          ✨ Ou sélectionnez directement une photo de la collection :
                        </label>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))',
                          gap: '8px',
                          maxHeight: '170px',
                          overflowY: 'auto',
                          padding: '8px',
                          background: '#fff',
                          border: '1px solid var(--stroke-light)',
                          borderRadius: '12px'
                        }}>
                          {PRESET_IMAGES.map((preset, idx) => {
                            const isSelected = productForm.img === preset.url;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setProductForm({ ...productForm, img: preset.url });
                                  showToast(`Photo "${preset.label}" sélectionnée`);
                                }}
                                title={preset.label}
                                style={{
                                  border: isSelected ? '2px solid var(--pink)' : '1px solid var(--stroke)',
                                  padding: '3px',
                                  borderRadius: '8px',
                                  background: isSelected ? '#fef4f7' : '#fff',
                                  cursor: 'pointer',
                                  textAlign: 'center',
                                  position: 'relative',
                                  outline: 'none',
                                  boxShadow: isSelected ? '0 0 0 2px rgba(235,92,142,0.3)' : 'none',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <img
                                  src={preset.url}
                                  alt={preset.label}
                                  style={{
                                    width: '100%',
                                    height: '54px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                    display: 'block'
                                  }}
                                />
                                <span style={{
                                  display: 'block',
                                  fontSize: '9.5px',
                                  fontWeight: isSelected ? 700 : 500,
                                  color: isSelected ? 'var(--pink)' : 'var(--muted)',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  marginTop: '3px'
                                }}>
                                  {preset.label.split(' ')[0]}
                                </span>
                                {isSelected && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '2px',
                                    right: '2px',
                                    background: 'var(--pink)',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    display: 'grid',
                                    placeItems: 'center'
                                  }}>
                                    ✓
                                  </div>
                                )}
                              </button>
                            );
                          })}
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
                          {(categories.find(c => c.id === productForm.category)?.name) || 'Collection OUMALYA'}
                        </span>
                        <div className="phone-name">
                          {productForm.name || 'Nom du produit...'}
                        </div>
                        <div className="phone-price">
                          {formatPrice(Number(productForm.price) || 0)}
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

      {/* ==================== CATEGORIES MANAGEMENT MODAL ==================== */}
      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="modal-window" style={{ maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-top">
              <h2>🏷️ Catégories de produits</h2>
              <button onClick={() => setIsCategoryModalOpen(false)} className="btn btn-outline btn-icon">
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Existing Categories List */}
              <div style={{ marginBottom: '24px' }}>
                <label className="form-label" style={{ marginBottom: '10px' }}>
                  Catégories existantes ({categories.length})
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {categories.map(c => {
                    const count = products.filter(p => (p.category || p.cat) === c.id).length;
                    const isProtected = c.id === 'abayas' || c.id === 'crocs';
                    return (
                      <div
                        key={c.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: '#fcf8fa',
                          border: '1px solid var(--stroke-light)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '20px' }}>{c.icon || '🏷️'}</span>
                          <div>
                            <strong style={{ fontSize: '13.5px', color: 'var(--ink)' }}>{c.name}</strong>
                            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                              ID: <code style={{ color: 'var(--pink)' }}>{c.id}</code> · {count} produit(s)
                            </div>
                          </div>
                        </div>

                        <div>
                          {isProtected ? (
                            <span style={{ fontSize: '11px', color: 'var(--muted)', background: '#eee', padding: '3px 8px', borderRadius: '6px' }}>
                              Par défaut
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (count > 0) {
                                  if (!confirm(`Cette catégorie contient ${count} produit(s). Les produits ne seront pas supprimés mais n'auront plus cette catégorie. Continuer ?`)) {
                                    return;
                                  }
                                }
                                deleteCategory(c.id);
                              }}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '4px 10px', fontSize: '11.5px' }}
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add New Category Form */}
              <div style={{ borderTop: '1px solid var(--stroke-light)', paddingTop: '20px' }}>
                <h4 style={{ margin: '0 0 14px', fontSize: '14.5px', color: 'var(--ink)' }}>
                  ✨ Ajouter une nouvelle catégorie
                </h4>

                <form onSubmit={handleCreateCategory}>
                  <div className="form-field full" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Nom de la catégorie *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: Robes de Soirée, Accessoires, Hijabs..."
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      required
                    />
                  </div>

                  {/* Icon / Emoji Selection */}
                  <div className="form-field full" style={{ marginBottom: '14px' }}>
                    <label className="form-label">Icône / Emoji</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {['👗', '👡', '👜', '🧕', '✨', '💍', '🎀', '👒', '🌸', '👠', '💎'].map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewCatIcon(emoji)}
                          style={{
                            fontSize: '18px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: newCatIcon === emoji ? '2px solid var(--pink)' : '1px solid var(--stroke)',
                            background: newCatIcon === emoji ? '#fef4f7' : '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '60px', textAlign: 'center', padding: '6px' }}
                        value={newCatIcon}
                        onChange={e => setNewCatIcon(e.target.value)}
                        placeholder="Autre"
                        maxLength={4}
                      />
                    </div>
                  </div>

                  {/* Suggested Sizes */}
                  <div className="form-field full" style={{ marginBottom: '20px' }}>
                    <label className="form-label">Tailles par défaut suggérées (séparées par une virgule)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex: S, M, L, XL ou 36, 37, 38, 39 ou Taille Unique"
                      value={newCatSizes}
                      onChange={e => setNewCatSizes(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '11px', color: 'var(--muted)', alignSelf: 'center' }}>Suggestions :</span>
                      <button
                        type="button"
                        onClick={() => setNewCatSizes('S, M, L, XL')}
                        style={{ fontSize: '10.5px', background: '#f5eff2', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                      >
                        S, M, L, XL
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCatSizes('36, 37, 38, 39, 40, 41')}
                        style={{ fontSize: '10.5px', background: '#f5eff2', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                      >
                        Pointures (36-41)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCatSizes('Taille Unique')}
                        style={{ fontSize: '10.5px', background: '#f5eff2', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}
                      >
                        Taille Unique
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setIsCategoryModalOpen(false)}
                    >
                      Fermer
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSavingCategory}
                    >
                      {isSavingCategory ? 'Création...' : '+ Créer la catégorie'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
