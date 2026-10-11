import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { Product, PRODUCTS as DEFAULT_PRODUCTS } from '@/data/products';
import { CategoryItem, DEFAULT_CATEGORIES } from '@/data/categories';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'oumalya.db');

// Singleton database instance
let dbInstance: Database.Database | null = null;

function initDbConnection(): Database.Database {
  let db: Database.Database;
  const isVercel = process.env.VERCEL === '1';

  if (isVercel) {
    try {
      const tmpPath = path.join('/tmp', 'oumalya.db');
      if (!fs.existsSync(tmpPath) && fs.existsSync(dbPath)) {
        fs.copyFileSync(dbPath, tmpPath);
      }
      db = new Database(tmpPath);
    } catch {
      db = new Database(dbPath, { readonly: true });
    }
  } else {
    try {
      db = new Database(dbPath);
      try {
        db.pragma('journal_mode = WAL');
      } catch {}
    } catch {
      db = new Database(dbPath, { readonly: true });
    }
  }

  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS images (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        data BLOB NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_images_created ON images(created_at DESC);

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        cat TEXT NOT NULL,
        category TEXT NOT NULL,
        label TEXT NOT NULL,
        catLabel TEXT NOT NULL,
        price INTEGER NOT NULL,
        color TEXT,
        sizes TEXT,
        desc TEXT,
        description TEXT,
        detail TEXT,
        badges TEXT,
        badge TEXT,
        img TEXT,
        image TEXT,
        order_num INTEGER,
        created_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_products_order ON products(order_num ASC);
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        label TEXT,
        icon TEXT,
        image TEXT,
        default_sizes TEXT,
        is_default INTEGER DEFAULT 0,
        order_num INTEGER DEFAULT 0,
        created_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_categories_order ON categories(order_num ASC);

      CREATE TABLE IF NOT EXISTS meta (
        key TEXT PRIMARY KEY,
        val TEXT
      );
    `);

    // Seed initial categories if table is empty
    const catCount = db.prepare('SELECT count(*) as count FROM categories').get() as { count: number } | undefined;
    if (!catCount || catCount.count === 0) {
      const insertCat = db.prepare(`
        INSERT INTO categories (id, name, label, icon, image, default_sizes, is_default, order_num, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      DEFAULT_CATEGORIES.forEach((c, idx) => {
        insertCat.run(
          c.id,
          c.name,
          c.label || `${c.name.toUpperCase()} · COLLECTION`,
          c.icon || '✨',
          c.image || '/images/category-abayas.jpg',
          JSON.stringify(c.defaultSizes || ['Standard']),
          c.isDefault ? 1 : 0,
          idx + 1,
          new Date().toISOString()
        );
      });
    }

    // Seed initial products ONCE if never initialized
    const metaRow = db.prepare("SELECT val FROM meta WHERE key = 'products_seeded'").get() as { val: string } | undefined;
    if (!metaRow) {
      const row = db.prepare('SELECT count(*) as count FROM products').get() as { count: number } | undefined;
      if (!row || row.count === 0) {
        const insert = db.prepare(`
          INSERT INTO products (id, name, cat, category, label, catLabel, price, color, sizes, desc, description, detail, badges, badge, img, image, order_num, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const p of DEFAULT_PRODUCTS) {
          insert.run(
            p.id,
            p.name,
            p.cat || p.category,
            p.category || p.cat,
            p.label,
            p.catLabel,
            p.price,
            p.color || 'Noir',
            JSON.stringify(p.sizes || []),
            p.desc || '',
            p.description || '',
            p.detail || '',
            p.badges || p.badge || '',
            p.badge || p.badges || '',
            p.img || p.image || '',
            p.image || p.img || '',
            p.order || 0,
            new Date().toISOString()
          );
        }
      }
      try {
        db.prepare("INSERT OR REPLACE INTO meta (key, val) VALUES ('products_seeded', '1')").run();
      } catch {}
    }
  } catch {}

  return db;
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = initDbConnection();
  }
  return dbInstance;
}

export interface StoredImage {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  data: Buffer;
  created_at: string;
}

export interface ImageMeta {
  id: string;
  filename: string;
  mime_type: string;
  size: number;
  created_at: string;
  url: string;
}

export function saveImageToDb(filename: string, mimeType: string, buffer: Buffer): ImageMeta {
  const db = getDb();
  const ext = path.extname(filename).toLowerCase() || '.jpg';
  const cleanBase = path.basename(filename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 30);

  const id = `${cleanBase || 'img'}-${Date.now()}`;
  const fullFilename = `${id}${ext}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO images (id, filename, mime_type, size, data, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, fullFilename, mimeType, buffer.length, buffer, now);

  return {
    id,
    filename: fullFilename,
    mime_type: mimeType,
    size: buffer.length,
    created_at: now,
    url: `/api/images/${id}`
  };
}

export function getImageFromDb(id: string): StoredImage | null {
  const db = getDb();
  const cleanId = id.replace(/\.[a-zA-Z0-9]+$/, '');
  const stmt = db.prepare(`SELECT * FROM images WHERE id = ? OR filename = ?`);
  const row = stmt.get(cleanId, id) as StoredImage | undefined;
  return row || null;
}

export function listImagesFromDb(): ImageMeta[] {
  const db = getDb();
  const stmt = db.prepare(`SELECT id, filename, mime_type, size, created_at FROM images ORDER BY created_at DESC LIMIT 100`);
  const rows = stmt.all() as Omit<StoredImage, 'data'>[];
  return rows.map(r => ({
    ...r,
    url: `/api/images/${r.id}`
  }));
}

export function deleteImageFromDb(id: string): boolean {
  const db = getDb();
  const cleanId = id.replace(/\.[a-zA-Z0-9]+$/, '');
  const stmt = db.prepare(`DELETE FROM images WHERE id = ? OR filename = ?`);
  const result = stmt.run(cleanId, id);
  return result.changes > 0;
}

export function isDbInitialized(): boolean {
  try {
    const db = getDb();
    const meta = db.prepare("SELECT val FROM meta WHERE key = 'products_seeded'").get();
    return !!meta;
  } catch {
    return false;
  }
}

export function getProductsFromDb(): Product[] {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM products ORDER BY order_num ASC, created_at ASC').all() as any[];
    if (rows) {
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        cat: r.cat || r.category || 'abayas',
        category: r.category || r.cat || 'abayas',
        label: r.label,
        catLabel: r.catLabel,
        price: r.price,
        color: r.color || 'Noir',
        sizes: r.sizes ? JSON.parse(r.sizes) : ['S', 'M', 'L', 'XL'],
        desc: r.desc || '',
        description: r.description || '',
        detail: r.detail || '',
        badges: r.badges || r.badge || 'Nouveauté',
        badge: r.badge || r.badges || 'Nouveauté',
        img: r.img || r.image || '/images/hero-abaya-pink.jpg',
        image: r.image || r.img || '/images/hero-abaya-pink.jpg',
        order: r.order_num || 0
      }));
    }
  } catch (err) {
    console.error('Error reading products from SQLite:', err);
  }
  return isDbInitialized() ? [] : DEFAULT_PRODUCTS;
}

