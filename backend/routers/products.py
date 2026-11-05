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
        "id": "crocs-marron-3367",
        "name": "Crocs Marron",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Marron",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743326497.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743326497.jpeg",
        "order": 0
    },
    {
        "id": "crocs-rose-design-3434",
        "name": "Crocs Rose & Design",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Rose",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743383867.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743383867.jpeg",
        "order": 0
    },
    {
        "id": "crocs-bleu-3495",
        "name": "Crocs Bleu",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Bleu",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743456730.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743456730.jpeg",
        "order": 0
    },
    {
        "id": "crocs-yukon-3582",
        "name": "Crocs Yukon",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Beige",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743514225.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743514225.jpeg",
        "order": 0
    },
    {
        "id": "crocs-rose-fonc-3645",
        "name": "Crocs Rose foncé",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Rose foncé",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743600864.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743600864.jpeg",
        "order": 0
    },
    {
        "id": "crocs-noir-3695",
        "name": "Crocs Noir",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Noir",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743665348.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743665348.jpeg",
        "order": 0
    },
    {
        "id": "crocs-rose-bonbon-3782",
        "name": "Crocs Rose bonbon",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Rose clair",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "24",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743714981.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743714981.jpeg",
        "order": 0
    },
    {
        "id": "crocs-gris-3864",
        "name": "Crocs Gris",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Gris",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743806588.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743806588.jpeg",
        "order": 0
    },
    {
        "id": "crocs-hello-kitty-3925",
        "name": "Crocs Hello Kitty",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Noir",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743884568.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-1-1791743884568.jpeg",
        "order": 0
    },
    {
        "id": "crocs-vert-kaki-3981",
        "name": "Crocs Vert Kaki",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Vert kaki",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791743948486.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791743948486.jpeg",
        "order": 0
    },
    {
        "id": "crocs-blanc-4070",
        "name": "Crocs Blanc",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Blanc",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744032933.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744032933.jpeg",
        "order": 0
    },
    {
        "id": "crocs-bleu-fonc-4169",
        "name": "Crocs Bleu foncé",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Bleu foncé",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791746056929.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791746056929.jpeg",
        "order": 0
    },
    {
        "id": "crocs-violet-4265",
        "name": "Crocs Violet",
        "cat": "crocs",
        "category": "crocs",
        "label": "CROCS · COLLECTION",
        "catLabel": "CROCS · COLLECTION",
        "price": 10000,
        "color": "Violet",
        "sizes": [
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744224422.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744224422.jpeg",
        "order": 0
    },
    {
        "id": "abaya-marron-dentelle-4497",
        "name": "Abaya Marron dentelle",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Marron foncé",
        "sizes": [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744321084.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744321084.jpeg",
        "order": 0
    },
    {
        "id": "abaya-rose-poudr-4566",
        "name": "Abaya Rose poudré",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Rose clair",
        "sizes": [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744508368.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744508368.jpeg",
        "order": 0
    },
    {
        "id": "abaya-rose-dentelle-4644",
        "name": "Abaya Rose dentelle",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Rose clair",
        "sizes": [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744578798.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744578798.jpeg",
        "order": 0
    },
    {
        "id": "abaya-rouge-dentelle-4699",
        "name": "Abaya Rouge dentelle",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Rouge",
        "sizes": [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744657357.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744657357.jpeg",
        "order": 0
    },
    {
        "id": "abaya-moderne-4751",
        "name": "Abaya Moderne",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Rose , Jaune",
        "sizes": [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744711882.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744711882.jpeg",
        "order": 0
    },
    {
        "id": "abaya-marron-details-4811",
        "name": "Abaya Marron & details",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Marron",
        "sizes": [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744763849.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744763849.jpeg",
        "order": 0
    },
    {
        "id": "abaya-jaune-fleurette-4877",
        "name": "Abaya Jaune fleurette",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Jaune",
        "sizes": [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744837595.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744837595.jpeg",
        "order": 0
    },
    {
        "id": "abaya-classic-noir-4947",
        "name": "Abaya Classic Noir",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Noir",
        "sizes": [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744891725.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744891725.jpeg",
        "order": 0
    },
    {
        "id": "abaya-blanc-details-5034",
        "name": "Abaya Blanc & details",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Blanc",
        "sizes": [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744960725.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-10-at-2-1791744960725.jpeg",
        "order": 0
    },
    {
        "id": "abaya-premium-5175",
        "name": "Abaya Premium",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 30000,
        "color": "Beige",
        "sizes": [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Nouveauté",
        "badge": "Nouveauté",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-11-at-0-1791745088930.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-11-at-0-1791745088930.jpeg",
        "order": 0
    },
    {
        "id": "abaya-classe-bleu-fonc-5258",
        "name": "Abaya Classe Bleu foncé",
        "cat": "abayas",
        "category": "abayas",
        "label": "ABAYAS · COLLECTION",
        "catLabel": "ABAYAS · COLLECTION",
        "price": 25000,
        "color": "Bleu foncé",
        "sizes": [
            "XS",
            "S",
            "M",
            "L",
            "XL",
            "XXL",
            "XXXL"
        ],
        "desc": "",
        "description": "",
        "detail": "",
        "badges": "Populaire",
        "badge": "Populaire",
        "img": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-11-at-0-1791745211135.jpeg",
        "image": "https://jufenigdvmpjwguyjwqw.supabase.co/storage/v1/object/public/oumalya-images/whatsapp-image-2026-10-11-at-0-1791745211135.jpeg",
        "order": 0
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

@router.get("/restore")
@router.post("/restore")
def restore_products_endpoint(db: Session = Depends(get_db)):
    """Force restore products and categories from Supabase Storage"""
    res = catalog_sync.restore_supabase_to_db(db)
    prods = db.query(Product).order_by(Product.order_num.asc()).all()
    return {"success": res, "count": len(prods), "products": [format_product_dict(p) for p in prods]}

@router.get("")
def list_products(
    cat: Optional[str] = None,
    search: Optional[str] = None,
    reset: Optional[bool] = Query(False),
    restore: Optional[bool] = Query(False),
    db: Session = Depends(get_db)
):
    """Public endpoint to list all products"""
    if restore:
        catalog_sync.restore_supabase_to_db(db)

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
        # Note: Do not wipe Supabase Storage on reset so custom products are never permanently lost

    # Auto-restore from Supabase if DB currently has only the 4 test products or is empty
    count = db.query(Product).count()
    if count <= 4:
        db_ids = {p.id for p in db.query(Product.id).all()}
        default_test_ids = {"crocs-noir", "crocs-rose", "abaya-noire", "abaya-taupe"}
        if db_ids.issubset(default_test_ids) or count == 0:
            catalog_sync.restore_supabase_to_db(db)

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
