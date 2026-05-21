# app/routes/data_pipeline.py

from fastapi import APIRouter, Depends, HTTPException
import pandas as pd
import os
import time
import threading
from datetime import datetime
from sqlalchemy import create_engine

from ..dependencies import get_current_user
from ..models import User as UserModel

router = APIRouter(prefix="/data", tags=["Data Pipeline"])

# ------------------------
# DATABASE ENGINE
# ------------------------
SYNC_DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER','postgres')}:"
    f"{os.getenv('POSTGRES_PASSWORD','ayushi')}@"
    f"{os.getenv('POSTGRES_HOST','localhost')}:"
    f"{os.getenv('POSTGRES_PORT','5432')}/"
    f"{os.getenv('POSTGRES_DB','herodb')}"
)

engine = create_engine(SYNC_DATABASE_URL)

# ------------------------
# DATA SOURCES (ADD MORE LATER)
# ------------------------
DATA_SOURCES = {
    "hiring": r"C:\Users\Ayushi\Downloads\hiringrelated.xlsx",
    "employee": r"C:\Users\Ayushi\Downloads\mine.xlsx",
    "projects": r"C:\Users\Ayushi\Downloads\it_projects_dataset_matched_managers (1).xlsx",
    "performance": r"C:\Users\Ayushi\Downloads\performnce evaluation dataset 2025 year.csv"
}

# ------------------------
# TRACKERS
# ------------------------
last_update_time = {}
file_last_modified = {}

# ------------------------
# CLEAN DATA
# ------------------------
def clean_columns(df):
    df.columns = [col.strip().replace(" ", "_") for col in df.columns]
    return df

# ------------------------
# LOAD DATA INTO DB
# ------------------------
def load_file_to_db(table_name, file_path):
    global last_update_time

    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return

    try:
        if file_path.endswith(".xlsx"):
            df = pd.read_excel(file_path)
        else:
            df = pd.read_csv(file_path)

        df = clean_columns(df)

        df.to_sql(table_name, con=engine, if_exists="replace", index=False)

        # ✅ update timestamp
        last_update_time[table_name] = datetime.utcnow()

        print(f"✅ Updated: {table_name}")

    except Exception as e:
        print(f"❌ Error updating {table_name}: {e}")

# ------------------------
# MANUAL UPDATE API
# ------------------------
@router.get("/update/{table_name}")
def update_data(table_name: str, current_user: UserModel = Depends(get_current_user)):

    if table_name not in DATA_SOURCES:
        raise HTTPException(status_code=404, detail="Table not found")

    load_file_to_db(table_name, DATA_SOURCES[table_name])

    return {"status": f"{table_name} updated"}

# ------------------------
# GET LAST UPDATE TIME (USED BY FRONTEND SMART REFRESH)
# ------------------------
@router.get("/last-update/{table_name}")
def get_last_update(table_name: str):

    return {
        "table": table_name,
        "last_update": last_update_time.get(table_name)
    }

# ------------------------
# AUTO FILE WATCHER (🔥 MAIN FEATURE)
# ------------------------
def watch_files():
    global file_last_modified

    print("👀 File watcher started...")

    while True:
        for table, path in DATA_SOURCES.items():
            try:
                current_mtime = os.path.getmtime(path)

                # first time init
                if table not in file_last_modified:
                    file_last_modified[table] = current_mtime

                # 🔥 DETECT CHANGE
                elif file_last_modified[table] != current_mtime:
                    print(f"📁 Change detected in {table}")

                    file_last_modified[table] = current_mtime

                    load_file_to_db(table, path)

            except Exception as e:
                print(f"Watcher error ({table}):", e)

        time.sleep(50)  # check every 50 sec

# ------------------------
# START BACKGROUND THREAD
# ------------------------
threading.Thread(target=watch_files, daemon=True).start()