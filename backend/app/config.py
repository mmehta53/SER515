import os

class Config:
    """Configuration class for Flask application"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # MongoDB Configuration
    MONGODB_URI = os.environ.get('MONGODB_URI') or 'mongodb+srv://admin:admin@cluster0.basebmt.mongodb.net/'
    MONGODB_DB_NAME = os.environ.get('MONGODB_DB_NAME') or 'SER515'
    MONGODB_COLLECTION_NAME = os.environ.get('MONGODB_COLLECTION_NAME') or 'user_stories'

