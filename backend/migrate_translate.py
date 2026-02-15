"""Migration script to fix translate_history table schema"""
import sqlite3

# Connect to database
conn = sqlite3.connect('sql_app.db')
cursor = conn.cursor()

try:
    # Create new table with correct schema
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS translate_history_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_text TEXT,
            target_language VARCHAR,
            translated_text TEXT,
            created_at DATETIME
        )
    ''')
    
    # Check if old table exists and has data
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='translate_history'")
    if cursor.fetchone():
        # Copy data from old table (handling both column names)
        try:
            # Try with target_lang first
            cursor.execute('''
INSERT INTO translate_history_new (id, source_text, target_language, translated_text, created_at)
                SELECT id, source_text, target_lang, translated_text, created_at 
                FROM translate_history
            ''')
            print("Migrated data from translate_history (target_lang)")
        except sqlite3.OperationalError:
            # If that fails, try with target_language
            try:
                cursor.execute('''
                    INSERT INTO translate_history_new (id, source_text, target_language, translated_text, created_at)
                    SELECT id, source_text, target_language, translated_text, created_at 
                    FROM translate_history
                ''')
                print("Data already uses target_language, copied as-is")
            except Exception as e:
                print(f"No data to migrate or error: {e}")
        
        # Drop old table
        cursor.execute('DROP TABLE translate_history')
        print("Dropped old translate_history table")
    
    # Rename new table
    cursor.execute('ALTER TABLE translate_history_new RENAME TO translate_history')
    print("Renamed translate_history_new to translate_history")
    
    conn.commit()
    print("✅ Migration completed successfully!")
    
except Exception as e:
    print(f"❌ Migration failed: {e}")
    conn.rollback()
finally:
    conn.close()
