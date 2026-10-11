import json
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

try:
    from database import get_db
    from models import Setting, AdminUser
    from auth import get_current_admin
except ImportError:
    from backend.database import get_db
    from backend.models import Setting, AdminUser
    from backend.auth import get_current_admin

router = APIRouter(prefix="/api/settings", tags=["Store Settings"])

DEFAULT_SETTINGS = {
    "storePhone": "78 599 91 86",
    "storeEmail": "contact@oumalya.sn",
    "dakarFee": 2000,
    "banlieueFee": 3000,
    "regionFee": 5000,
    "announcement": "Livraison express à Dakar en 24h & expédition sécurisée dans toutes les régions du Sénégal"
}

def get_all_settings_dict(db: Session) -> dict:
    result = dict(DEFAULT_SETTINGS)
    rows = db.query(Setting).all()
    for row in rows:
        try:
            val = json.loads(row.value)
        except Exception:
            val = row.value
        result[row.key] = val
    return result

@router.get("")
def get_store_settings(db: Session = Depends(get_db)):
    """Public endpoint to fetch store phone, delivery fees, and announcements"""
    return get_all_settings_dict(db)

@router.put("")
def update_store_settings(
    body: dict = Body(...),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to update store configuration"""
    for key, val in body.items():
        val_str = json.dumps(val) if not isinstance(val, str) else json.dumps(val)
        existing = db.query(Setting).filter(Setting.key == key).first()
        if existing:
            existing.value = val_str
        else:
            db.add(Setting(key=key, value=val_str))

    db.commit()
    updated = get_all_settings_dict(db)
    return {"success": True, "settings": updated}
