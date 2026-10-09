import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

// GET all orders
export async function GET() {
  const orders = getStoredOrders();
  return NextResponse.json(orders);
}

// POST create new order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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

    orders.unshift(newOrder); // newest first
    saveOrders(orders);

    return NextResponse.json({ success: true, order: newOrder });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement de la commande' }, { status: 500 });
  }
}

// PUT update order status
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });
    }

    const orders = getStoredOrders();
    const index = orders.findIndex(o => o.id === body.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    orders[index] = {
      ...orders[index],
      ...body
    };

    saveOrders(orders);
    return NextResponse.json({ success: true, order: orders[index] });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

// DELETE delete order
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID commande requis' }, { status: 400 });
    }

    let orders = getStoredOrders();
    orders = orders.filter(o => o.id !== id);
    saveOrders(orders);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
