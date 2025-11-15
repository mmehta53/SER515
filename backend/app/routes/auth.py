from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, create_refresh_token, set_access_cookies, set_refresh_cookies, jwt_required, get_jwt_identity, get_jwt
from app.models.user import User
from app.utils.email import send_welcome_email
from datetime import datetime
from werkzeug.security import generate_password_hash
import uuid

# from flask_cors import cross_origin

auth_bp = Blueprint('auth', __name__)

# --- Helper function for Admin role checking (NEW) ---
def admin_required():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True

@auth_bp.route('/register-user', methods=['POST'])
@jwt_required()
def register_new_user():
    """
    Admin-only route to create a new user account.
    Requires: Admin role in JWT claims.
    Generates: A temporary password.
    """
    if not admin_required():
        return jsonify({'error': 'Admin privileges required'}), 403

    data = request.get_json()
    # 1. Validate required fields
    required_fields = ['email', 'firstName', 'lastName', 'role', 'orgId','password']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: email, firstName, lastName, role, orgId'}), 400

    email = data['email']
    role = data['role']
    temp_password = data['password']
    # The user story specifies roles 'Pig' or 'Chicken'
    if role not in ['pig', 'chicken']:
        return jsonify({'error': 'Role must be Pig or Chicken'}), 400

    # 2. Ensure email is unique
    if User.objects(email=email).first():
        return jsonify({'error': 'User with this email already exists.'}), 409

    # 3. Generate temporary password
    # A simple, secure random password for initial login
    # temp_password = str(uuid.uuid4())[:8] + str(random.randint(100, 999))
    # temp_password = "123456"
    password_hash = generate_password_hash(temp_password)

    # 4. Create new user
    try:
        new_user = User(
            userId=str(uuid.uuid4()),
            email=email,
            passwordHash=password_hash,
            firstName=data['firstName'],
            lastName=data['lastName'],
            role=role,
            isActive=True,  # Account starts active
            orgId=data['orgId'], # Assuming Admin provides the Org ID for the new user
            createdAt=datetime.utcnow()
        )
        new_user.save()
        
        # 5. Send welcome email with account details
        email_sent = send_welcome_email(
            user_email=email,
            first_name=data['firstName'],
            last_name=data['lastName'],
            password=temp_password,
            role=role,
            org_id=data['orgId']
        )
        
        # 6. Log the Admin action (Acceptance Criteria)
        # For a full audit log, you would write this to a separate AuditLog collection.
        # For this example, we'll print to the console.
        admin_id = get_jwt_identity() # The userId of the admin performing the action
        print(f"AUDIT LOG: Admin User {admin_id} created new user {email} with role {role} at {datetime.utcnow()}")

        # 7. Return success with the temporary password for notification/email
        return jsonify({
            'message': 'User created successfully. Welcome email sent.',
            'tempPassword': temp_password,
            'userId': new_user.userId,
            'emailSent': email_sent
        }), 201
    
    except Exception as e:
        # Catch any database or internal errors
        return jsonify({'error': f'An error occurred during user creation: {str(e)}'}), 500


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
            'orgId': str(user.orgId) if user.orgId else None
        }
    )
    refresh_token = create_refresh_token(identity=str(user.userId))

    response = jsonify({
        'message': 'Login successful',
        'user': {
            'email': user.email, 
            'role': user.role,
            'orgId': str(user.orgId) if user.orgId else None,
            'token': access_token  # Include token in response for frontend
        }
    })
    
    # Set cookies for additional security
    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)
    
    # Set CORS
    # response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
    # response.headers.add('Access-Control-Allow-Credentials', 'true')

    return response