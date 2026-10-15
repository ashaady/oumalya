import os
import time
import json
import httpx
from typing import Optional, List, Dict, Any

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://jufenigdvmpjwguyjwqw.supabase.co").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_KEY", "")
BUCKET = "oumalya-images"
FILE_NAME = "oumalya_catalog.json"

DEFAULT_HOMEPAGE = {
    "slides": [
        {
            "id": "slide-1",
            "eyebrow": "NOUVELLE COLLECTION",
            "top": "Élégance",
            "accent": "au quotidien",
            "desc": "Des abayas modernes et des Crocs tendance pour un style qui vous ressemble.",
            "image": "/images/hero-abaya-pink.jpg",
            "objectPosition": "center 15%",
            "buttonText": "Découvrir la collection",
            "buttonLink": "/boutique"
        },
        {
            "id": "slide-2",
            "eyebrow": "LA COLLECTION ABAYAS",
            "top": "La beauté",
            "accent": "en toute simplicité",
            "desc": "Découvrez des pièces élégantes et confortables à porter chaque jour.",
            "image": "/images/hero-abaya-pink.jpg",
            "objectPosition": "center 15%",
            "buttonText": "Voir les abayas",
            "buttonLink": "/boutique?categorie=abayas"
        },
        {
            "id": "slide-3",
            "eyebrow": "NOTRE UNIVERS",
            "top": "Style &",
            "accent": "douceur",
            "desc": "Des essentiels féminins sélectionnés avec soin pour vous.",
            "image": "/images/hero-abaya-pink.jpg",
            "objectPosition": "center 15%",
            "buttonText": "Nos créations",
            "buttonLink": "/boutique"
        }
    ],
    "categoryCards": [
        {
            "id": "abayas",
            "title": "Abayas",
            "subtitle": "Élégance, confort et modernité",
            "image": "/images/category-abayas.jpg",
            "objectPosition": "center 15%",
            "link": "/boutique?categorie=abayas"
        },
        {
            "id": "crocs",
            "title": "Crocs",
            "subtitle": "Confort et style au quotidien",
            "image": "/images/category-crocs.jpg",
            "objectPosition": "center",
            "link": "/boutique?categorie=crocs"
        }
    ],
    "promoBanner": {
        "title": "Confort & Élégance",
        "desc": "Découvrez notre sélection de Crocs tendance pour toutes les occasions.",
        "image": "/images/promo-crocs.jpg",
        "objectPosition": "center",
        "buttonText": "Découvrir les Crocs",
        "buttonLink": "/boutique?categorie=crocs"
    }
}

def get_catalog_from_supabase() -> Optional[dict]:
    """Reads persistent catalog from Supabase CDN (persistent across container redeployments)"""
    url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{FILE_NAME}?t={int(time.time() * 1000)}"
    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.get(url, headers={"User-Agent": "Mozilla/5.0 OumalyaFastAPI/1.0"})
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, dict):
                    return data
    except Exception as e:
        print(f"[Supabase Sync] Read error: {e}")
    return None

def save_catalog_to_supabase(
    products: Optional[List[dict]] = None,
    categories: Optional[List[dict]] = None,
    homepage: Optional[dict] = None
) -> bool:
    """Upserts persistent catalog to Supabase Cloud Storage"""
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{FILE_NAME}"
    try:
        existing = get_catalog_from_supabase() or {}
        final_products = products if products is not None else existing.get("products", [])
        final_categories = categories if categories is not None else existing.get("categories", [])
        final_homepage = homepage if homepage is not None else existing.get("homepage", DEFAULT_HOMEPAGE)

        payload = {
            "initialized": True,
            "version": existing.get("version", 0) + 1,
            "last_updated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "products": final_products,
            "categories": final_categories,
            "homepage": final_homepage
        }

        headers = {
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "apikey": SUPABASE_KEY,
            "Content-Type": "application/json",
            "x-upsert": "true"
        }
        with httpx.Client(timeout=10.0) as client:
            resp = client.post(upload_url, headers=headers, content=json.dumps(payload, ensure_ascii=False).encode("utf-8"))
            return resp.status_code in [200, 201]
    except Exception as e:
        print(f"[Supabase Sync] Upload error: {e}")
        return False

