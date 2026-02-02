import logging
import threading
import time
import akshare as ak
import pandas as pd
from ..db import get_db_connection
from ..config import Config

logger = logging.getLogger(__name__)

def fetch_and_update_funds():
    """
    Fetches the complete fund list from AkShare and updates the SQLite DB.
    This is a blocking operation, should be run in a background thread.
    """
    logger.info("Starting fund list update...")
    try:
        # Fetch data
        df = ak.fund_name_em()
        if df is None or df.empty:
            logger.warning("Fetched empty fund list from AkShare.")
            return

        # Rename columns to match our simple schema
        # Expected cols: "基金代码", "基金简称", "基金类型"
        df = df.rename(columns={
            "基金代码": "code",
            "基金简称": "name",
            "基金类型": "type"
        })
        
        # Select only relevant columns
        data_to_insert = df[["code", "name", "type"]].to_dict(orient="records")
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Use transaction for speed and safety
        conn.execute("BEGIN")
        
        # Upsert logic (Replace is easier here since we just want the latest list)
        # Using executemany is much faster than looping
        cursor.executemany("""
            INSERT OR REPLACE INTO funds (code, name, type, updated_at)
            VALUES (:code, :name, :type, CURRENT_TIMESTAMP)
        """, data_to_insert)
        
        conn.commit()
        conn.close()
        
        logger.info(f"Fund list updated. Total funds: {len(data_to_insert)}")
        
    except Exception as e:
        logger.error(f"Failed to update fund list: {e}")

def start_scheduler():
    """
    Simple background thread to check if data needs update.
    Linus: Don't overengineer with Celery for a simple script.
    """
    def _run():
        # Check if DB is empty first
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT count(*) as cnt FROM funds")
        count = cursor.fetchone()["cnt"]
        conn.close()
        
        if count == 0:
            logger.info("DB is empty. Performing initial fetch.")
            fetch_and_update_funds()
            
        # Here you could add a loop for daily updates if the process stays alive
        # For now, run-once-on-startup logic is sufficient for the requirement.
    
    t = threading.Thread(target=_run, daemon=True)
    t.start()
