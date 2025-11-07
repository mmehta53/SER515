# app/__init__.py
from flask import Flask
from flask_jwt_extended import JWTManager
from mongoengine import connect
from app.config import Config

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Connect to MongoDB with database name
    connect(db='SER515', host=app.config['MONGO_URI'])
    jwt.init_app(app)
    
    from app.models import user, organization  # Import models
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    return app