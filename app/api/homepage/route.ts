import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { HomePageSettings, DEFAULT_HOMEPAGE_SETTINGS } from '@/data/homepage';
import { FASTAPI_BASE_URL } from '@/lib/fastapi';
import { getHomepageFromSupabase, saveHomepageToSupabase } from '@/lib/catalog-sync';

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_REDACTED';
const homeFilePath = path.join(process.cwd(), 'data', 'homepage.json');

function getStoredHomepage(): HomePageSettings {
  try {
    if (fs.existsSync(homeFilePath)) {
      const content = fs.readFileSync(homeFilePath, 'utf8');
      const data = JSON.parse(content);
      if (data && Array.isArray(data.slides)) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[Homepage API] Error reading homepage.json:', err);
  }
  return DEFAULT_HOMEPAGE_SETTINGS;
}

function saveHomepageLocally(data: HomePageSettings): boolean {
  try {
    const dir = path.dirname(homeFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(homeFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

// GET: Fetch homepage settings (slides, category cards, promo banner)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  // 1. Try FastAPI Cloud backend
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/homepage`, {
      signal: controller.signal,
      headers: {
        'x-admin-secret': CLERK_SECRET_KEY,
        ...(authHeader ? { 'authorization': authHeader } : {})
      },
      cache: 'no-store'
    });
    clearTimeout(timeout);

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && Array.isArray(data.slides)) {
        saveHomepageLocally(data);
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    console.warn('[Homepage GET] FastAPI unreachable, trying Supabase fallback:', err);
  }

  // 2. Fallback to Supabase Cloud Storage (persistent across all redeployments)
  try {
    const cloud = await getHomepageFromSupabase();
    if (cloud && Array.isArray(cloud.slides)) {
      saveHomepageLocally(cloud);
      return NextResponse.json(cloud);
    }
  } catch (sbErr) {
    console.warn('[Homepage GET] Supabase fallback error:', sbErr);
  }

  // 3. Fallback to local storage / defaults
  return NextResponse.json(getStoredHomepage());
}

// PUT: Update homepage settings
export async function PUT(req: NextRequest) {
  try {
    const body: HomePageSettings = await req.json();
    const authHeader = req.headers.get('authorization');

    // 1. Forward to FastAPI backend
    try {
      await fetch(`${FASTAPI_BASE_URL}/api/homepage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': CLERK_SECRET_KEY,
          ...(authHeader ? { 'authorization': authHeader } : {})
        },
        body: JSON.stringify(body)
      });
    } catch (apiErr) {
      console.warn('[Homepage PUT] FastAPI forward error:', apiErr);
    }

    // 2. Persist to Supabase Cloud Storage (unlimited lifetime, survives redeployments)
    saveHomepageToSupabase(body).catch(err => {
      console.warn('[Homepage PUT] Supabase save error:', err);
    });

    // 3. Local file backup
    saveHomepageLocally(body);

    return NextResponse.json({ success: true, homepage: body });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour des visuels' }, { status: 500 });
  }
}

// POST alias for PUT
export async function POST(req: NextRequest) {
  return PUT(req);
}
