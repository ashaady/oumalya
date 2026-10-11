import json
import re
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.orm import Session

try:
    from database import get_db
    from models import Product, AdminUser
    from auth import get_current_admin
    import catalog_sync
except ImportError:
    from backend.database import get_db
    from backend.models import Product, AdminUser
    from backend.auth import get_current_admin
    from backend import catalog_sync

router = APIRouter(prefix="/api/products", tags=["Products"])

DEFAULT_PRODUCTS = [
    {
        "id": "crocs-noir",
        "name": "Crocs Hello Kitty Noir",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 15000,
        "color": "Noir",
        "sizes": ["36", "37", "38", "39", "40", "41"],
        "desc": "Une paire noire ornée de charms inspirés de Hello Kitty, parfaite pour ajouter une touche de fantaisie au quotidien.",
        "description": "Une paire noire ornée de charms inspirés de Hello Kitty, parfaite pour ajouter une touche de fantaisie au quotidien.",
        "detail": "Sabots avec bride arrière pivotante et ornements décoratifs. Disponibilité des pointures à confirmer lors de la commande.",
        "badges": "Coup de cœur",
        "badge": "Coup de cœur",
        "img": "/images/product-crocs-noir.jpg",
        "image": "/images/product-crocs-noir.jpg",
        "order": 1
    },
    {
        "id": "crocs-rose",
        "name": "Crocs Hello Kitty Rose",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 15000,
        "color": "Rose",
        "sizes": ["36", "37", "38", "39", "40", "41"],
        "desc": "Un rose tendre et de petits charms colorés pour une allure fraîche, ludique et confortable.",
        "description": "Un rose tendre et de petits charms colorés pour une allure fraîche, ludique et confortable.",
        "detail": "Sabots roses à bride pivotante avec décorations. Disponibilité des pointures à confirmer lors de la commande.",
        "badges": "Best-seller",
        "badge": "Best-seller",
        "img": "/images/product-crocs-rose.jpg",
        "image": "/images/product-crocs-rose.jpg",
        "order": 2
    },
    {
        "id": "abaya-noire",
        "name": "Abaya Élégante Noire",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Noir",
        "sizes": ["S", "M", "L", "XL"],
        "desc": "Une silhouette fluide et intemporelle, conçue pour une élégance simple au quotidien.",
        "description": "Une silhouette fluide et intemporelle, conçue pour une élégance simple au quotidien.",
        "detail": "Photographie illustrative. Matière, coupe exacte et tailles disponibles à confirmer avant la commande.",
        "badges": "Élégance",
        "badge": "Élégance",
        "img": "/images/product-abaya-noire.jpg",
        "image": "/images/product-abaya-noire.jpg",
        "order": 3
    },
    {
        "id": "abaya-taupe",
        "name": "Abaya Moderne Taupe",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Taupe",
        "sizes": ["S", "M", "L", "XL"],
        "desc": "Une abaya ample au coloris taupe délicat pour une garde-robe chic et facile à porter.",
        "description": "Une abaya ample au coloris taupe délicat pour une garde-robe chic et facile à porter.",
        "detail": "Photographie illustrative. Matière, coupe exacte et tailles disponibles à confirmer avant la commande.",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "/images/product-abaya-taupe.jpg",
        "image": "/images/product-abaya-taupe.jpg",
        "order": 4
    }
]

def format_product_dict(p: Product) -> dict:
    sizes_list = []
    if p.sizes:
        try:
            sizes_list = json.loads(p.sizes)
        except Exception:
            sizes_list = [s.strip() for s in p.sizes.split(",") if s.strip()]

    return {
        "id": p.id,
        "name": p.name,
        "cat": p.cat or p.category or "abayas",
        "category": p.category or p.cat or "abayas",
        "label": p.label or f"{p.cat.upper()} · COLLECTION",
        "catLabel": p.catLabel or p.label or f"{p.cat.upper()} · COLLECTION",
        "price": max(0, p.price),
        "color": p.color or "Noir",
        "sizes": sizes_list if sizes_list else (["36", "37", "38", "39", "40"] if p.cat == "crocs" else ["S", "M", "L", "XL"]),
        "desc": p.desc or p.description or "",
        "description": p.description or p.desc or "",
        "detail": p.detail or "",
        "badges": p.badges or p.badge or "Nouveauté",
        "badge": p.badge or p.badges or "Nouveauté",
        "img": p.img or p.image or "/images/hero-abaya-pink.jpg",
        "image": p.image or p.img or "/images/hero-abaya-pink.jpg",
        "order": p.order_num or 0
    }

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[\u0300-\u036f]', '', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

