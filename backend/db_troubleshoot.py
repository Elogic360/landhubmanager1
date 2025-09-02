"""
Database connection troubleshooting and configuration guide.

ISSUE: Network is unreachable when connecting to Supabase

POSSIBLE CAUSES:
1. Incorrect database URL or credentials
2. Supabase project is paused or deleted
3. Network connectivity issues from Render to Supabase
4. SSL/connection configuration problems

SOLUTIONS:

1. Verify Supabase Project Status:
   - Check if your Supabase project is active
   - Ensure it's not paused due to inactivity
   - Verify the database URL in your Supabase dashboard

2. Check Database URL Format:
   Your current URL: postgresql://postgres:thelandhub101@db.htspogbdpbqrzkghuebx.supabase.co:5432/postgres
   
   Ensure it matches the pattern from Supabase Settings > Database:
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

3. Environment Variables in Render:
   Make sure these are set in your Render service environment variables:
   - DATABASE_URL
   - SUPABASE_URL
   - SUPABASE_KEY
   - SUPABASE_SERVICE_ROLE_KEY

4. Connection Settings:
   - Added SSL requirement: sslmode=require
   - Increased connection timeout to 30 seconds
   - Reduced pool size for cloud deployment

5. Alternative Solutions:
   a) Use Render PostgreSQL instead of Supabase
   b) Use connection pooling service like PgBouncer
   c) Implement retry logic with exponential backoff

DEBUGGING STEPS:
1. Test connection locally first
2. Verify credentials in Supabase dashboard
3. Check Render logs for specific error details
4. Test with a simple connection script
"""

import os
import logging
import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

logger = logging.getLogger(__name__)

def test_database_connection(database_url: str, max_retries: int = 3) -> bool:
    """
    Test database connection with retry logic
    """
    for attempt in range(max_retries):
        try:
            logger.info(f"Testing database connection (attempt {attempt + 1}/{max_retries})")
            
            # Create engine with conservative settings
            engine = create_engine(
                database_url,
                pool_size=1,
                max_overflow=0,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={
                    "connect_timeout": 30,
                    "sslmode": "require",
                    "application_name": "landhub_connection_test"
                }
            )
            
            # Test connection
            with engine.connect() as conn:
                result = conn.execute(text("SELECT version()"))
                version = result.fetchone()[0]
                logger.info(f"✅ Database connection successful: {version}")
                return True
                
        except OperationalError as e:
            logger.error(f"❌ Connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                wait_time = (2 ** attempt) * 5  # Exponential backoff
                logger.info(f"Waiting {wait_time} seconds before retry...")
                time.sleep(wait_time)
            else:
                logger.error("All connection attempts failed")
                return False
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
            return False
    
    return False

if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        success = test_database_connection(database_url)
        if not success:
            print("\n🚨 Database connection failed!")
            print("\n📋 Troubleshooting checklist:")
            print("1. Verify Supabase project is active")
            print("2. Check database credentials in Supabase dashboard")
            print("3. Ensure DATABASE_URL environment variable is correct")
            print("4. Test connection from your local machine")
            print("5. Check Render environment variables")
    else:
        print("❌ DATABASE_URL environment variable not found")
