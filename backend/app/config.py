# config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI = os.getenv('MONGO_URI')
    SECRET_KEY = os.getenv('SECRET_KEY')
    
    # JWT Settings
    JWT_SECRET_KEY = os.getenv('SECRET_KEY')  # Use same secret key
    JWT_ACCESS_TOKEN_EXPIRES = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 900))
    JWT_REFRESH_TOKEN_EXPIRES = int(os.getenv('JWT_REFRESH_TOKEN_EXPIRES', 604800))
    JWT_TOKEN_LOCATION = ['headers', 'cookies']  # Check both headers and cookies
    JWT_COOKIE_SECURE = False  # Set to True in production with HTTPS
    JWT_COOKIE_CSRF_PROTECT = False  # Set to True in production
    
    # CORS Settings
    CORS_ORIGINS = ['http://localhost:3000', 'http://localhost:5173']  # Add your frontend URL
    CORS_SUPPORTS_CREDENTIALS = True  # Required for cookies