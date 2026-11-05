import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jufenigdvmpjwguyjwqw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const BUCKET_NAME = 'oumalya-images';

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

    const ext = originalName.includes('.') ? originalName.slice(originalName.lastIndexOf('.')).toLowerCase() : '.jpg';
    const baseName = originalName.slice(0, originalName.lastIndexOf('.')) || 'img';
    const cleanBase = baseName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 30) || 'img';
    const cleanFilename = `${cleanBase}-${Date.now()}${ext}`;

    // 1. Upload DIRECTLY to Supabase Storage Bucket (oumalya-images)
    if (SUPABASE_KEY) {
      try {
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET_NAME}/${cleanFilename}`;
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'apikey': SUPABASE_KEY,
            'Content-Type': mimeType,
            'x-upsert': 'true'
          },
          body: buffer
        });

        if (res.ok) {
          const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${cleanFilename}`;
          return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: cleanFilename,
            size: buffer.length,
            storage: 'supabase'
          });
        } else {
          const errText = await res.text();
          console.warn('[Direct Supabase Upload] HTTP error:', res.status, errText);
        }
      } catch (sbErr) {
        console.warn('[Direct Supabase Upload] Exception:', sbErr);
      }
    }

    // 2. Base64 Data URL fallback (guarantees preview & persistence even if storage is offline)
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      filename: cleanFilename,
      size: buffer.length,
      storage: 'inline'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: "Erreur lors du traitement de l'image" }, { status: 500 });
  }
}
