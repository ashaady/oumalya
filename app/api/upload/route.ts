import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { saveImageToDb } from '@/lib/db';
import { FASTAPI_BASE_URL } from '@/lib/fastapi';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');

    // 1. Forward directly to FastAPI Cloud (which uploads to Supabase CDN bucket)
    try {
      const forwardData = new FormData();
      forwardData.append('file', file);

      const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          ...(authHeader ? { 'authorization': authHeader } : {})
        },
        body: forwardData
      });

      if (apiRes.status === 401 || apiRes.status === 403) {
        const errJson = await apiRes.json().catch(() => ({}));
        return NextResponse.json(errJson, { status: apiRes.status });
      }

      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.success && json.url) {
          return NextResponse.json(json);
        }
      }
    } catch (apiErr) {
      console.warn('[Upload POST] FastAPI forward error, using local fallback:', apiErr);
    }

    // 2. Local fallback: Save into SQLite Database
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalName = file.name || 'image.jpg';
    const mimeType = file.type || 'image/jpeg';

    const imageMeta = saveImageToDb(originalName, mimeType, buffer);

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
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Erreur lors du traitement de l\'image' }, { status: 500 });
  }
}
