from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, set_access_cookies, set_refresh_cookies
from app.models.user import User
from datetime import datetime, timedelta
# from flask_cors import cross_origin

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    print(f"Login attempt for email: {email}")
    
    # Try direct MongoDB query
    from mongoengine.connection import get_db
    db = get_db()
    direct_user = db.users.find_one({"email": email})
    print(f"Direct MongoDB query result: {direct_user}")
    
    # Try MongoEngine query
    user = User.objects(email=email).first()
    print(f"MongoEngine query result: {user}")
    print(f"User found: {user is not None}")
    
    if not user:
        print("User not found in database")
        # List all users in the collection to debug
        all_users = list(db.users.find({}, {"email": 1}))
        print(f"All users in database: {all_users}")
        return jsonify({'error': 'Invalid credentials or inactive account'}), 401
    
    if not user.check_password(password):
        print("Password check failed")
        return jsonify({'error': 'Invalid credentials or inactive account'}), 401
    
    if not user.isActive:
        print("User account is inactive")
        return jsonify({'error': 'Invalid credentials or inactive account'}), 401

    # Update last_login (as per Design Doc)
    user.lastLogin = datetime.utcnow()
    user.save()

    # Generate JWTs (access + refresh)
    access_token = create_access_token(
        identity=str(user.userId),
        additional_claims={
            'role': user.role,
            'orgId': str(user.orgId) if user.orgId else None,
            'userId': str(user.userId)
        }
    )
    refresh_token = create_refresh_token(identity=str(user.userId))

    response = jsonify({
        'message': 'Login successful',
        'user': {
            'email': user.email, 
            'role': user.role,
            'orgId': str(user.orgId) if user.orgId else None,
            'userId': str(user.userId),
            'token': access_token  # Include token in response for frontend
        }
    })
    
    # Set cookies for additional security
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    
    # Set CORS headers
    # response.headers.add('Access-Control-Allow-Credentials', 'true')
    
    return response, 200
