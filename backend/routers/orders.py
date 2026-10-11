import json
import os
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

try:
    from database import get_db
    from models import Order, AdminUser
    from auth import get_current_admin
except ImportError:
    from backend.database import get_db
    from backend.models import Order, AdminUser
    from backend.auth import get_current_admin

router = APIRouter(prefix="/api/orders", tags=["Orders"])

def format_order_dict(o: Order) -> dict:
    items_list = []
    if o.items:
        try:
            items_list = json.loads(o.items)
        except Exception:
            items_list = []

    return {
        "id": o.id,
        "createdAt": o.created_at,
        "customer": {
            "prenom": o.customer_prenom or "",
            "nom": o.customer_nom or "",
            "telephone": o.customer_telephone or "",
            "ville": o.customer_ville or "",
            "adresse": o.customer_adresse or "",
            "livraison": o.customer_livraison or "Livraison à domicile",
            "note": o.customer_note or ""
        },
        "items": items_list,
        "subtotal": o.subtotal,
        "deliveryFee": o.delivery_fee,
        "total": o.total,
        "status": o.status
    }

@router.get("")
def list_orders(
    status: Optional[str] = None,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to list all customer orders"""
    query = db.query(Order)
    if status and status != "all":
        query = query.filter(Order.status == status)

    orders = query.order_by(Order.created_at.desc()).all()
    return [format_order_dict(o) for o in orders]

@router.get("/{id}")
def get_order(
    id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to view a specific order"""
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return format_order_dict(order)

@router.post("")
def create_order(
    body: dict = Body(...),
    db: Session = Depends(get_db)
):
    """Public endpoint for customer order placement"""
    count = db.query(Order).count()
    order_num = str(count + 1).zfill(3)
    order_id = body.get("id") or f"ORD-2026-{order_num}"
    created_at = body.get("createdAt") or time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())

    cust = body.get("customer") or {}
    items = body.get("items") or []
    subtotal = int(body.get("subtotal") or 0)
    delivery_fee = int(body.get("deliveryFee") or 2000)
    total = int(body.get("total") or (subtotal + delivery_fee))
    status_val = body.get("status") or "pending"

    new_order = Order(
        id=order_id,
        created_at=created_at,
        customer_prenom=cust.get("prenom", ""),
        customer_nom=cust.get("nom", ""),
        customer_telephone=cust.get("telephone", ""),
        customer_ville=cust.get("ville", ""),
        customer_adresse=cust.get("adresse", ""),
        customer_livraison=cust.get("livraison", "Livraison à domicile"),
        customer_note=cust.get("note", ""),
        items=json.dumps(items),
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        total=total,
        status=status_val
    )

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return {"success": True, "order": format_order_dict(new_order)}

@router.put("/{id}")
def update_order_by_id(
    id: str,
    body: dict = Body(...),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to update order status or details"""
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")

    if "status" in body:
        order.status = body["status"]
    if "deliveryFee" in body:
        order.delivery_fee = int(body["deliveryFee"])
    if "total" in body:
        order.total = int(body["total"])

    db.commit()
    db.refresh(order)
    return {"success": True, "order": format_order_dict(order)}

@router.put("")
def update_order_root(
    body: dict = Body(...),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only PUT endpoint with id in JSON body"""
    order_id = body.get("id")
    if not order_id:
        raise HTTPException(status_code=400, detail="ID commande requis")
    return update_order_by_id(order_id, body, admin, db)

@router.delete("/{id}")
def delete_order_by_id(
    id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to delete an order"""
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")

    db.delete(order)
    db.commit()
    return {"success": True, "deletedId": id}

@router.delete("")
def delete_order_query(
    id: Optional[str] = Query(None),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only DELETE endpoint with id in query"""
    if not id:
        raise HTTPException(status_code=400, detail="ID commande requis")
    return delete_order_by_id(id, admin, db)