export function saveProductToDb(p: Product): Product {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO products (id, name, cat, category, label, catLabel, price, color, sizes, desc, description, detail, badges, badge, img, image, order_num, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      p.id,
      p.name,
      p.cat || p.category,
      p.category || p.cat,
      p.label,
      p.catLabel,
      p.price,
      p.color || 'Noir',
      JSON.stringify(p.sizes || []),
      p.desc || '',
      p.description || '',
      p.detail || '',
      p.badges || p.badge || '',
      p.badge || p.badges || '',
      p.img || p.image || '',
      p.image || p.img || '',
      p.order || 0,
      new Date().toISOString()
    );
  } catch (err) {
    console.error('Error saving product to SQLite:', err);
  }
  return p;
}

export function deleteProductFromDb(id: string): boolean {
  try {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM products WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  } catch {
    return false;
  }
}

export function resetProductsInDb(defaults: Product[]): Product[] {
  try {
    const db = getDb();
    db.exec('DELETE FROM products;');
    const insert = db.prepare(`
      INSERT INTO products (id, name, cat, category, label, catLabel, price, color, sizes, desc, description, detail, badges, badge, img, image, order_num, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of defaults) {
      insert.run(
        p.id,
        p.name,
        p.cat || p.category,
        p.category || p.cat,
        p.label,
        p.catLabel,
        p.price,
        p.color || 'Noir',
        JSON.stringify(p.sizes || []),
        p.desc || '',
        p.description || '',
        p.detail || '',
        p.badges || p.badge || '',
        p.badge || p.badges || '',
        p.img || p.image || '',
        p.image || p.img || '',
        p.order || 0,
        new Date().toISOString()
      );
    }
  } catch (err) {
    console.error('Error resetting products in SQLite:', err);
  }
  return defaults;
}

export function getCategoriesFromDb(): CategoryItem[] {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM categories ORDER BY order_num ASC, created_at ASC').all() as any[];
    if (rows && rows.length > 0) {
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        label: r.label || `${r.name.toUpperCase()} · COLLECTION`,
        icon: r.icon || '✨',
        image: r.image || '/images/category-abayas.jpg',
        defaultSizes: r.default_sizes ? JSON.parse(r.default_sizes) : ['Standard'],
        isDefault: Boolean(r.is_default)
      }));
    }
  } catch (err) {
    console.error('Error reading categories from SQLite:', err);
  }
  return DEFAULT_CATEGORIES;
}

export function saveCategoryToDb(cat: CategoryItem): CategoryItem {
  try {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO categories (id, name, label, icon, image, default_sizes, is_default, order_num, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      cat.id,
      cat.name,
      cat.label || `${cat.name.toUpperCase()} · COLLECTION`,
      cat.icon || '✨',
      cat.image || '/images/category-abayas.jpg',
      JSON.stringify(cat.defaultSizes || ['Standard']),
      cat.isDefault ? 1 : 0,
      10,
      new Date().toISOString()
    );
  } catch (err) {
    console.error('Error saving category to SQLite:', err);
  }
  return cat;
}

export function deleteCategoryFromDb(id: string): boolean {
  try {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM categories WHERE id = ? AND is_default = 0');
    const result = stmt.run(id);
    return result.changes > 0;
  } catch {
    return false;
  }
}
