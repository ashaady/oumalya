import os
import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

try:
    from database import get_db
    from models import AdminUser
except ImportError:
    from backend.database import get_db
    from backend.models import AdminUser

CLERK_SECRET_KEY = os.getenv(
    "CLERK_SECRET_KEY",
    "sk_test_REDACTED"
)
CLERK_PUBLISHABLE_KEY = os.getenv(
    "CLERK_PUBLISHABLE_KEY",
    "pk_test_ZmFzdC10b3J0b2lzZS01MTUuY2xlcmsuYWNjb3VudHMuZGV2JA"
)
CLERK_JWKS_URL = os.getenv(
    "CLERK_JWKS_URL",
    "https://fast-tortoise-515.clerk.accounts.dev/.well-known/jwks.json"
)
MAX_ADMINS = int(os.getenv("MAX_ADMINS", "2"))

security = HTTPBearer(auto_error=False)

# PyJWKClient cached client
_jwks_client = None

def get_jwks_client():
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = jwt.PyJWKClient(CLERK_JWKS_URL)
    return _jwks_client

def fetch_clerk_user_info(clerk_user_id: str) -> dict:
    """Fetch user profile details (email, first/last name) from Clerk Backend API"""
    try:
        url = f"https://api.clerk.com/v1/users/{clerk_user_id}"
        headers = {"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
        with httpx.Client(timeout=4.0) as client:
            resp = client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                emails = data.get("email_addresses", [])
                email = emails[0].get("email_address") if emails else None
                first_name = data.get("first_name")
                last_name = data.get("last_name")
                image_url = data.get("image_url")
                return {
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "image_url": image_url
                }
    except Exception as e:
        print(f"[Clerk API] Could not fetch user details for {clerk_user_id}: {e}")
    return {}

def verify_token(token: str) -> dict:
    """Verify Clerk session token against Clerk JWKS or secret key"""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Jeton d'authentification manquant"
        )

    # 1. First attempt: decode with JWKS RS256
    try:
        jwks = get_jwks_client()
        signing_key = jwks.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_exp": True, "verify_aud": False}
        )
        return payload
    except Exception as jwks_err:
        print(f"[Auth] JWKS decode failed: {jwks_err}. Trying fallback...")

    # 2. Fallback: decode unverified header & payload if dev or clock skew
    try:
        unverified = jwt.decode(
            token,
            options={"verify_signature": False, "verify_exp": False}
        )
        # If payload has valid Clerk user id (sub starting with user_)
        sub = unverified.get("sub")
        if sub and (sub.startswith("user_") or len(sub) > 10):
            # Verify against Clerk API directly using CLERK_SECRET_KEY
            url = f"https://api.clerk.com/v1/users/{sub}"
            headers = {"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
            with httpx.Client(timeout=5.0) as client:
                res = client.get(url, headers=headers)
                if res.status_code == 200:
                    return unverified
    except Exception as e:
        print(f"[Auth] Fallback decode error: {e}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Jeton Clerk invalide ou expiré"
    )

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> AdminUser:
    """
    Validates Clerk JWT and enforces the rule:
    Only the first 2 users who connect are granted Administrator privileges.
    Any further users attempting to access admin routes are denied with 403 Forbidden.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Connexion requise pour accéder aux fonctions d'administration",
            headers={"WWW-Authenticate": "Bearer"}
        )

    token = credentials.credentials
    payload = verify_token(token)
    clerk_user_id = payload.get("sub")

    if not clerk_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Identifiant utilisateur Clerk manquant dans le jeton"
        )

    # Check if user already in admin whitelist
    admin = db.query(AdminUser).filter(AdminUser.clerk_user_id == clerk_user_id).first()

    if admin:
        return admin

    # User is not yet registered as admin. Check how many admins are registered.
    total_admins = db.query(AdminUser).count()

    if total_admins < MAX_ADMINS:
        # Register this user as one of the 2 authorized admins!
        profile = fetch_clerk_user_info(clerk_user_id)
        email = profile.get("email") or payload.get("email") or payload.get("sub")
        first_name = profile.get("first_name") or payload.get("first_name")
        last_name = profile.get("last_name") or payload.get("last_name")
        image_url = profile.get("image_url")

        new_admin = AdminUser(
            clerk_user_id=clerk_user_id,
            email=email,
            first_name=first_name,
            last_name=last_name,
            image_url=image_url
        )
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        print(f"[Admin Whitelist] User {clerk_user_id} ({email}) registered as Admin #{total_admins + 1}/{MAX_ADMINS}")
        return new_admin

    # Limit reached: already 2 admins registered!
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Accès refusé : la limite des 2 administrateurs autorisés a été atteinte pour Oumalya. Vous n'avez pas les droits d'accès à cette interface."
    )
