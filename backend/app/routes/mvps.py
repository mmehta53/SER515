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

@mvps_bp.route('/<mvp_id>', methods=['PUT'])
@jwt_required()
def update_mvp(mvp_id):
    """Update an MVP's details"""
    data = request.get_json()
    db = get_db()
    try:
        # only chickens can update MVPs
        if not require_chicken():
            return jsonify({'success': False, 'error': 'Only chicken role may update MVPs'}), 403
        mvp = Mvp.objects.get(mvpId=mvp_id)
        if 'name' in data:
            mvp.name = data['name']
        if 'description' in data:
            mvp.description = data['description']
        if 'targetReleaseDate' in data:
            # Convert string 'YYYY-MM-DD' to datetime object, or None if empty
            target_date_str = data.get('targetReleaseDate')
            mvp.targetReleaseDate = datetime.strptime(target_date_str, '%Y-%m-%d') if target_date_str else None
        
        mvp.save()
        return jsonify({'success': True, 'mvp': mvp.to_dict()}), 200
    except DoesNotExist:
        return jsonify({'success': False, 'error': 'MVP not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': f'An error occurred: {str(e)}'}), 500

@mvps_bp.route('/<mvp_id>', methods=['DELETE'])
@jwt_required()
def delete_mvp(mvp_id):
    """Delete an MVP"""
    db = get_db()
    # Only chickens can delete MVPs
    if not require_chicken():
        return jsonify({'success': False, 'error': 'Only chicken role may delete MVPs'}), 403

    # Unset mvpId and mvpStatus from all stories associated with this MVP
    db.stories.update_many({'mvpId': mvp_id}, {'$unset': {'mvpId': '', 'mvpStatus': ''}})

    try:
        mvp = Mvp.objects.get(mvpId=mvp_id)
        mvp.delete()
        return jsonify({'success': True, 'message': 'MVP deleted successfully'}), 200
    except DoesNotExist:
        return jsonify({'success': False, 'error': 'MVP not found'}), 404
    
@mvps_bp.route('/<mvp_id>/stories', methods=['POST'])
@jwt_required()
def assign_story_to_mvp(mvp_id):
    """Assign a story to an MVP"""
    data = request.get_json()
    story_id = data.get('storyId')
    if not story_id:
        return jsonify({'success': False, 'error': 'storyId is required'}), 400

    db = get_db()
    try:
        # Only pig or chicken can add stories to an MVP
        claims_role = get_current_role()
        if claims_role not in ['pig', 'chicken']:
            return jsonify({'success': False, 'error': 'Only pig or chicken role may add stories to an MVP'}), 403

        # Validate optional mvpStatus
        mvp_status = data.get('mvpStatus')
        if mvp_status:
            if mvp_status not in ['must-have', 'nice-to-have']:
                return jsonify({'success': False, 'error': 'Invalid mvpStatus. Must be must-have or nice-to-have'}), 400
            # Only chickens are allowed to set the mvpStatus
            if claims_role != 'chicken':
                return jsonify({'success': False, 'error': 'Only chicken role may set MVP-specific story status'}), 403

        # Add story to MVP's list
        Mvp.objects(mvpId=mvp_id).update_one(add_to_set__storyIds=story_id)

        # Set mvpId and optionally mvpStatus on the story
        update_fields = {'mvpId': mvp_id}
        if mvp_status:
            update_fields['mvpStatus'] = mvp_status

        db.stories.update_one({'storyId': story_id}, {'$set': update_fields})

        return jsonify({'success': True, 'message': 'Story assigned to MVP'}), 200
    except DoesNotExist:
        return jsonify({'success': False, 'error': 'MVP not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': f'An error occurred: {str(e)}'}), 500

@mvps_bp.route('/<mvp_id>/stories/<story_id>', methods=['DELETE'])
@jwt_required()
def remove_story_from_mvp(mvp_id, story_id):
    """Remove a story from an MVP"""
    db = get_db()
    # Only chickens may remove stories from an MVP
    if not require_chicken():
        return jsonify({'success': False, 'error': 'Only chicken role may remove stories from an MVP'}), 403

    # Remove story from MVP's list
    try:
        Mvp.objects(mvpId=mvp_id).update_one(pull__storyIds=story_id)

        # Unset mvpId and mvpStatus on the story
        db.stories.update_one({'storyId': story_id}, {'$unset': {'mvpId': '', 'mvpStatus': ''}})

        return jsonify({'success': True, 'message': 'Story removed from MVP'}), 200
    except DoesNotExist:
        return jsonify({'success': False, 'error': 'MVP not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': f'An error occurred: {str(e)}'}), 500


@mvps_bp.route('/<mvp_id>/stories/<story_id>', methods=['PUT'])
@jwt_required()
def update_mvp_story_status(mvp_id, story_id):
    """Allow chicken to set or change the mvpStatus for a story already assigned to an MVP.

    The request body should include {'mvpStatus': 'must-have'|'nice-to-have'|null}
    Only role 'chicken' is allowed to set or change this. If mvpStatus is null/empty it will be removed.
    """
    data = request.get_json() or {}
    mvp_status = data.get('mvpStatus')

    # Only chickens may set/change mvpStatus
    if not require_chicken():
        return jsonify({'success': False, 'error': 'Only chicken role may set MVP-specific story status'}), 403

    # Validate mvp_status if provided
    if mvp_status is not None and mvp_status not in ['must-have', 'nice-to-have', '']:
        return jsonify({'success': False, 'error': 'Invalid mvpStatus. Must be must-have or nice-to-have or empty to unset'}), 400

    db = get_db()
    # Ensure story exists and is currently assigned to this mvp
    story = db.stories.find_one({'storyId': story_id})
    if not story:
        return jsonify({'success': False, 'error': 'Story not found'}), 404

    if story.get('mvpId') != mvp_id:
        return jsonify({'success': False, 'error': 'Story is not assigned to the given MVP'}), 400

    try:
        if mvp_status:
            db.stories.update_one({'storyId': story_id}, {'$set': {'mvpStatus': mvp_status}})
        else:
            db.stories.update_one({'storyId': story_id}, {'$unset': {'mvpStatus': ''}})

        updated = db.stories.find_one({'storyId': story_id})
        convert_objectid_to_str(updated)
        return jsonify({'success': True, 'story': updated}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'An error occurred: {str(e)}'}), 500

@mvps_bp.route('/available-stories', methods=['GET'])
@jwt_required()
def get_available_stories():
    """
    Get stories that are 'groomed' and not yet assigned to an MVP for a project.
    """
    project_id = request.args.get('projectId')
    if not project_id:
        return jsonify({'success': False, 'error': 'projectId is required'}), 400

    db = get_db()
    query = {
        'projectId': project_id,
        'status': 'groomed',
        'mvpId': {'$exists': False}
    }
    stories = list(db.stories.find(query))

    for story in stories:
        convert_objectid_to_str(story)
        if 'created_at' in story and isinstance(story['created_at'], datetime):
            story['created_at'] = story['created_at'].isoformat()
        if 'updated_at' in story and isinstance(story['updated_at'], datetime):
            story['updated_at'] = story['updated_at'].isoformat()

    return jsonify({'success': True, 'stories': stories}), 200