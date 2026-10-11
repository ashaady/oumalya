from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

try:
    from database import get_db
    from models import AdminUser
    from schemas import AdminVerifyResponse, AdminUserOut
    from auth import get_current_admin, MAX_ADMINS
except ImportError:
    from backend.database import get_db
    from backend.models import AdminUser
    from backend.schemas import AdminVerifyResponse, AdminUserOut
    from backend.auth import get_current_admin, MAX_ADMINS

router = APIRouter(prefix="/api/admin", tags=["Admin Auth & Management"])

@router.get("/verify", response_model=AdminVerifyResponse)
def verify_admin_status(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    Checks that the current Clerk user is authorized as one of the 2 store administrators.
    If the user is among the first 2 connected, they are whitelisted and returned.
    """
    all_admins = db.query(AdminUser).order_by(AdminUser.id.asc()).all()
    slot = 1
    for idx, a in enumerate(all_admins):
        if a.clerk_user_id == admin.clerk_user_id:
            slot = idx + 1
            break

    return AdminVerifyResponse(
        authorized=True,
        clerk_user_id=admin.clerk_user_id,
        email=admin.email,
        first_name=admin.first_name,
        last_name=admin.last_name,
        role="admin",
        admin_slot=slot,
        total_admins=len(all_admins),
        max_admins=MAX_ADMINS,
        message=f"Administrateur #{slot} sur {MAX_ADMINS} autorisé"
    )

@router.get("/list", response_model=List[AdminUserOut])
def list_admins(
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Lists the registered administrators (maximum 2)"""
    return db.query(AdminUser).order_by(AdminUser.id.asc()).all()

@router.delete("/revoke/{clerk_user_id}")
def revoke_admin(
    clerk_user_id: str,
    admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Allows an administrator to revoke another admin slot or reset a seat"""
    target = db.query(AdminUser).filter(AdminUser.clerk_user_id == clerk_user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Administrateur introuvable")

    db.delete(target)
    db.commit()
    return {"success": True, "message": f"Administrateur {clerk_user_id} révoqué"}
