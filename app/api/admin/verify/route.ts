import { NextRequest, NextResponse } from 'next/server';
import { FASTAPI_BASE_URL } from '@/lib/fastapi';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/admin/verify`, {
      method: 'GET',
      headers: {
        ...(authHeader ? { 'authorization': authHeader } : {})
      },
      cache: 'no-store'
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.warn('[Admin Verify Proxy] FastAPI backend connection attempt failed:', err);
    return NextResponse.json(
      { error: 'Backend FastAPI non joignable', detail: 'Le service backend FastAPI sur ' + FASTAPI_BASE_URL + ' est actuellement indisponible.' },
      { status: 503 }
    );
  }
}
