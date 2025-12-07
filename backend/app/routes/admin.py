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
                'createdAt': org.createdAt.isoformat() if org.createdAt else None,
                'isActive': org.isActive
            })
        
        return jsonify({
            'message': 'Organizations fetched successfully',
            'organizations': orgs_list,
            'count': len(orgs_list)
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'An error occurred while fetching organizations: {str(e)}'}), 500


@admin_bp.route('/organizations', methods=['POST'])
@jwt_required()
def create_organization():
    """
    Admin-only route to create a new organization.
    Requires: Admin role in JWT claims.
    Body: JSON with name (required) and description (optional)
    Returns: Created organization details
    """
    if not admin_required():
        return jsonify({'error': 'Admin privileges required'}), 403

    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'name' not in data:
            return jsonify({'error': 'Organization name is required'}), 400

        name = data['name']
        description = data.get('description', '')

        # Check if organization with same name already exists
        existing_org = Organization.objects(name=name).first()
        if existing_org:
            return jsonify({'error': 'Organization with this name already exists'}), 409

        # Create new organization
        new_org = Organization(
            name=name,
            description=description,
            isActive=True,
            createdAt=datetime.utcnow()
        )
        new_org.save()

        # Log the Admin action
        admin_id = get_jwt_identity()
        print(f"AUDIT LOG: Admin User {admin_id} created organization {new_org.id} ({name}) at {datetime.utcnow()}")

        return jsonify({
            'message': 'Organization created successfully',
            'organization': {
                'id': new_org.id,
                'name': new_org.name,
                'description': new_org.description,
                'isActive': new_org.isActive,
                'createdAt': new_org.createdAt.isoformat() if new_org.createdAt else None
            }
        }), 201

    except Exception as e:
        return jsonify({'error': f'An error occurred while creating organization: {str(e)}'}), 500


@admin_bp.route('/organizations/<org_id>', methods=['PUT'])
@jwt_required()
def update_organization(org_id):
    """
    Admin-only route to update an organization's information.
    Requires: Admin role in JWT claims.
    Args: org_id - The ID of the organization to update
    Body: JSON with fields to update (name, description)
    Returns: Updated organization information
    """
    if not admin_required():
        return jsonify({'error': 'Admin privileges required'}), 403

    try:
        # Find the organization to update
        organization = Organization.objects(id=org_id).first()
        
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404

        data = request.get_json()
        
        # Update allowed fields
        if 'name' in data:
            # Check if new name is unique
            existing_org = Organization.objects(name=data['name']).first()
            if existing_org and existing_org.id != org_id:
                return jsonify({'error': 'Organization with this name already exists'}), 409
            organization.name = data['name']
        
        if 'description' in data:
            organization.description = data['description']
        
        # Save the updated organization
        organization.save()
        
        # Log the Admin action
        admin_id = get_jwt_identity()
        print(f"AUDIT LOG: Admin User {admin_id} updated organization {org_id} ({organization.name}) at {datetime.utcnow()}")
        
        return jsonify({
            'message': 'Organization updated successfully',
            'organization': {
                'id': organization.id,
                'name': organization.name,
                'description': organization.description,
                'isActive': organization.isActive,
                'createdAt': organization.createdAt.isoformat() if organization.createdAt else None
            }
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'An error occurred while updating organization: {str(e)}'}), 500


@admin_bp.route('/organizations/<org_id>/deactivate', methods=['PUT'])
@jwt_required()
def deactivate_organization(org_id):
    """
    Admin-only route to deactivate an organization and all its users.
    Requires: Admin role in JWT claims.
    Args: org_id - The ID of the organization to deactivate
    Returns: Updated organization with deactivated status and count of deactivated users
    """
    if not admin_required():
        return jsonify({'error': 'Admin privileges required'}), 403

    try:
        # Find the organization to deactivate
        organization = Organization.objects(id=org_id).first()
        
        if not organization:
            return jsonify({'error': 'Organization not found'}), 404

        # Check if already deactivated
        if not organization.isActive:
            return jsonify({'error': 'Organization is already deactivated'}), 400

        # Deactivate all users in the organization
        users = User.objects(orgId=org_id).all()
        deactivated_count = 0
        
        for user in users:
            if user.isActive:
                user.isActive = False
                user.save()
                deactivated_count += 1

        # Deactivate the organization
        organization.isActive = False
        organization.save()
        
        # Log the Admin action
        admin_id = get_jwt_identity()
        print(f"AUDIT LOG: Admin User {admin_id} deactivated organization {org_id} ({organization.name}) and {deactivated_count} users at {datetime.utcnow()}")
        
        return jsonify({
            'message': 'Organization and its users deactivated successfully',
            'organization': {
                'id': organization.id,
                'name': organization.name,
                'description': organization.description,
                'isActive': organization.isActive,
                'createdAt': organization.createdAt.isoformat() if organization.createdAt else None
            },
            'deactivatedUsersCount': deactivated_count
        }), 200
    
    except Exception as e:
        return jsonify({'error': f'An error occurred while deactivating organization: {str(e)}'}), 500


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
