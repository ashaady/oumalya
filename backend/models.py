from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Text, Boolean, LargeBinary, DateTime

try:
    from database import Base
except ImportError:
    from backend.database import Base

class AdminUser(Base):
    __tablename__ = "admin_users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    clerk_user_id = Column(String(128), unique=True, index=True, nullable=False)
    email = Column(String(255), nullable=True)
    first_name = Column(String(128), nullable=True)
    last_name = Column(String(128), nullable=True)
    image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Product(Base):
    __tablename__ = "products"
    __table_args__ = {'extend_existing': True}

    id = Column(String(128), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    cat = Column(String(100), nullable=False, default="abayas")
    category = Column(String(100), nullable=False, default="abayas")
    label = Column(String(255), nullable=True)
    catLabel = Column(String(255), nullable=True)
    price = Column(Integer, nullable=False, default=0)
    color = Column(String(100), nullable=True, default="Noir")
    sizes = Column(Text, nullable=True)  # JSON encoded list of sizes e.g. ["S", "M", "L"]
    desc = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    detail = Column(Text, nullable=True)
    badges = Column(String(100), nullable=True, default="Nouveauté")
    badge = Column(String(100), nullable=True, default="Nouveauté")
    img = Column(Text, nullable=True)
    image = Column(Text, nullable=True)
    order_num = Column(Integer, nullable=True, default=0)
    created_at = Column(String(64), nullable=True)

class Category(Base):
    __tablename__ = "categories"
    __table_args__ = {'extend_existing': True}

    id = Column(String(128), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    label = Column(String(255), nullable=True)
    icon = Column(String(64), nullable=True, default="✨")
    image = Column(Text, nullable=True)
    default_sizes = Column(Text, nullable=True)  # JSON encoded list
    is_default = Column(Integer, default=0)
    order_num = Column(Integer, default=0)
    created_at = Column(String(64), nullable=True)

class Order(Base):
    __tablename__ = "orders"
    __table_args__ = {'extend_existing': True}

    id = Column(String(128), primary_key=True, index=True)
    created_at = Column(String(64), nullable=False)
    customer_prenom = Column(String(100), nullable=True)
    customer_nom = Column(String(100), nullable=True)
    customer_telephone = Column(String(100), nullable=True)
    customer_ville = Column(String(100), nullable=True)
    customer_adresse = Column(String(255), nullable=True)
    customer_livraison = Column(String(100), nullable=True)
    customer_note = Column(Text, nullable=True)
    items = Column(Text, nullable=False, default="[]")  # JSON encoded list of items
    subtotal = Column(Integer, nullable=False, default=0)
    delivery_fee = Column(Integer, nullable=False, default=2000)
    total = Column(Integer, nullable=False, default=0)
    status = Column(String(50), nullable=False, default="pending")

class Setting(Base):
    __tablename__ = "settings"
    __table_args__ = {'extend_existing': True}

    key = Column(String(100), primary_key=True, index=True)
    value = Column(Text, nullable=True)

class StoredImage(Base):
    __tablename__ = "images"
    __table_args__ = {'extend_existing': True}

    id = Column(String(128), primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=False)
    size = Column(Integer, nullable=False)
    data = Column(LargeBinary, nullable=False)
    created_at = Column(String(64), nullable=False)
