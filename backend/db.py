import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

def get_db_connection():
    # psycopg 3 parses the postgres URL directly
    conn = psycopg.connect(os.environ.get('DATABASE_URL'))
    return conn

def init_db():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        print("Connected to PostgreSQL database (psycopg3)")
        
        # Create tables if they don't exist
        cur.execute("""
            CREATE TABLE IF NOT EXISTS members (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                role VARCHAR(255) NOT NULL,
                skills TEXT,
                type VARCHAR(50) NOT NULL, -- 'core' or 'lead'
                github VARCHAR(255),
                linkedin VARCHAR(255),
                image_url VARCHAR(500)
            );
        """)

        try:
            cur.execute("ALTER TABLE members ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);")
        except Exception as e:
            print(f"Schema update notice: {e}")
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                tag VARCHAR(255),
                category VARCHAR(100) NOT NULL,
                techstack TEXT,
                link VARCHAR(500),
                image_url VARCHAR(500)
            );
        """)
        
        try:
            cur.execute("ALTER TABLE projects ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);")
        except Exception as e:
            print(f"Project schema update notice: {e}")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS achievements (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL, -- 'hall_of_fame', 'timeline', 'certificate'
                title VARCHAR(255) NOT NULL,
                date VARCHAR(50),
                description TEXT,
                image_url VARCHAR(500)
            );
        """)
        
        try:
            cur.execute("ALTER TABLE achievements ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);")
        except Exception as e:
            print(f"Achievement schema update notice: {e}")

        cur.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255),
                subject VARCHAR(255),
                message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("Database tables verified.")
    except Exception as e:
        print(f"Error initializing database: {e}")

if __name__ == "__main__":
    init_db()
