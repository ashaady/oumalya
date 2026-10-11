import json
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure both current directory and parent are in sys.path
CUR_DIR = os.path.dirname(os.path.abspath(__file__))
if CUR_DIR not in sys.path:
    sys.path.insert(0, CUR_DIR)
PARENT_DIR = os.path.dirname(CUR_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)

try:
    from database import Base, engine, SessionLocal
    from models import Product, Category, Order, Setting, AdminUser
    from routers import products, categories, orders, upload, settings, admin
except ImportError:
    from backend.database import Base, engine, SessionLocal
    from backend.models import Product, Category, Order, Setting, AdminUser
    from backend.routers import products, categories, orders, upload, settings, admin

# Initialize DB tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created
    Base.metadata.create_all(bind=engine)

    # Seed data if empty
    db = SessionLocal()
    try:
        # Check products - only seed once on very first launch
        seeded_flag = db.query(Setting).filter(Setting.key == "catalog_seeded").first()
        if not seeded_flag:
            prod_count = db.query(Product).count()
            if prod_count == 0:
                for item in products.DEFAULT_PRODUCTS:
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
                        created_at="1728000000"
                    )
                    db.add(new_p)
            db.merge(Setting(key="catalog_seeded", value="true"))
            db.commit()

        # Check categories
        cat_count = db.query(Category).count()
        if cat_count == 0:
            for idx, item in enumerate(categories.DEFAULT_CATEGORIES):
                new_c = Category(
                    id=item["id"],
                    name=item["name"],
                    label=item["label"],
                    icon=item["icon"],
                    image=item["image"],
                    default_sizes=json.dumps(item["defaultSizes"]),
                    is_default=1 if item["isDefault"] else 0,
                    order_num=idx + 1,
                    created_at="1728000000"
                )
                db.add(new_c)
            db.commit()

        # Check orders from data/orders.json if present
        order_count = db.query(Order).count()
        orders_json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "orders.json")
        if order_count == 0 and os.path.exists(orders_json_path):
            try:
                with open(orders_json_path, "r", encoding="utf-8") as f:
                    saved_orders = json.load(f)
                    if isinstance(saved_orders, list):
                        for o in saved_orders:
                            cust = o.get("customer", {})
                            new_ord = Order(
                                id=o.get("id"),
                                created_at=o.get("createdAt", ""),
                                customer_prenom=cust.get("prenom", ""),
                                customer_nom=cust.get("nom", ""),
                                customer_telephone=cust.get("telephone", ""),
                                customer_ville=cust.get("ville", ""),
                                customer_adresse=cust.get("adresse", ""),
                                customer_livraison=cust.get("livraison", "Livraison à domicile"),
                                customer_note=cust.get("note", ""),
                                items=json.dumps(o.get("items", [])),
                                subtotal=int(o.get("subtotal", 0)),
                                delivery_fee=int(o.get("deliveryFee", 2000)),
                                total=int(o.get("total", 0)),
                                status=o.get("status", "pending")
                            )
                            db.add(new_ord)
                        db.commit()
            except Exception as e:
                print(f"[Lifespan] Order import notice: {e}")
    finally:
        db.close()

    yield

app = FastAPI(
    title="OUMALYA CLOTHING API",
    description="Backend FastAPI complet pour OUMALYA CLOTHING : gestion catalogue, commandes, upload et authentification Clerk (restriction stricte aux 2 premiers administrateurs).",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
# Supports local Next.js ports, production Vercel frontend, and wildcard origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://oumalya-aurl.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(orders.router)
app.include_router(upload.router)
app.include_router(settings.router)
app.include_router(admin.router)

@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "app": "OUMALYA CLOTHING API",
        "version": "1.0.0",
        "docs": "/docs",
        "admin_whitelist_limit": 2
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
