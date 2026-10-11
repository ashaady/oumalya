from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    cat: Optional[str] = "abayas"
    category: Optional[str] = "abayas"
    label: Optional[str] = None
    catLabel: Optional[str] = None
    price: int = Field(ge=0, default=15000)
    color: Optional[str] = "Noir"
    sizes: Optional[List[str]] = ["S", "M", "L", "XL"]
    desc: Optional[str] = ""
    description: Optional[str] = ""
    detail: Optional[str] = ""
    badges: Optional[str] = "Nouveauté"
    badge: Optional[str] = "Nouveauté"
    img: Optional[str] = "/images/hero-abaya-pink.jpg"
    image: Optional[str] = "/images/hero-abaya-pink.jpg"
    order: Optional[int] = 0

class ProductCreate(ProductBase):
    id: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    cat: Optional[str] = None
    category: Optional[str] = None
    label: Optional[str] = None
    catLabel: Optional[str] = None
    price: Optional[int] = Field(None, ge=0)
    color: Optional[str] = None
    sizes: Optional[List[str]] = None
    desc: Optional[str] = None
    description: Optional[str] = None
    detail: Optional[str] = None
    badges: Optional[str] = None
    badge: Optional[str] = None
    img: Optional[str] = None
    image: Optional[str] = None
    order: Optional[int] = None

class ProductOut(ProductBase):
    id: str

    class Config:
        from_attributes = True

# --- Category Schemas ---
class CategoryCreate(BaseModel):
    id: Optional[str] = None
    name: str
    label: Optional[str] = None
    icon: Optional[str] = "✨"
    image: Optional[str] = "/images/category-abayas.jpg"
    defaultSizes: Optional[List[str]] = ["Standard"]
    isDefault: Optional[bool] = False

class CategoryOut(BaseModel):
    id: str
    name: str
    label: Optional[str] = None
    icon: Optional[str] = "✨"
    image: Optional[str] = "/images/category-abayas.jpg"
    defaultSizes: Optional[List[str]] = ["Standard"]
    isDefault: Optional[bool] = False

    class Config:
        from_attributes = True

# --- Order Schemas ---
class OrderItem(BaseModel):
    id: str
    name: str
    size: str
    qty: int
    price: int
    img: str

class CustomerInfo(BaseModel):
    prenom: Optional[str] = ""
    nom: Optional[str] = ""
    telephone: Optional[str] = ""
    ville: Optional[str] = ""
    adresse: Optional[str] = ""
    livraison: Optional[str] = "Livraison à domicile"
    note: Optional[str] = ""

class OrderCreate(BaseModel):
    id: Optional[str] = None
    customer: CustomerInfo
    items: List[OrderItem] = []
    subtotal: int = 0
    deliveryFee: int = 2000
    total: int = 0
    status: Optional[str] = "pending"

class OrderUpdate(BaseModel):
    id: Optional[str] = None
    status: Optional[str] = None
    customer: Optional[CustomerInfo] = None
    deliveryFee: Optional[int] = None
    total: Optional[int] = None

class OrderOut(BaseModel):
    id: str
    createdAt: str
    customer: CustomerInfo
    items: List[OrderItem]
    subtotal: int
    deliveryFee: int
    total: int
    status: str

    class Config:
        from_attributes = True

# --- Store Settings ---
class SettingsData(BaseModel):
    storePhone: str = "78 599 91 86"
    storeEmail: str = "contact@oumalya.sn"
    dakarFee: int = 2000
    banlieueFee: int = 3000
    regionFee: int = 5000
    announcement: str = "Livraison express à Dakar en 24h & expédition sécurisée dans toutes les régions du Sénégal"

# --- Admin & Auth Schemas ---
class AdminUserOut(BaseModel):
    id: int
    clerk_user_id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    created_at: Any

    class Config:
        from_attributes = True

class AdminVerifyResponse(BaseModel):
    authorized: bool
    clerk_user_id: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str = "admin"
    admin_slot: int
    total_admins: int
    max_admins: int = 2
    message: str = "Administrateur autorisé"
