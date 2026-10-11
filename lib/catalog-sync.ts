import { Product } from '@/data/products';
import { CategoryItem } from '@/data/categories';
import { HomePageSettings, DEFAULT_HOMEPAGE_SETTINGS } from '@/data/homepage';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jufenigdvmpjwguyjwqw.supabase.co';
const DEFAULT_SERVICE_KEY = 'REDACTED_SERVICE_ROLE_KEY';
const _envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_KEY = _envKey.startsWith('ey') ? _envKey : DEFAULT_SERVICE_KEY;
const BUCKET = 'oumalya-images';
const FILE_NAME = 'oumalya_catalog.json';

export interface CatalogSyncData {
  initialized?: boolean;
  version: number;
  last_updated: string;
  products: Product[];
  categories: CategoryItem[];
  homepage?: HomePageSettings;
}

/**
 * Fetch catalog directly from Supabase CDN (persistent across all redeployments)
 */
export async function getCatalogFromSupabase(): Promise<CatalogSyncData | null> {
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${FILE_NAME}?t=${Date.now()}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) OumalyaSync/1.0' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && (Array.isArray(data.products) || Array.isArray(data.categories))) {
        return {
          initialized: data.initialized ?? true,
          version: data.version || 1,
          last_updated: data.last_updated || new Date().toISOString(),
          products: Array.isArray(data.products) ? data.products : [],
          categories: Array.isArray(data.categories) ? data.categories : [],
          homepage: data.homepage || DEFAULT_HOMEPAGE_SETTINGS
        };
      }
    }
  } catch (err) {
    console.warn('[CatalogSync] Supabase read error:', err);
  }
  return null;
}

/**
 * Persist catalog directly to Supabase Storage (unlimited lifetime, survives all Vercel/FastAPI redeployments)
 */
export async function saveCatalogToSupabase(
  products?: Product[],
  categories?: CategoryItem[],
  homepage?: HomePageSettings
): Promise<boolean> {
  try {
    const existing = await getCatalogFromSupabase();
    const finalProducts = products !== undefined ? products : (existing?.products || []);
    const finalCategories = categories !== undefined ? categories : (existing?.categories || []);
    const finalHomepage = homepage !== undefined ? homepage : (existing?.homepage || DEFAULT_HOMEPAGE_SETTINGS);

    const payload: CatalogSyncData = {
      initialized: true,
      version: (existing?.version || 0) + 1,
      last_updated: new Date().toISOString(),
      products: finalProducts,
      categories: finalCategories,
      homepage: finalHomepage
    };

    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/{BUCKET}/${FILE_NAME}`.replace('{BUCKET}', BUCKET);
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'x-upsert': 'true'
      },
      body: JSON.stringify(payload)
    });

    return res.ok;
  } catch (err) {
    console.warn('[CatalogSync] Supabase save error:', err);
    return false;
  }
}

export async function getHomepageFromSupabase(): Promise<HomePageSettings | null> {
  const cat = await getCatalogFromSupabase();
  return cat?.homepage || null;
}

export async function saveHomepageToSupabase(homepage: HomePageSettings): Promise<boolean> {
  return saveCatalogToSupabase(undefined, undefined, homepage);
}