def sync_db_to_supabase(db) -> bool:
    """Serializes all products, categories and homepage from current DB session and uploads to Supabase Storage"""
    try:
        try:
            from models import Product, Category, Setting
        except ImportError:
            from backend.models import Product, Category, Setting

        # 1. Format all products
        db_products = db.query(Product).order_by(Product.order_num.asc()).all()
        formatted_prods = []
        for p in db_products:
            sizes_list = []
            if p.sizes:
                try:
                    sizes_list = json.loads(p.sizes)
                except Exception:
                    sizes_list = [s.strip() for s in p.sizes.split(",") if s.strip()]

            formatted_prods.append({
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
            })

        # 2. Format all categories
        db_categories = db.query(Category).order_by(Category.order_num.asc()).all()
        formatted_cats = []
        for c in db_categories:
            sizes = ["Standard"]
            if c.default_sizes:
                try:
                    sizes = json.loads(c.default_sizes)
                except Exception:
                    sizes = [s.strip() for s in c.default_sizes.split(",") if s.strip()]

            formatted_cats.append({
                "id": c.id,
                "name": c.name,
                "label": c.label or f"{c.name.upper()} · COLLECTION",
                "icon": c.icon or "✨",
                "image": c.image or "/images/category-abayas.jpg",
                "defaultSizes": sizes,
                "isDefault": bool(c.is_default)
            })

        # 3. Retrieve homepage settings
        home_row = db.query(Setting).filter(Setting.key == "homepage_settings").first()
        home_data = DEFAULT_HOMEPAGE
        if home_row:
            try:
                home_data = json.loads(home_row.value)
            except Exception:
                pass

        return save_catalog_to_supabase(products=formatted_prods, categories=formatted_cats, homepage=home_data)
    except Exception as e:
        print(f"[Supabase Sync] sync_db_to_supabase error: {e}")
        return False

def restore_supabase_to_db(db) -> bool:
    """Restores catalog and homepage from Supabase Storage into local SQLite session on container startup"""
    try:
        try:
            from models import Product, Category, Setting
        except ImportError:
            from backend.models import Product, Category, Setting

        catalog = get_catalog_from_supabase()
        if not catalog or not catalog.get("initialized"):
            return False

        cloud_categories = catalog.get("categories")
        cloud_products = catalog.get("products")
        cloud_homepage = catalog.get("homepage")

        # Restore categories
        if isinstance(cloud_categories, list) and len(cloud_categories) > 0:
            db.query(Category).delete()
            for idx, item in enumerate(cloud_categories):
                cat_obj = Category(
                    id=item["id"],
                    name=item["name"],
                    label=item.get("label"),
                    icon=item.get("icon", "✨"),
                    image=item.get("image", "/images/category-abayas.jpg"),
                    default_sizes=json.dumps(item.get("defaultSizes", ["Standard"])),
                    is_default=1 if item.get("isDefault") else 0,
                    order_num=idx + 1,
                    created_at=str(time.time())
                )
                db.add(cat_obj)
            db.commit()

        # Restore products
        if isinstance(cloud_products, list):
            db.query(Product).delete()
            for item in cloud_products:
                sizes_val = item.get("sizes", [])
                sizes_json = json.dumps(sizes_val) if isinstance(sizes_val, list) else str(sizes_val)
                new_p = Product(
                    id=item["id"],
                    name=item["name"],
                    cat=item.get("cat") or item.get("category") or "abayas",
                    category=item.get("category") or item.get("cat") or "abayas",
                    label=item.get("label"),
                    catLabel=item.get("catLabel"),
                    price=item.get("price", 0),
                    color=item.get("color", "Noir"),
                    sizes=sizes_json,
                    desc=item.get("desc") or item.get("description") or "",
                    description=item.get("description") or item.get("desc") or "",
                    detail=item.get("detail", ""),
                    badges=item.get("badges") or item.get("badge") or "",
                    badge=item.get("badge") or item.get("badges") or "",
                    img=item.get("img") or item.get("image") or "",
                    image=item.get("image") or item.get("img") or "",
                    order_num=item.get("order", 0),
                    created_at=str(time.time())
                )
                db.add(new_p)
            db.commit()

        # Restore homepage settings
        if isinstance(cloud_homepage, dict):
            db.merge(Setting(key="homepage_settings", value=json.dumps(cloud_homepage)))
            db.commit()

        db.merge(Setting(key="catalog_seeded", value="true"))
        db.commit()
        return True
    except Exception as e:
        print(f"[Supabase Sync] restore_supabase_to_db error: {e}")
        return False
