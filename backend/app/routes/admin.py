from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from app.models.organization import Organization
from app.models.user import User
from datetime import datetime

admin_bp = Blueprint('admin', __name__)

# --- Helper function for Admin role checking ---
def admin_required():
    """Check if the current user has admin role"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return False
    return True


@admin_bp.route('/organizations', methods=['GET'])
@jwt_required()
def get_all_organizations():
    """
    Admin-only route to fetch all organizations.
    Requires: Admin role in JWT claims.
    Returns: List of all organizations
    """
    if not admin_required():
        return jsonify({'error': 'Admin privileges required'}), 403

    try:
        organizations = Organization.objects.all()
        
        orgs_list = []
        for org in organizations:
            orgs_list.append({
                'id': org.id,
                'name': org.name,
                'description': org.description,
                'createdAt': org.createdAt.isoformat() if org.createdAt else None
            })
        
        return jsonify({
            'message': 'Organizations fetched successfully',
            'organizations': orgs_list,
            'count': len(orgs_list)
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'An error occurred while fetching organizations: {str(e)}'}), 500


@admin_bp.route('/organizations/<org_id>/users', methods=['GET'])
@jwt_required()
def get_users_in_organization(org_id):
    """
    Admin-only route to fetch all users in a specific organization.
    Requires: Admin role in JWT claims.
    Args: org_id - The ID of the organization
    Returns: List of all users in the organization
    """
    if not admin_required():
        return jsonify({'error': 'Admin privileges required'}), 403

    try:
        # Verify organization exists
        organizations = Organization.objects.all()
        organization = None
        for org in organizations:
            if org.id == org_id:
                organization = org
                break
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404

        # Fetch all users in the organization
        users = User.objects(orgId=org_id).all()
        
        users_list = []
        for user in users:
            users_list.append({
                'userId': user.userId,
                'email': user.email,
                'firstName': user.firstName,
                'lastName': user.lastName,
                'role': user.role,
                'isActive': user.isActive,
                'lastLogin': user.lastLogin.isoformat() if user.lastLogin else None,
                'createdAt': user.createdAt.isoformat() if user.createdAt else None
            })
        
        return jsonify({
            'message': 'Users fetched successfully',
            'organizationId': org_id,
            'organizationName': organization.name,
            'users': users_list,
            'count': len(users_list)
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'An error occurred while fetching users: {str(e)}'}), 500


@admin_bp.route('/users/<user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    """
    Admin-only route to update a user's information.
    Requires: Admin role in JWT claims.
    Args: user_id - The ID of the user to update
    Body: JSON with fields to update (firstName, lastName, email, role)
    Returns: Updated user information
    """
    if not admin_required():
        return jsonify({'error': 'Admin privileges required'}), 403

    try:
        # Find the user to update
        user = User.objects(userId=user_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        
        # Update allowed fields
        if 'firstName' in data:
            user.firstName = data['firstName']
        if 'lastName' in data:
            user.lastName = data['lastName']
        if 'email' in data:
            # Check if new email is unique
            existing_user = User.objects(email=data['email']).first()
            if existing_user and existing_user.userId != user_id:
                return jsonify({'error': 'Email already in use'}), 409
            user.email = data['email']
        if 'role' in data:
            if data['role'] not in ['pig', 'chicken', 'admin']:
                return jsonify({'error': 'Role must be pig, chicken, or admin'}), 400
            user.role = data['role']
        
        # Save the updated user
        user.save()
        
        # Log the Admin action
        admin_id = get_jwt_identity()
        print(f"AUDIT LOG: Admin User {admin_id} updated user {user_id} ({user.email}) at {datetime.utcnow()}")
        
        return jsonify({
            'message': 'User updated successfully',
            'user': {
                'userId': user.userId,
                'email': user.email,
                'firstName': user.firstName,
                'lastName': user.lastName,
                'role': user.role,
                'isActive': user.isActive,
                'orgId': user.orgId
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'An error occurred while updating user: {str(e)}'}), 500


@admin_bp.route('/users/<user_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_user(user_id):
    """
    Admin-only route to deactivate a user (set isActive to False).
    Requires: Admin role in JWT claims.
    Args: user_id - The ID of the user to deactivate
    Returns: Updated user with isActive status
    """
    if not admin_required():
        return jsonify({'error': 'Admin privileges required'}), 403

    try:
        # Find the user to deactivate
        user = User.objects(userId=user_id).first()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Check if already deactivated
        if not user.isActive:
            return jsonify({'error': 'User is already deactivated'}), 400

        # Deactivate the user
        user.isActive = False
        user.save()
        
        # Log the Admin action
        admin_id = get_jwt_identity()
        print(f"AUDIT LOG: Admin User {admin_id} deactivated user {user_id} ({user.email}) at {datetime.utcnow()}")
        
        return jsonify({
            'message': 'User deactivated successfully',
            'user': {
                'userId': user.userId,
                'email': user.email,
                'firstName': user.firstName,
                'lastName': user.lastName,
                'role': user.role,
                'isActive': user.isActive,
                'orgId': user.orgId
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'An error occurred while deactivating user: {str(e)}'}), 500
