import json
import re
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

try:
    from database import get_db
    from models import Category, AdminUser
    from auth import get_current_admin
except ImportError:
    from backend.database import get_db
    from backend.models import Category, AdminUser
    from backend.auth import get_current_admin

router = APIRouter(prefix="/api/categories", tags=["Categories"])

DEFAULT_CATEGORIES = [
    {
        "id": "abayas",
        "name": "Abayas & Hijabs",
        "label": "ABAYAS · COLLECTION",
        "icon": "👗",
        "image": "/images/category-abayas.jpg",
        "defaultSizes": ["S", "M", "L", "XL"],
        "isDefault": True
    },
    {
        "id": "crocs",
        "name": "Crocs Customisées",
        "label": "CROCS · COLLECTION",
        "icon": "👡",
        "image": "/images/category-crocs.jpg",
        "defaultSizes": ["36", "37", "38", "39", "40", "41"],
        "isDefault": True
    }
]

def format_category_dict(c: Category) -> dict:
    sizes = ["Standard"]
    if c.default_sizes:
        try:
            sizes = json.loads(c.default_sizes)
        except Exception:
            sizes = [s.strip() for s in c.default_sizes.split(",") if s.strip()]

    return {
        "id": c.id,
        "name": c.name,
        "label": c.label or f"{c.name.upper()} · COLLECTION",
        "icon": c.icon or "✨",
        "image": c.image or "/images/category-abayas.jpg",
        "defaultSizes": sizes,
        "isDefault": bool(c.is_default)
    }

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[\u0300-\u036f]', '', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

@router.get("")
def list_categories(db: Session = Depends(get_db)):
    """Public endpoint to list all available product categories"""
    cats = db.query(Category).order_by(Category.order_num.asc()).all()
    if not cats:
        # Seed default categories
        for idx, item in enumerate(DEFAULT_CATEGORIES):
            cat_obj = Category(
                id=item["id"],
                name=item["name"],
                label=item["label"],
                icon=item["icon"],
                image=item["image"],
                default_sizes=json.dumps(item["defaultSizes"]),
                is_default=1 if item["isDefault"] else 0,
                order_num=idx + 1,
                created_at=str(time.time())
            )
            db.add(cat_obj)
        db.commit()
        cats = db.query(Category).order_by(Category.order_num.asc()).all()

    return [format_category_dict(c) for c in cats]

@router.post("")
def create_category(
    body: dict = Body(...),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to add a new category"""
    name = (body.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Le nom de la catégorie est obligatoire")

    cat_id = body.get("id") or slugify(name)
    if not cat_id:
        cat_id = f"cat-{int(time.time())}"

    # Check if category ID exists
    existing = db.query(Category).filter(Category.id == cat_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Cette catégorie existe déjà")

    default_sizes = body.get("defaultSizes") or body.get("sizes")
    if isinstance(default_sizes, list):
        sizes_json = json.dumps(default_sizes)
    elif isinstance(default_sizes, str):
        sizes_json = json.dumps([s.strip() for s in default_sizes.split(",") if s.strip()])
    else:
        sizes_json = json.dumps(["Standard"])

    label = body.get("label") or f"{name.upper()} · COLLECTION"
    icon = body.get("icon") or "✨"
    image = body.get("image") or "/images/category-abayas.jpg"

    new_cat = Category(
        id=cat_id,
        name=name,
        label=label,
        icon=icon,
        image=image,
        default_sizes=sizes_json,
        is_default=0,
        order_num=10,
        created_at=str(time.time())
    )

    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)

    return {"success": True, "category": format_category_dict(new_cat)}

@router.delete("/{id}")
def delete_category_by_id(
    id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to delete a custom category"""
    cat = db.query(Category).filter(Category.id == id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie introuvable")

    if cat.is_default or cat.id in ["abayas", "crocs"]:
        raise HTTPException(status_code=400, detail="Impossible de supprimer les catégories fondamentales par défaut")

    db.delete(cat)
    db.commit()
    return {"success": True, "deletedId": id}

@router.delete("")
def delete_category_query(
    id: Optional[str] = Query(None),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only DELETE endpoint with id in query parameter"""
    if not id:
        raise HTTPException(status_code=400, detail="ID catégorie requis")
    return delete_category_by_id(id, admin, db)
