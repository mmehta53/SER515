# app/__init__.py
from flask import Flask
from flask_jwt_extended import JWTManager
from mongoengine import connect
from app.config import Config
from flask_cors import CORS
from app.utils.email import mail
import certifi

jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    # Enable CORS for API endpoints so frontend at http://localhost:5173 can talk to this backend
    # supports_credentials=True so cookies (JWT cookies) can be set and sent
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}}, supports_credentials=True)
    
    # Connect to MongoDB with database name
    # connect(db='SER515', host=app.config['MONGO_URI'])
    mongo_uri = app.config['MONGO_URI']
    if not mongo_uri:
        raise ValueError("MONGO_URI environment variable is not set")
    
    try:
        connect(
            db='SER515',
            host=mongo_uri,
            tlsCAFile=certifi.where(),
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=20000,
            retryWrites=True,
            w='majority'
        )
        print("MongoDB connection successful!")
    except Exception as e:
        print(f"MongoDB connection error: {str(e)}")
        print("Possible solutions:")
        print("1. Check if your IP is whitelisted in MongoDB Atlas (Network Access)")
        print("2. Verify MONGO_URI is correct in .env file")
        print("3. Ensure dnspython is installed: pip install dnspython")
        print("4. Check your internet connection")
        raise
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