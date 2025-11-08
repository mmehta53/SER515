# app/__init__.py

from flask import Flask
from pymongo import MongoClient
from .config import Config

# Global MongoDB client instance
mongo_client = None
db = None

# Make sure this function signature is EXACTLY correct
def create_app():
    global mongo_client, db
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(Config)
    
    # Initialize MongoDB connection
    try:
        mongo_client = MongoClient(app.config['MONGODB_URI'])
        # Get the database using the configured database name
        db = mongo_client[app.config['MONGODB_DB_NAME']]
        # Test the connection
        mongo_client.admin.command('ping')
        print(f"✓ Successfully connected to MongoDB (Database: {app.config['MONGODB_DB_NAME']})")
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {e}")
        raise

    # Register Blueprints
    # (Assuming main_bp is imported and defined in app/routes/main.py)
    from .routes.main import main_bp
    app.register_blueprint(main_bp)

    return app

# If you just have app = Flask(__name__), you CANNOT use 'create_app'.
# If that's the case, switch to using 'app' instead of 'create_app' in run.py