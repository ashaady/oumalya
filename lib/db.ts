import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

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
    `);
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
