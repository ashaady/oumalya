import json
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

try:
    from database import get_db
    from models import Setting, AdminUser
    from auth import get_current_admin
    import catalog_sync
except ImportError:
    from backend.database import get_db
    from backend.models import Setting, AdminUser
    from backend.auth import get_current_admin
    from backend import catalog_sync

router = APIRouter(prefix="/api/homepage", tags=["Homepage Visuals"])

@router.get("")
def get_homepage_settings(db: Session = Depends(get_db)):
    """Public endpoint to fetch homepage slides, category banners, and promo visuals"""
    row = db.query(Setting).filter(Setting.key == "homepage_settings").first()
    if row and row.value:
        try:
            return json.loads(row.value)
        except Exception:
            pass

    # Fallback to Supabase Storage CDN
    cloud = catalog_sync.get_catalog_from_supabase()
    if cloud and isinstance(cloud.get("homepage"), dict):
        # Cache in local DB
        db.merge(Setting(key="homepage_settings", value=json.dumps(cloud["homepage"])))
        db.commit()
        return cloud["homepage"]

    return catalog_sync.DEFAULT_HOMEPAGE

@router.put("")
def update_homepage_settings(
    body: dict = Body(...),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to update homepage slides, category cards, and promo images"""
    val_str = json.dumps(body, ensure_ascii=False)
    existing = db.query(Setting).filter(Setting.key == "homepage_settings").first()
    if existing:
        existing.value = val_str
    else:
        db.add(Setting(key="homepage_settings", value=val_str))

    db.commit()
    catalog_sync.sync_db_to_supabase(db)

    return {"success": True, "homepage": body}
