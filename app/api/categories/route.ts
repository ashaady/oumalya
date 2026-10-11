import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CategoryItem, DEFAULT_CATEGORIES } from '@/data/categories';
import {
  getCategoriesFromDb,
  saveCategoryToDb,
  deleteCategoryFromDb
} from '@/lib/db';
import { FASTAPI_BASE_URL } from '@/lib/fastapi';

const categoriesFilePath = path.join(process.cwd(), 'data', 'categories.json');

function getStoredCategories(): CategoryItem[] {
  // 1. Try SQLite
  try {
    const fromDb = getCategoriesFromDb();
    if (Array.isArray(fromDb) && fromDb.length > 0) {
      return fromDb;
    }
  } catch {}

  // 2. Try JSON file
  try {
    if (fs.existsSync(categoriesFilePath)) {
      const content = fs.readFileSync(categoriesFilePath, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  return DEFAULT_CATEGORIES;
}

function saveCategoriesToFile(cats: CategoryItem[]): boolean {
  try {
    const dir = path.dirname(categoriesFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(categoriesFilePath, JSON.stringify(cats, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

// GET: All categories (Proxy to FastAPI with local fallback)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/categories`, {
      signal: controller.signal,
      headers: authHeader ? { 'authorization': authHeader } : {},
      cache: 'no-store'
    });
    clearTimeout(timeout);

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data) && data.length > 0) {
        saveCategoriesToFile(data);
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    console.warn('[Categories GET] FastAPI backend unreachable, using local store:', err);
  }

  const cats = getStoredCategories();
  return NextResponse.json(cats);
}

// POST: Add or update category (Forward to FastAPI + local backup)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Le nom de la catégorie est requis' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');

    // Forward to FastAPI
    try {
      const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
        if (json.success && json.category) {
          try { saveCategoryToDb(json.category); } catch {}
          const all = getStoredCategories();
          const idx = all.findIndex(c => c.id === json.category.id);
          const next = idx !== -1 ? all.map(c => c.id === json.category.id ? json.category : c) : [...all, json.category];
          saveCategoriesToFile(next);
          return NextResponse.json(json);
        }
      }
    } catch (apiErr) {
      console.warn('[Categories POST] FastAPI forward error, using local fallback:', apiErr);
    }

    // Local fallback creation
    const rawName = body.name.trim();
    const id = body.id || rawName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const label = body.label || `${rawName.toUpperCase()} · COLLECTION`;
    const icon = body.icon || '✨';
    const image = body.image || '/images/hero-abaya-pink.jpg';
    const defaultSizes = Array.isArray(body.defaultSizes) && body.defaultSizes.length
      ? body.defaultSizes
      : ['Standard'];

    const newCategory: CategoryItem = {
      id,
      name: rawName,
      label,
      icon,
      image,
      defaultSizes,
      isDefault: false
    };

    try { saveCategoryToDb(newCategory); } catch {}
    const all = getStoredCategories();
    const idx = all.findIndex(c => c.id === id);
    if (idx !== -1) {
      all[idx] = newCategory;
    } else {
      all.push(newCategory);
    }
    saveCategoriesToFile(all);

    return NextResponse.json({ success: true, category: newCategory });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la création de la catégorie' }, { status: 500 });
  }
}

// DELETE: Delete a custom category (Forward to FastAPI + local backup)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de catégorie requis' }, { status: 400 });
    }

    if (id === 'abayas' || id === 'crocs') {
      return NextResponse.json({ error: 'Impossible de supprimer les catégories principales par défaut' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');

    // Forward to FastAPI
    try {
      const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: authHeader ? { 'authorization': authHeader } : {}
      });

      if (apiRes.status === 401 || apiRes.status === 403) {
        const errJson = await apiRes.json().catch(() => ({}));
        return NextResponse.json(errJson, { status: apiRes.status });
      }

      if (apiRes.ok) {
        try { deleteCategoryFromDb(id); } catch {}
        let all = getStoredCategories();
        all = all.filter(c => c.id !== id);
        saveCategoriesToFile(all);
        return NextResponse.json({ success: true, deletedId: id });
      }
    } catch (apiErr) {
      console.warn('[Categories DELETE] FastAPI forward error, using local fallback:', apiErr);
    }

    // Local fallback deletion
    try { deleteCategoryFromDb(id); } catch {}
    let all = getStoredCategories();
    all = all.filter(c => c.id !== id);
    saveCategoriesToFile(all);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
