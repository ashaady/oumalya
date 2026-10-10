import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Product, PRODUCTS as DEFAULT_PRODUCTS } from '@/data/products';
import {
  getProductsFromDb,
  saveProductToDb,
  deleteProductFromDb,
  resetProductsInDb
} from '@/lib/db';

const dataFilePath = path.join(process.cwd(), 'data', 'products.json');

function getStoredProducts(): Product[] {
  // 1. Try SQLite database first
  try {
    const dbProducts = getProductsFromDb();
    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      return dbProducts;
    }
  } catch {}

  // 2. Fallback to products.json if available
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
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

// GET all products
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reset = searchParams.get('reset');

  if (reset === 'true') {
    try {
      resetProductsInDb(DEFAULT_PRODUCTS);
    } catch {}
    saveProducts(DEFAULT_PRODUCTS);
    return NextResponse.json(DEFAULT_PRODUCTS);
  }

  const products = getStoredProducts();
  return NextResponse.json(products);
}

// POST: Add new product
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    // Save to SQLite
    try {
      saveProductToDb(newProduct);
    } catch (e) {
      console.warn('SQLite product save error:', e);
    }

    // Save to products.json if writable
    products.push(newProduct);
    saveProducts(products);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de l\'ajout du produit' }, { status: 500 });
  }
}

// PUT: Update existing product (or upsert if added locally)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });
    }

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

    // Save to SQLite (upsert)
    try {
      saveProductToDb(updatedProduct);
    } catch (e) {
      console.warn('SQLite product update error:', e);
    }

    // Save to products.json if writable
    if (index !== -1) {
      products[index] = updatedProduct;
    } else {
      products.push(updatedProduct);
    }
    saveProducts(products);

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

// DELETE: Delete product
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });
    }

    let products = getStoredProducts();
    const initialLength = products.length;
    const exists = products.some(p => p.id === id);

    const deletedFromDb = (() => {
      try {
        return deleteProductFromDb(id);
      } catch (e) {
        console.warn('SQLite product delete error:', e);
        return false;
      }
    })();

    products = products.filter(p => p.id !== id);

    if (!exists && !deletedFromDb && products.length === initialLength) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    saveProducts(products);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
