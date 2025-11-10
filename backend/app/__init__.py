# app/__init__.py

from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.database import MongoDB

# Make sure this function signature is EXACTLY correct
def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for frontend communication
    CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "DELETE"], "allow_headers": ["Content-Type"]}})
    
    # Initialize MongoDB connection
    if not MongoDB.initialize():
        app.logger.error("Failed to connect to MongoDB. Please check your connection string.")
    
    # Register Blueprints
    from .routes.main import main_bp
    from .routes.stories import stories_bp
    app.register_blueprint(main_bp)
    app.register_blueprint(stories_bp, url_prefix='/api/stories')
    
    # Close MongoDB connection on app teardown
    @app.teardown_appcontext
    def close_db(error):
        # MongoDB connection is managed globally, so we don't close it here
        # but we could add cleanup logic if needed
        pass

    return app

# If you just have app = Flask(__name__), you CANNOT use 'create_app'.
# If that's the case, switch to using 'app' instead of 'create_app' in run.py