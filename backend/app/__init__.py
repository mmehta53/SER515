# app/__init__.py
from flask import Flask
from flask_jwt_extended import JWTManager
from mongoengine import connect
from app.config import Config
from flask_cors import CORS
from app.utils.email import mail

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    # Enable CORS for API endpoints so frontend at http://localhost:5173 can talk to this backend
    # supports_credentials=True so cookies (JWT cookies) can be set and sent
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
    
    # Connect to MongoDB with database name
    connect(db='SER515', host=app.config['MONGO_URI'])
    jwt.init_app(app)
    
    # Initialize Flask-Mail
    mail.init_app(app)
    
    from app.models import user, organization, project, notification  # Import models
    from app.routes.auth import auth_bp
    from app.routes.projects import projects_bp
    from app.routes.ideas import ideas_bp
    from app.routes.admin import admin_bp
    from app.routes.stories import stories_bp
    from app.routes.mvps import mvps_bp
    from app.routes.notifications import notifications_bp
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(projects_bp, url_prefix='/api/projects')
    app.register_blueprint(ideas_bp, url_prefix='/api/ideas')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(stories_bp, url_prefix='/api/stories')
    app.register_blueprint(mvps_bp, url_prefix='/api/mvps')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    
    return app