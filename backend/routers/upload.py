import os
import re
import time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Query
from sqlalchemy.orm import Session

try:
    from database import get_db
    from models import StoredImage, AdminUser
    from auth import get_current_admin
    from supabase_client import upload_image_to_supabase, delete_image_from_supabase
except ImportError:
    from backend.database import get_db
    from backend.models import StoredImage, AdminUser
    from backend.auth import get_current_admin
    from backend.supabase_client import upload_image_to_supabase, delete_image_from_supabase

router = APIRouter(tags=["Images & Upload"])

@router.post("/api/upload")
async def upload_image(
    file: UploadFile = File(...),
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to upload product images directly to Supabase CDN & persistent storage"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier invalide")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide")

    ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
    base_name = os.path.splitext(file.filename)[0]
    clean_base = re.sub(r'[^a-z0-9_-]', '-', base_name.lower())[:30] or "img"

    image_id = f"{clean_base}-{int(time.time() * 1000)}"
    full_filename = f"{image_id}{ext}"
    mime_type = file.content_type or ("image/png" if ext == ".png" else "image/jpeg")

    # 1. Upload to Supabase Storage Bucket (oumalya-images)
    supabase_res = upload_image_to_supabase(file.filename, content, mime_type)
    final_url = supabase_res.get("url") if supabase_res.get("success") else f"/api/images/{image_id}"

    # 2. Local persistence in SQLite as reliable fallback
    new_img = StoredImage(
        id=image_id,
        filename=full_filename,
        mime_type=mime_type,
        size=len(content),
        data=content,
        created_at=time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime())
    )

    db.add(new_img)
    db.commit()

    return {
        "success": True,
        "id": image_id,
        "filename": full_filename,
        "mime_type": mime_type,
        "size": len(content),
        "url": final_url,
        "storage": "supabase" if supabase_res.get("success") else "sqlite"
    }

@router.get("/api/images/{image_id}")
def serve_image(image_id: str, db: Session = Depends(get_db)):
    """Public endpoint to serve stored image bytes"""
    clean_id = re.sub(r'\.[a-zA-Z0-9]+$', '', image_id)
    img = db.query(StoredImage).filter(
        (StoredImage.id == clean_id) | (StoredImage.id == image_id) | (StoredImage.filename == image_id)
    ).first()

    if not img or not img.data:
        raise HTTPException(status_code=404, detail="Image introuvable")

    return Response(
        content=img.data,
        media_type=img.mime_type or "image/jpeg",
        headers={
            "Cache-Control": "public, max-age=86400, immutable",
            "Content-Disposition": f'inline; filename="{img.filename}"'
        }
    )

@router.get("/api/images")
def list_images(
    limit: int = 50,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to list recent uploaded images"""
    images = db.query(StoredImage).order_by(StoredImage.created_at.desc()).limit(limit).all()
    return [
        {
            "id": img.id,
            "filename": img.filename,
            "mime_type": img.mime_type,
            "size": img.size,
            "created_at": img.created_at,
            "url": f"/api/images/{img.id}"
        }
        for img in images
    ]

@router.delete("/api/images/{image_id}")
def delete_image(
    image_id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Admin-only endpoint to delete an image"""
    clean_id = re.sub(r'\.[a-zA-Z0-9]+$', '', image_id)
    img = db.query(StoredImage).filter(
        (StoredImage.id == clean_id) | (StoredImage.id == image_id) | (StoredImage.filename == image_id)
    ).first()

    if not img:
        raise HTTPException(status_code=404, detail="Image introuvable")

    db.delete(img)
    db.commit()
    return {"success": True, "deletedId": image_id}
