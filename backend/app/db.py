import sqlite3
import logging
from .config import Config

logger = logging.getLogger(__name__)

def get_db_connection():
    conn = sqlite3.connect(Config.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database schema."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Funds table - simplistic design, exactly what we need
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS funds (
            code TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create an index for searching names, it's cheap and speeds up "LIKE" queries
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_funds_name ON funds(name);
    """)
    
    conn.commit()
    conn.close()
    logger.info("Database initialized.")
