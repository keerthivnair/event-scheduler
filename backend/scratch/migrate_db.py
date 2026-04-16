import sqlite3
import os

db_path = 'calendly.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    try:
        cur.execute("ALTER TABLE meetings ADD COLUMN admin_notes TEXT")
        conn.commit()
        print("Successfully added 'admin_notes' column to 'meetings' table.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e).lower():
            print("Column 'admin_notes' already exists.")
        else:
            print(f"Error: {e}")
    finally:
        conn.close()
else:
    print("Database file not found.")
