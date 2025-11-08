# app/__init__.py
from flask import Flask
from flask_jwt_extended import JWTManager
from mongoengine import connect
from app.config import Config
from flask_cors import CORS

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    # Enable CORS for API endpoints so frontend at http://localhost:5173 can talk to this backend
    # supports_credentials=True so cookies (JWT cookies) can be set and sent
    CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173"]}}, supports_credentials=True)
    
    # Connect to MongoDB with database name
    connect(db='SER515', host=app.config['MONGO_URI'])
    jwt.init_app(app)
    
    from app.models import user, organization, project  # Import models
    from app.routes.auth import auth_bp
    from app.routes.projects import projects_bp
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    
    return app