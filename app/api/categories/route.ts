import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CategoryItem, DEFAULT_CATEGORIES } from '@/data/categories';
import {
  getCategoriesFromDb,
  saveCategoryToDb,
  deleteCategoryFromDb
} from '@/lib/db';

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

// GET: All categories
export async function GET() {
  const cats = getStoredCategories();
  return NextResponse.json(cats);
}

// POST: Add or update category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ error: 'Le nom de la catégorie est requis' }, { status: 400 });
    }

    const rawName = body.name.trim();
    const id = body.id || rawName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    if (!id) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

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

    // Save to SQLite
    try {
      saveCategoryToDb(newCategory);
    } catch (e) {
      console.warn('SQLite category save warning:', e);
    }

    // Save to categories.json
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
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la catégorie' }, { status: 500 });
  }
}

// DELETE: Delete a custom category
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

    try {
      deleteCategoryFromDb(id);
    } catch (e) {
      console.warn('SQLite category delete warning:', e);
    }

    let all = getStoredCategories();
    all = all.filter(c => c.id !== id);
    saveCategoriesToFile(all);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
