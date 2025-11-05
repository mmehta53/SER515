# run.py

from app import create_app

app = create_app() # Calls the function defined in app/__init__.py

if __name__ == '__main__':
    # Add your host and port as needed, debug=True for development
    app.run(debug=True)