from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from mongoengine.connection import get_db
from mongoengine.errors import DoesNotExist, ValidationError
from datetime import datetime
import uuid
from app.models.mvp import Mvp

def convert_objectid_to_str(doc):
    """Convert MongoDB ObjectId to string in document"""
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

mvps_bp = Blueprint('mvps', __name__)


# role helpers
def get_current_role():
    claims = get_jwt() or {}
    return claims.get('role')

def require_chicken():
    """Return True if current user is a chicken role, False otherwise"""
    return get_current_role() == 'chicken'

#post API to create MVP
@mvps_bp.route('/', methods=['POST'])
@jwt_required()
def create_mvp():
    """Create a new MVP for a project"""
    data = request.get_json()
    try:
        # only chickens can create MVPs
        if not require_chicken():
            return jsonify({'success': False, 'error': 'Only chicken role may create MVPs'}), 403
        target_date = None
        if data.get('targetReleaseDate'):
            # Convert string 'YYYY-MM-DD' to datetime object
            target_date = datetime.strptime(data['targetReleaseDate'], '%Y-%m-%d')

        new_mvp = Mvp(
            name=data['name'],
            projectId=data['projectId'],
            description=data.get('description', ''),
            targetReleaseDate=target_date
        )
        new_mvp.save()
        return jsonify({'success': True, 'mvp': new_mvp.to_dict()}), 201
    except ValidationError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f'An error occurred: {str(e)}'}), 500

@mvps_bp.route('/', methods=['GET'])
@jwt_required()
def get_mvps_for_project():
    """Get all MVPs for a given project"""
    project_id = request.args.get('projectId')
    if not project_id:
        return jsonify({'success': False, 'error': 'projectId is required'}), 400
    
    mvps = Mvp.objects(projectId=project_id)
    db = get_db()
    
    results = []
    for mvp in mvps:
        mvp_dict = mvp.to_dict()
        
        # Fetch full story details for stories in this MVP
        story_ids = mvp_dict.get('storyIds', [])
        if story_ids:
            stories_cursor = db.stories.find({'storyId': {'$in': story_ids}})
            stories_list = [convert_objectid_to_str(story) for story in stories_cursor]
            mvp_dict['stories'] = stories_list
        else:
            mvp_dict['stories'] = []
        results.append(mvp_dict)
        
    return jsonify({'success': True, 'mvps': results}), 200

