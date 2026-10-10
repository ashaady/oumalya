import { NextRequest, NextResponse } from 'next/server';
import { listImagesFromDb, deleteImageFromDb } from '@/lib/db';

export async function GET() {
  try {
    const images = listImagesFromDb();
    return NextResponse.json({ success: true, images });
  } catch (error) {
    console.error('Erreur liste images SQLite:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID d\'image requis' }, { status: 400 });
    }
    const deleted = deleteImageFromDb(id);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
