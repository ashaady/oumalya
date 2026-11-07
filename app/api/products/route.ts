import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Product, PRODUCTS as DEFAULT_PRODUCTS } from '@/data/products';
import {
  getProductsFromDb,
  saveProductToDb,
  deleteProductFromDb,
  resetProductsInDb,
  isDbInitialized
} from '@/lib/db';
import { getCatalogFromSupabase, saveCatalogToSupabase } from '@/lib/catalog-sync';

const dataFilePath = path.join(process.cwd(), 'data', 'products.json');

function getStoredProducts(): Product[] {
  // 1. Try SQLite database first
  try {
    const dbProducts = getProductsFromDb();
    if (Array.isArray(dbProducts) && dbProducts.length >= DEFAULT_PRODUCTS.length) {
      return dbProducts;
    }
  } catch {}

  // 2. Fallback to products.json if available
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length >= DEFAULT_PRODUCTS.length) {
        return data;
      }
    }
  } catch (error) {
    console.error('Error reading products.json:', error);
  }
  return DEFAULT_PRODUCTS;
}

function saveProducts(products: Product[]): boolean {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(products, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

// GET all products (Supabase Cloud is the canonical persistent source)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reset = searchParams.get('reset');

  // 1. Reset requested
  if (reset === 'true') {
    try {
      resetProductsInDb(DEFAULT_PRODUCTS);
    } catch {}
    saveProducts(DEFAULT_PRODUCTS);
    return NextResponse.json(DEFAULT_PRODUCTS);
  }

  // 2. Read directly from Supabase Cloud CDN storage
  try {
    const cloudCatalog = await getCatalogFromSupabase();
    if (cloudCatalog && Array.isArray(cloudCatalog.products) && cloudCatalog.products.length > 0) {
      const prodsToUse = cloudCatalog.products.length >= DEFAULT_PRODUCTS.length
        ? cloudCatalog.products
        : DEFAULT_PRODUCTS;
      const normalizedProds = prodsToUse.map(p => ({
        ...p,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.img || p.image || '/images/hero-abaya-pink.jpg']
      }));
      saveProducts(normalizedProds);
      return NextResponse.json(normalizedProds);
      try { resetProductsInDb(prodsToUse); } catch {}
      return NextResponse.json(prodsToUse);
    }
  } catch (cloudErr) {
    console.warn('[Products GET] Supabase CDN read error:', cloudErr);
  }

  // 3. Fallback to local stored products or DEFAULT_PRODUCTS
  const products = getStoredProducts();
  return NextResponse.json(products.length >= DEFAULT_PRODUCTS.length ? products : DEFAULT_PRODUCTS);
}

// POST: Add new product (Direct Supabase Storage persistence)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Fetch existing products from Supabase
    const cloudCatalog = await getCatalogFromSupabase();
    let currentProds: Product[] = [];
    if (cloudCatalog && Array.isArray(cloudCatalog.products) && cloudCatalog.products.length > 0) {
      currentProds = cloudCatalog.products;
    } else {
      currentProds = getStoredProducts();
    }

    const rawName = (body.name || 'Nouveau Produit').trim();
    const id = body.id || rawName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4);

    const cat = body.cat || body.category || 'abayas';
    const isCrocs = cat === 'crocs';
    const dynamicLabel = isCrocs ? 'CROCS · COLLECTION' : cat === 'abayas' ? 'ABAYAS · COLLECTION' : `${cat.toUpperCase()} · COLLECTION`;

    const rawImages = Array.isArray(body.images) && body.images.length > 0
      ? body.images.filter((x: any) => typeof x === 'string' && x.trim())
      : [body.img || body.image || '/images/hero-abaya-pink.jpg'];
    const mainImg = rawImages[0] || '/images/hero-abaya-pink.jpg';

    const newProduct: Product = {
      id,
      name: rawName,
      cat,
      category: cat,
      label: body.label || dynamicLabel,
      catLabel: body.catLabel || dynamicLabel,
      price: Math.max(0, Number(body.price) || 0) || 15000,
      color: body.color || 'Noir',
      sizes: Array.isArray(body.sizes) && body.sizes.length ? body.sizes : (isCrocs ? ['36', '37', '38', '39', '40'] : ['S', 'M', 'L', 'XL']),
      desc: body.desc || body.description || '',
      description: body.desc || body.description || '',
      detail: body.detail || 'Disponibilité des tailles et modèles à confirmer avec la boutique.',
      badges: body.badges || body.badge || 'Nouveauté',
      badge: body.badges || body.badge || 'Nouveauté',
      img: mainImg,
      image: mainImg,
      images: rawImages,
      order: currentProds.length + 1
    };

    const nextProducts = [...currentProds, newProduct];
    try { saveProductToDb(newProduct); } catch {}
    saveProducts(nextProducts);
    await saveCatalogToSupabase(nextProducts);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    console.error('Product creation error:', error);
    return NextResponse.json({ error: "Erreur lors de l'ajout du produit" }, { status: 500 });
  }
}

