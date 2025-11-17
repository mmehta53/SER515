from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.models.project import Project

projects_bp = Blueprint('projects', __name__)

@projects_bp.route('/', methods=['POST'])
@jwt_required()
def create_project():
    # Get data from request
    data = request.get_json()
    
    # Validate required fields
    if not data or 'name' not in data or 'description' not in data:
        return jsonify({
            'error': 'Project name and description are required'
        }), 400
    
    # Get orgId from JWT claims
    claims = get_jwt()
    org_id = claims.get('orgId')
    
    if not org_id:
        return jsonify({
            'error': 'Organization ID not found in token'
        }), 401
    
    try:
        # Create new project
        project = Project(
            name=data['name'],
            description=data['description'],
            orgId=org_id
        )
        project.save()
        
        # Return project data
        return jsonify({
            'message': 'Project created successfully',
            'project': {
                'name': project.name,
                'description': project.description,
                'status': project.status,
                'projId': project.projId,
                'orgId': project.orgId,
                'createdAt': project.createdAt,
                'progress': project.progress,
                'totalStories': project.totalStories,
                'readyStories': project.readyStories
            }
        }), 201
        
    except Exception as e:
        return jsonify({
            'error': f'Error creating project: {str(e)}'
        }), 500

@projects_bp.route('/', methods=['GET'])
@jwt_required()
def get_projects():
    # Get orgId from JWT claims
    claims = get_jwt()
    org_id = claims.get('orgId')
    
    if not org_id:
        return jsonify({
            'error': 'Organization ID not found in token'
        }), 401
    
    try:
        # Get all projects for the organization
        projects = Project.get_projects_by_org_id(org_id)
        
        # Convert projects to list of dictionaries
        projects_list = [{
            'name': project.name,
            'description': project.description,
            'status': project.status,
            'projId': project.projId,
            'orgId': project.orgId,
            'createdAt': project.createdAt,
            'progress': project.progress,
            'totalStories': project.totalStories,
            'readyStories': project.readyStories
        } for project in projects]
        
        return jsonify({
            'projects': projects_list
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Error fetching projects: {str(e)}'
        }), 500