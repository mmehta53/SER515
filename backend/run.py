# run.py

from app import create_app

app = create_app() # Calls the function defined in app/__init__.py

if __name__ == '__main__':
    # Add your host and port as needed, debug=True for development
    # Using port 5001 to avoid conflict with macOS AirPlay Receiver on port 5000
    app.run(host='0.0.0.0', port=5001, debug=True)