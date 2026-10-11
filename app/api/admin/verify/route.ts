import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.FASTAPI_URL || process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  // Try forwarding to FastAPI backend
  try {
    const res = await fetch(`${FASTAPI_URL}/api/admin/verify`, {
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
      { error: 'Backend FastAPI non joignable', detail: 'Le service backend FastAPI sur ' + FASTAPI_URL + ' est actuellement indisponible.' },
      { status: 503 }
    );
  }
}
