import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { FASTAPI_BASE_URL } from '@/lib/fastapi';

export interface OrderItem {
  id: string;
  name: string;
  size: string;
  qty: number;
  price: number;
  img: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: {
    prenom: string;
    nom: string;
    telephone: string;
    ville: string;
    adresse: string;
    livraison: string;
    note?: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled';
}

const dataFilePath = path.join(process.cwd(), 'data', 'orders.json');

function getStoredOrders(): Order[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf8');
      const data = JSON.parse(content);
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (error) {
    console.error('Error reading orders.json:', error);
  }
  return [];
}

function saveOrders(orders: Order[]): boolean {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing orders.json:', error);
    return false;
  }
}

// GET all orders (Proxy to FastAPI with local fallback)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/orders`, {
      signal: controller.signal,
      headers: authHeader ? { 'authorization': authHeader } : {},
      cache: 'no-store'
    });
    clearTimeout(timeout);

    if (apiRes.status === 401 || apiRes.status === 403) {
      const errJson = await apiRes.json().catch(() => ({}));
      return NextResponse.json(errJson, { status: apiRes.status });
    }

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data)) {
        saveOrders(data);
        return NextResponse.json(data);
      }
    }
  } catch (err) {
    console.warn('[Orders GET] FastAPI backend unreachable, using local store:', err);
  }

  const orders = getStoredOrders();
  return NextResponse.json(orders);
}

// POST create new order (Forward to FastAPI + local backup)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Forward to FastAPI
    try {
      const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.success && json.order) {
          const orders = getStoredOrders();
          orders.unshift(json.order);
          saveOrders(orders);
          return NextResponse.json(json);
        }
      }
    } catch (apiErr) {
      console.warn('[Orders POST] FastAPI forward error, using local fallback:', apiErr);
    }

    // Local fallback order creation
    const orders = getStoredOrders();
    const dateStr = new Date().toISOString();
    const orderNum = (orders.length + 1).toString().padStart(3, '0');
    const newOrder: Order = {
      id: body.id || `ORD-2026-${orderNum}`,
      createdAt: dateStr,
      customer: {
        prenom: body.customer?.prenom || '',
        nom: body.customer?.nom || '',
        telephone: body.customer?.telephone || '',
        ville: body.customer?.ville || '',
        adresse: body.customer?.adresse || '',
        livraison: body.customer?.livraison || 'Livraison à domicile',
        note: body.customer?.note || ''
      },
      items: Array.isArray(body.items) ? body.items : [],
      subtotal: Number(body.subtotal) || 0,
      deliveryFee: Number(body.deliveryFee) || 2000,
      total: Number(body.total) || (Number(body.subtotal) || 0) + (Number(body.deliveryFee) || 2000),
      status: body.status || 'pending'
    };

    orders.unshift(newOrder);
    saveOrders(orders);

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement de la commande' }, { status: 500 });
  }
}

// PUT update order status (Forward to FastAPI + local backup)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');

    // Forward to FastAPI
    try {
      const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/orders`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { 'authorization': authHeader } : {})
        },
        body: JSON.stringify(body)
      });

      if (apiRes.status === 401 || apiRes.status === 403) {
        const errJson = await apiRes.json().catch(() => ({}));
        return NextResponse.json(errJson, { status: apiRes.status });
      }

      if (apiRes.ok) {
        const json = await apiRes.json();
        if (json.success && json.order) {
          const orders = getStoredOrders();
          const idx = orders.findIndex(o => o.id === body.id);
          if (idx !== -1) {
            orders[idx] = json.order;
            saveOrders(orders);
          }
          return NextResponse.json(json);
        }
      }
    } catch (apiErr) {
      console.warn('[Orders PUT] FastAPI forward error, using local fallback:', apiErr);
    }

    // Local fallback update
    const orders = getStoredOrders();
    const index = orders.findIndex(o => o.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    orders[index] = { ...orders[index], ...body };
    saveOrders(orders);
    return NextResponse.json({ success: true, order: orders[index] });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

// DELETE delete order (Forward to FastAPI + local backup)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');

    // Forward to FastAPI
    try {
      const apiRes = await fetch(`${FASTAPI_BASE_URL}/api/orders?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: authHeader ? { 'authorization': authHeader } : {}
      });

      if (apiRes.status === 401 || apiRes.status === 403) {
        const errJson = await apiRes.json().catch(() => ({}));
        return NextResponse.json(errJson, { status: apiRes.status });
      }

      if (apiRes.ok) {
        let orders = getStoredOrders();
        orders = orders.filter(o => o.id !== id);
        saveOrders(orders);
        return NextResponse.json({ success: true, deletedId: id });
      }
    } catch (apiErr) {
      console.warn('[Orders DELETE] FastAPI forward error, using local fallback:', apiErr);
    }

    // Local fallback delete
    let orders = getStoredOrders();
    orders = orders.filter(o => o.id !== id);
    saveOrders(orders);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
