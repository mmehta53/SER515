# app/__init__.py

from flask import Flask

# Make sure this function signature is EXACTLY correct
def create_app():
    app = Flask(__name__)
    
    # Configure app here (e.g., app.config.from_object('config.Config'))
    # from config import Config # If using a config file

    # Register Blueprints
    # (Assuming main_bp is imported and defined in app/routes/main.py)
    from .routes.main import main_bp
    app.register_blueprint(main_bp)

    return app

# If you just have app = Flask(__name__), you CANNOT use 'create_app'.
# If that's the case, switch to using 'app' instead of 'create_app' in run.py