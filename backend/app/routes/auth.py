from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, set_access_cookies, set_refresh_cookies
from app import db
from app.models.user import User
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password) or not user.is_active:
        return jsonify({'error': 'Invalid credentials or inactive account'}), 401

    # Update last_login (as per Design Doc)
    user.last_login = datetime.utcnow()
    db.session.commit()

    # Generate JWTs (access + refresh)
    access_token = create_access_token(
        identity=str(user.user_id), 
        additional_claims={
            'role': user.role,
            'org_id': str(user.org_id) if user.org_id else None
        }
    )
    refresh_token = create_refresh_token(identity=str(user.user_id))

    response = jsonify({
        'message': 'Login successful',
        'user': {
            'email': user.email, 
            'role': user.role,
            'org_id': str(user.org_id) if user.org_id else None
        }
    })
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)

    return response, 200