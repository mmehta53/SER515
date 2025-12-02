from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from app.models.project import Project
from mongoengine.connection import get_db

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
        db = get_db()
        stories_collection = db['stories']
        # Get all projects for the organization
        projects = Project.get_projects_by_org_id(org_id)
        
        # Convert projects to list of dictionaries
        projects_list = []
        for project in projects:
            # Count sprint-ready stories for each project
            ready_stories_count = stories_collection.count_documents({
                'projectId': project.projId,
                'status': 'sprint-ready'
            })
            total_stories_count = stories_collection.count_documents({
                'projectId': project.projId
            })
            projects_list.append({
                'name': project.name,
                'description': project.description,
                'status': project.status,
                'projId': project.projId,
                'orgId': project.orgId,
                'createdAt': project.createdAt,
                'progress': project.progress,
                'totalStories': total_stories_count,
                'readyStories': ready_stories_count
            })
        
        return jsonify({
            'projects': projects_list
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Error fetching projects: {str(e)}'
        }), 500