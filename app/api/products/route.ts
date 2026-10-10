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

    const newProduct: Product = {
      id,
      name: body.name || 'Nouveau Produit',
      cat: body.cat || body.category || 'abayas',
      category: body.cat || body.category || 'abayas',
      label: body.label || (body.cat === 'crocs' ? 'CROCS · COLLECTION' : 'ABAYAS · COLLECTION'),
      catLabel: body.catLabel || (body.cat === 'crocs' ? 'CROCS · COLLECTION' : 'ABAYAS · COLLECTION'),
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

// PUT: Update existing product
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID produit requis' }, { status: 400 });
    }

    const products = getStoredProducts();
    const index = products.findIndex(p => p.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    const current = products[index];
    const cat = body.cat || body.category || current.cat;
    const updatedProduct: Product = {
      ...current,
      name: body.name !== undefined ? body.name : current.name,
      cat,
      category: cat,
      label: body.label !== undefined ? body.label : current.label,
      catLabel: body.catLabel !== undefined ? body.catLabel : current.catLabel,
      price: body.price !== undefined ? Math.max(0, Number(body.price) || 0) : current.price,
      color: body.color !== undefined ? body.color : current.color,
      sizes: body.sizes !== undefined ? (Array.isArray(body.sizes) ? body.sizes : [body.sizes]) : current.sizes,
      desc: body.desc !== undefined ? body.desc : (body.description !== undefined ? body.description : current.desc),
      description: body.description !== undefined ? body.description : (body.desc !== undefined ? body.desc : current.description),
      detail: body.detail !== undefined ? body.detail : current.detail,
      badges: body.badges !== undefined ? body.badges : (body.badge !== undefined ? body.badge : current.badges),
      badge: body.badge !== undefined ? body.badge : (body.badges !== undefined ? body.badges : current.badge),
      img: body.img !== undefined ? body.img : (body.image !== undefined ? body.image : current.img),
      image: body.image !== undefined ? body.image : (body.img !== undefined ? body.img : current.image),
    };

    // Save to SQLite
    try {
      saveProductToDb(updatedProduct);
    } catch (e) {
      console.warn('SQLite product update error:', e);
    }

    // Save to products.json if writable
    products[index] = updatedProduct;
    saveProducts(products);

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (error) {
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

    try {
      deleteProductFromDb(id);
    } catch (e) {
      console.warn('SQLite product delete error:', e);
    }

    let products = getStoredProducts();
    const initialLength = products.length;
    products = products.filter(p => p.id !== id);

    if (products.length === initialLength) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    saveProducts(products);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
