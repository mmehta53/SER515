from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.models.organization import Organization
from app.models.user import User

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
