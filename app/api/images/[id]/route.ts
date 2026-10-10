import { NextRequest, NextResponse } from 'next/server';
import { getImageFromDb } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return new NextResponse('ID d\'image manquant', { status: 400 });
    }

    const image = getImageFromDb(id);
    if (!image) {
      return new NextResponse('Image non trouvée dans la base de données', { status: 404 });
    }

    return new NextResponse(new Uint8Array(image.data), {
      status: 200,
      headers: {
        'Content-Type': image.mime_type || 'image/jpeg',
        'Content-Length': image.size.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (error) {
    console.error('Erreur lecture image SQLite:', error);
    return new NextResponse('Erreur serveur lors de la récupération de l\'image', { status: 500 });
  }
}