@router.get("")
def list_products(
    cat: Optional[str] = None,
    search: Optional[str] = None,
    reset: Optional[bool] = Query(False),
    db: Session = Depends(get_db)
):
    """Public endpoint to list all products"""
    if reset:
        # Reset catalog to default
        db.query(Product).delete()
        for idx, item in enumerate(DEFAULT_PRODUCTS):
            new_p = Product(
                id=item["id"],
                name=item["name"],
                cat=item["cat"],
                category=item["category"],
                label=item["label"],
                catLabel=item["catLabel"],
                price=item["price"],
                color=item["color"],
                sizes=json.dumps(item["sizes"]),
                desc=item["desc"],
                description=item["description"],
                detail=item["detail"],
                badges=item["badges"],
                badge=item["badge"],
                img=item["img"],
                image=item["image"],
                order_num=item["order"],
                created_at=str(time.time())
            )
            db.add(new_p)
        db.commit()
        catalog_sync.sync_db_to_supabase(db)

    query = db.query(Product)
    if cat and cat != "all":
        query = query.filter((Product.cat == cat) | (Product.category == cat))
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_filter)) |
            (Product.color.ilike(search_filter)) |
            (Product.desc.ilike(search_filter))
        )

    products = query.order_by(Product.order_num.asc()).all()
    return [format_product_dict(p) for p in products]

@router.get("/{id}")
def get_product(id: str, db: Session = Depends(get_db)):
    """Public endpoint to get a single product"""
    p = db.query(Product).filter(Product.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return format_product_dict(p)

@router.post("")
def create_product(
    body: dict = Body(...),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to add a new product"""
    raw_name = body.get("name", "Nouveau Produit").strip()
    raw_id = body.get("id")
    if not raw_id:
        slug = slugify(raw_name) or "produit"
        raw_id = f"{slug}-{str(int(time.time()))[-4:]}"

    cat = body.get("cat") or body.get("category") or "abayas"
    price = max(0, int(body.get("price") or 0))

    sizes = body.get("sizes")
    if isinstance(sizes, list):
        sizes_json = json.dumps(sizes)
    elif isinstance(sizes, str):
        sizes_json = json.dumps([s.strip() for s in sizes.split(",") if s.strip()])
    else:
        sizes_json = json.dumps(["36", "37", "38", "39", "40"] if cat == "crocs" else ["S", "M", "L", "XL"])

    img = body.get("img") or body.get("image") or "/images/hero-abaya-pink.jpg"
    badge = body.get("badge") or body.get("badges") or "Nouveauté"
    desc = body.get("desc") or body.get("description") or ""

    label = body.get("label") or f"{cat.upper()} · COLLECTION"
    catLabel = body.get("catLabel") or label

    new_prod = Product(
        id=raw_id,
        name=raw_name,
        cat=cat,
        category=cat,
        label=label,
        catLabel=catLabel,
        price=price,
        color=body.get("color", "Noir"),
        sizes=sizes_json,
        desc=desc,
        description=desc,
        detail=body.get("detail", "Disponibilité des tailles et modèles à confirmer avec la boutique."),
        badges=badge,
        badge=badge,
        img=img,
        image=img,
        order_num=int(body.get("order", 0) or 0),
        created_at=str(time.time())
    )

    merged_prod = db.merge(new_prod)
    db.commit()
    catalog_sync.sync_db_to_supabase(db)

    return {"success": True, "product": format_product_dict(merged_prod)}

@router.put("/{id}")
def update_product_by_id(
    id: str,
    body: dict = Body(...),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to update an existing product"""
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    if "name" in body:
        prod.name = body["name"].strip()
    if "cat" in body or "category" in body:
        cat = body.get("cat") or body.get("category")
        prod.cat = cat
        prod.category = cat
    if "price" in body:
        prod.price = max(0, int(body["price"] or 0))
    if "color" in body:
        prod.color = body["color"]
    if "sizes" in body:
        sizes = body["sizes"]
        if isinstance(sizes, list):
            prod.sizes = json.dumps(sizes)
        elif isinstance(sizes, str):
            prod.sizes = json.dumps([s.strip() for s in sizes.split(",") if s.strip()])
    if "desc" in body or "description" in body:
        desc = body.get("desc") or body.get("description")
        prod.desc = desc
        prod.description = desc
    if "detail" in body:
        prod.detail = body["detail"]
    if "badge" in body or "badges" in body:
        b = body.get("badge") or body.get("badges")
        prod.badge = b
        prod.badges = b
    if "img" in body or "image" in body:
        img = body.get("img") or body.get("image")
        prod.img = img
        prod.image = img
    if "order" in body:
        prod.order_num = int(body["order"] or 0)

    db.commit()
    db.refresh(prod)
    catalog_sync.sync_db_to_supabase(db)
    return {"success": True, "product": format_product_dict(prod)}

@router.put("")
def update_product_root(
    body: dict = Body(...),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only PUT endpoint with id in body"""
    prod_id = body.get("id")
    if not prod_id:
        raise HTTPException(status_code=400, detail="ID produit requis")
    return update_product_by_id(prod_id, body, admin, db)

@router.delete("/{id}")
def delete_product_by_id(
    id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to delete a product"""
    prod = db.query(Product).filter(Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Produit introuvable")

    db.delete(prod)
    db.commit()
    catalog_sync.sync_db_to_supabase(db)
    return {"success": True, "deletedId": id}

@router.delete("")
def delete_product_query(
    id: Optional[str] = Query(None),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only DELETE endpoint with id in query"""
    if not id:
        raise HTTPException(status_code=400, detail="ID produit requis")
    return delete_product_by_id(id, admin, db)
