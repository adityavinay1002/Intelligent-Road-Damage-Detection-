import os
from pathlib import Path
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

DB_DIR = Path(__file__).resolve().parent
DB_PATH = DB_DIR / "road_damage.db"

SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH.as_posix()}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    
    # Run SQLite column migration for backward compatibility
    try:
        inspector = inspect(engine)
        with engine.connect() as conn:
            if inspector.has_table("detection_records"):
                existing_cols = [c["name"] for c in inspector.get_columns("detection_records")]
                new_cols = [
                    ("image_filename", "VARCHAR(255)"),
                    ("avg_confidence", "FLOAT"),
                    ("highest_severity", "VARCHAR(20)"),
                    ("latitude", "FLOAT"),
                    ("longitude", "FLOAT"),
                    ("location", "VARCHAR(300)"),
                    ("city", "VARCHAR(100)"),
                    ("state", "VARCHAR(100)"),
                    ("country", "VARCHAR(100)"),
                    ("model_version", "VARCHAR(100)"),
                    ("inference_time_ms", "FLOAT")
                ]
                for col_name, col_type in new_cols:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE detection_records ADD COLUMN {col_name} {col_type}"))

            if inspector.has_table("damage_items"):
                existing_item_cols = [c["name"] for c in inspector.get_columns("damage_items")]
                if "recommendation" not in existing_item_cols:
                    conn.execute(text("ALTER TABLE damage_items ADD COLUMN recommendation TEXT"))

            conn.commit()
    except Exception as e:
        print(f"[DB MIGRATION NOTICE] {e}")
