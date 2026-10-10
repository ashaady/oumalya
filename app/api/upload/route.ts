import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { saveImageToDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalName = file.name || 'image.jpg';
    const mimeType = file.type || 'image/jpeg';

    // 1. Save directly into SQLite Database (persistent binary storage)
    const imageMeta = saveImageToDb(originalName, mimeType, buffer);

    // 2. Also keep a disk file copy as fast static fallback
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'images', 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, imageMeta.filename);
      fs.writeFileSync(filePath, buffer);
    } catch (diskErr) {
      console.warn('Backup disk write warning:', diskErr);
    }

    return NextResponse.json({
      success: true,
      url: imageMeta.url,
      id: imageMeta.id,
      filename: imageMeta.filename,
      size: imageMeta.size,
      sqlite: true
    });
  } catch (error) {
    console.error('Upload SQLite error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement dans la base de données' }, { status: 500 });
  }
}
