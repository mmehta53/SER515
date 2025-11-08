"""
Test script to verify MongoDB connection
"""
import os
import sys
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Load environment variables
load_dotenv()

def test_mongodb_connection():
    """Test MongoDB connection using environment variables"""
    try:
        # Get MongoDB URI from environment
        mongodb_uri = os.getenv('MONGODB_URI')
        
        if not mongodb_uri:
            print("[ERROR] MONGODB_URI not found in environment variables")
            print("   Make sure .env file exists in the backend directory")
            return False
        
        print(f"Connecting to MongoDB...")
        print(f"   URI: {mongodb_uri.replace('://admin:admin@', '://***:***@')}")  # Hide credentials
        
        # Create MongoDB client with timeout and SSL configuration
        # Note: mongodb+srv:// automatically uses TLS/SSL
        # For Python 3.14, we may need to configure SSL more explicitly
        print("   Testing connection...")
        
        # Try with default settings first
        client = MongoClient(
            mongodb_uri, 
            serverSelectionTimeoutMS=20000,
            connectTimeoutMS=20000,
            socketTimeoutMS=20000
        )
        
        # Test the connection - this is where errors will occur if connection fails
        client.admin.command('ping')
        
        # Get database name (default: ser515)
        db_name = os.getenv('MONGODB_DB_NAME', 'ser515')
        db = client[db_name]
        
        # Get server info
        server_info = client.server_info()
        
        print(f"[SUCCESS] Successfully connected to MongoDB!")
        print(f"   Server Version: {server_info.get('version', 'Unknown')}")
        print(f"   Database: {db_name}")
        
        # List databases
        db_list = client.list_database_names()
        print(f"   Available Databases: {', '.join(db_list)}")
        
        # List collections in the database
        collections = db.list_collection_names()
        if collections:
            print(f"   Collections in '{db_name}': {', '.join(collections)}")
        else:
            print(f"   Collections in '{db_name}': (none)")
        
        # Close the connection
        client.close()
        print("[SUCCESS] Connection test completed successfully!")
        return True
        
    except ServerSelectionTimeoutError as e:
        error_str = str(e)
        print(f"[ERROR] Connection timeout: Could not connect to MongoDB server")
        print(f"   Error Type: ServerSelectionTimeoutError")
        
        # Check for SSL/TLS errors
        if "SSL" in error_str or "TLS" in error_str:
            print(f"\n   [SSL/TLS Issue Detected]")
            print(f"   This is likely due to:")
            print(f"   1. Python 3.14 SSL compatibility issues with MongoDB Atlas")
            print(f"   2. Missing or outdated SSL certificates")
            print(f"   3. Network/firewall blocking SSL connections")
            print(f"\n   Possible solutions:")
            print(f"   - Install/update certifi: pip install --upgrade certifi")
            print(f"   - Check MongoDB Atlas Network Access (IP Whitelist)")
            print(f"   - Try using a different Python version (3.11 or 3.12)")
            print(f"   - Verify your internet connection allows SSL/TLS traffic")
        else:
            print(f"   Error details: {error_str[:200]}")
            print(f"\n   Please check:")
            print(f"   1. Your internet connection")
            print(f"   2. MongoDB Atlas IP whitelist settings (allow all IPs: 0.0.0.0/0)")
            print(f"   3. MongoDB connection string is correct")
            print(f"   4. MongoDB Atlas cluster is running")
        
        return False
        
    except ConnectionFailure as e:
        print(f"[ERROR] Connection failed: Could not establish connection to MongoDB")
        print(f"   Error: {e}")
        return False
        
    except Exception as e:
        error_type = type(e).__name__
        error_str = str(e)
        print(f"[ERROR] Unexpected error: {error_type}")
        print(f"   Error: {error_str[:300]}")
        
        if "SSL" in error_str or "TLS" in error_str:
            print(f"\n   [Note] SSL/TLS related error detected")
            print(f"   Consider installing certifi: pip install --upgrade certifi")
        
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("MongoDB Connection Test")
    print("=" * 60)
    success = test_mongodb_connection()
    print("=" * 60)
    sys.exit(0 if success else 1)