// PUT: Update existing product (Direct Supabase Storage persistence)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });
    }

    const cloudCatalog = await getCatalogFromSupabase();
    let currentProds: Product[] = [];
    if (cloudCatalog && Array.isArray(cloudCatalog.products) && cloudCatalog.products.length > 0) {
      currentProds = cloudCatalog.products;
    } else {
      currentProds = getStoredProducts();
    }

    const index = currentProds.findIndex(p => p.id === body.id);
    const current: Partial<Product> = index !== -1 ? currentProds[index] : {};

    const cat = body.cat || body.category || current.cat || current.category || 'abayas';
    const isCrocs = cat === 'crocs';
    const dynamicLabel = isCrocs ? 'CROCS · COLLECTION' : cat === 'abayas' ? 'ABAYAS · COLLECTION' : `${cat.toUpperCase()} · COLLECTION`;

    const updatedProduct: Product = {
      id: body.id,
      name: body.name !== undefined ? body.name : (current.name || 'Produit'),
      cat,
      category: cat,
      label: body.label !== undefined ? body.label : (current.label || dynamicLabel),
      catLabel: body.catLabel !== undefined ? body.catLabel : (current.catLabel || dynamicLabel),
      price: body.price !== undefined ? Math.max(0, Number(body.price) || 0) : (current.price || 15000),
      color: body.color !== undefined ? body.color : (current.color || 'Noir'),
      sizes: body.sizes !== undefined ? (Array.isArray(body.sizes) ? body.sizes : [body.sizes]) : (current.sizes || (isCrocs ? ['36', '37', '38', '39', '40'] : ['S', 'M', 'L', 'XL'])),
      desc: body.desc !== undefined ? body.desc : (body.description !== undefined ? body.description : (current.desc || current.description || '')),
      description: body.description !== undefined ? body.description : (body.desc !== undefined ? body.desc : (current.description || current.desc || '')),
      detail: body.detail !== undefined ? body.detail : (current.detail || 'Disponibilité à confirmer avec la boutique.'),
      badges: body.badges !== undefined ? body.badges : (body.badge !== undefined ? body.badge : (current.badges || current.badge || 'Nouveauté')),
      badge: body.badge !== undefined ? body.badge : (body.badges !== undefined ? body.badges : (current.badge || current.badges || 'Nouveauté')),
      img: Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : (body.img !== undefined ? body.img : (body.image !== undefined ? body.image : (current.img || current.image || '/images/hero-abaya-pink.jpg'))),
      image: Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : (body.image !== undefined ? body.image : (body.img !== undefined ? body.img : (current.image || current.img || '/images/hero-abaya-pink.jpg'))),
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : (current.images || [body.img || body.image || current.img || current.image || '/images/hero-abaya-pink.jpg']),
      order: current.order || (currentProds.length + 1)
    };

    let nextProducts: Product[];
    if (index !== -1) {
      nextProducts = currentProds.map(p => p.id === body.id ? updatedProduct : p);
    } else {
      nextProducts = [...currentProds, updatedProduct];
    }

    try { saveProductToDb(updatedProduct); } catch {}
    saveProducts(nextProducts);
    await saveCatalogToSupabase(nextProducts);

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Product update error:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

// DELETE: Delete product (Direct Supabase Storage persistence)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });
    }

    const cloudCatalog = await getCatalogFromSupabase();
    let currentProds: Product[] = [];
    if (cloudCatalog && Array.isArray(cloudCatalog.products) && cloudCatalog.products.length > 0) {
      currentProds = cloudCatalog.products;
    } else {
      currentProds = getStoredProducts();
    }

    const nextProducts = currentProds.filter(p => p.id !== id);
    try { deleteProductFromDb(id); } catch {}
    saveProducts(nextProducts);
    await saveCatalogToSupabase(nextProducts);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Product delete error:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
