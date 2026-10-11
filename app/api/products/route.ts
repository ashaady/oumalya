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
import { FASTAPI_BASE_URL } from '@/lib/fastapi';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_REDACTED';
const dataFilePath = path.join(process.cwd(), 'data', 'products.json');

function getStoredProducts(): Product[] {
  // 1. Try SQLite database first
  try {
    const dbProducts = getProductsFromDb();
    if (Array.isArray(dbProducts)) {
      if (isDbInitialized() || dbProducts.length > 0) {
        return dbProducts;
      }
    }
  } catch {}

  // 2. Fallback to products.json if available
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
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

// GET all products (Proxy to FastAPI with SQLite fallback)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reset = searchParams.get('reset');
  const authHeader = req.headers.get('authorization');

  // 1. Handle Reset
  if (reset === 'true') {
    try {
      await fetch(`${FASTAPI_BASE_URL}/api/products?reset=true`, {
        headers: {
          'x-admin-secret': CLERK_SECRET_KEY,
          ...(authHeader ? { 'authorization': authHeader } : {})
        },
        cache: 'no-store'
      });
    } catch {}

    try {
      resetProductsInDb(DEFAULT_PRODUCTS);
    } catch {}
    saveProducts(DEFAULT_PRODUCTS);
    return NextResponse.json(DEFAULT_PRODUCTS);
  }

  // 2. Try fetching from FastAPI Cloud backend
  try {
    const queryStr = searchParams.toString();
    const apiUrl = queryStr
      ? `${FASTAPI_BASE_URL}/api/products?${queryStr}`
      : `${FASTAPI_BASE_URL}/api/products`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const apiRes = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'x-admin-secret': CLERK_SECRET_KEY,
        ...(authHeader ? { 'authorization': authHeader } : {})
      },
      cache: 'no-store'
    });
    clearTimeout(timeout);

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data)) {
        saveProducts(data);
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    console.warn('[Products GET] FastAPI backend unreachable, using local store:', err);
  }

  // 3. Fallback to local storage
  const products = getStoredProducts();
  return NextResponse.json(products);
}

// POST: Add new product (Forward to FastAPI + local backup)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization');

    // Forward to FastAPI backend if available
    try {
      const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': CLERK_SECRET_KEY,
          ...(authHeader ? { 'authorization': authHeader } : {})
        },
        body: JSON.stringify(body)
      });

      if (apiRes.status === 401 || apiRes.status === 403) {
        const errJson = await apiRes.json().catch(() => ({}));
        return NextResponse.json(errJson, { status: apiRes.status });
      }

      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.success && json.product) {
          try { saveProductToDb(json.product); } catch {}
          const prods = getStoredProducts();
          const exists = prods.some(p => p.id === json.product.id);
          const next = exists ? prods.map(p => p.id === json.product.id ? json.product : p) : [...prods, json.product];
          saveProducts(next);
          return NextResponse.json(json);
        }
      }
    } catch (apiErr) {
      console.warn('[Products POST] FastAPI forward error, using local fallback:', apiErr);
    }

    // Local fallback creation
    const products = getStoredProducts();
    const id = body.id || (body.name || 'produit')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-4);

    const cat = body.cat || body.category || 'abayas';
    const dynamicLabel = cat === 'crocs' ? 'CROCS · COLLECTION' : cat === 'abayas' ? 'ABAYAS · COLLECTION' : `${cat.toUpperCase()} · COLLECTION`;

    const newProduct: Product = {
      id,
      name: body.name || 'Nouveau Produit',
      cat,
      category: cat,
      label: body.label || dynamicLabel,
      catLabel: body.catLabel || dynamicLabel,
      price: Math.max(0, Number(body.price) || 0) || 15000,
      color: body.color || 'Noir',
      sizes: Array.isArray(body.sizes) && body.sizes.length ? body.sizes : (body.cat === 'crocs' ? ['36', '37', '38', '39', '40'] : ['S', 'M', 'L', 'XL']),
      desc: body.desc || body.description || '',
      description: body.desc || body.description || '',
      detail: body.detail || 'Disponibilité des tailles et modèles à confirmer avec la boutique.',
      badges: body.badges || body.badge || 'Nouveauté',
      badge: body.badges || body.badge || 'Nouveauté',
      img: body.img || body.image || '/images/hero-abaya-pink.jpg',
      image: body.img || body.image || '/images/hero-abaya-pink.jpg',
      order: products.length + 1
    };

    try { saveProductToDb(newProduct); } catch {}
    products.push(newProduct);
    saveProducts(products);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de l\'ajout du produit' }, { status: 500 });
  }
}

// PUT: Update existing product (Forward to FastAPI + local backup)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');

    // Forward to FastAPI backend
    try {
      const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': CLERK_SECRET_KEY,
          ...(authHeader ? { 'authorization': authHeader } : {})
        },
        body: JSON.stringify(body)
      });

      if (apiRes.status === 401 || apiRes.status === 403) {
        const errJson = await apiRes.json().catch(() => ({}));
        return NextResponse.json(errJson, { status: apiRes.status });
      }

      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.success && json.product) {
          try { saveProductToDb(json.product); } catch {}
          const prods = getStoredProducts();
          const next = prods.map(p => p.id === json.product.id ? json.product : p);
          saveProducts(next);
          return NextResponse.json(json);
        }
      }
    } catch (apiErr) {
      console.warn('[Products PUT] FastAPI forward error, using local fallback:', apiErr);
    }

    // Local fallback update
    const products = getStoredProducts();
    const index = products.findIndex(p => p.id === body.id);
    const current: Partial<Product> = index !== -1 ? products[index] : {};

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
      img: body.img !== undefined ? body.img : (body.image !== undefined ? body.image : (current.img || current.image || '/images/hero-abaya-pink.jpg')),
      image: body.image !== undefined ? body.image : (body.img !== undefined ? body.img : (current.image || current.img || '/images/hero-abaya-pink.jpg')),
      order: current.order || (products.length + 1)
    };

    try { saveProductToDb(updatedProduct); } catch {}
    if (index !== -1) {
      products[index] = updatedProduct;
    } else {
      products.push(updatedProduct);
    }
    saveProducts(products);

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

// DELETE: Delete product (Forward to FastAPI + local backup)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');

    // 1. Forward to FastAPI backend
    let fastApiDeleted = false;
    try {
      const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-secret': CLERK_SECRET_KEY,
          ...(authHeader ? { 'authorization': authHeader } : {})
        }
      });

      if (apiRes.ok) {
        fastApiDeleted = true;
      }
    } catch (apiErr) {
      console.warn('[Products DELETE] FastAPI forward error, using local fallback:', apiErr);
    }

    // Local fallback deletion
    let products = getStoredProducts();
    const exists = products.some(p => p.id === id);
    try { deleteProductFromDb(id); } catch {}
    products = products.filter(p => p.id !== id);

    if (!exists && !fastApiDeleted) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    saveProducts(products);
    return NextResponse.json({ success: true, deletedId: id, fastApiSynced: fastApiDeleted });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
