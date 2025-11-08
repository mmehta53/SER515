import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Application configuration class."""
    MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb+srv://admin:admin@cluster0.basebmt.mongodb.net/')
    MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'ser515')  # Default database name
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')

