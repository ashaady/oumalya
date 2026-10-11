import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database path configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DATA_DIR = os.path.join(os.path.dirname(BASE_DIR), "data")

if os.path.exists(PARENT_DATA_DIR):
    DEFAULT_DB_PATH = os.path.join(PARENT_DATA_DIR, "oumalya.db")
else:
    DEFAULT_DB_PATH = os.path.join(BASE_DIR, "oumalya.db")

DB_PATH = os.getenv("DATABASE_PATH", DEFAULT_DB_PATH)
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
