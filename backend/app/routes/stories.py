from flask_jwt_extended import jwt_required
from flask import Blueprint, request, jsonify
from mongoengine.connection import get_db
from datetime import datetime
from bson import ObjectId
import uuid


stories_bp = Blueprint('stories', __name__)

def convert_objectid_to_str(doc):
    """Convert MongoDB ObjectId to string in document"""
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc



@stories_bp.route('/', methods=['GET'], strict_slashes=False)
@jwt_required()
def get_stories():
    """Get all user stories for a project"""
    try:
        # Get projectId from query parameter
        project_id = request.args.get('projectId')
        
        if not project_id:
            return jsonify({
                'success': False,
                'error': 'projectId is required'
            }), 400
        
        db = get_db()
        collection = db['stories']
        
        # Filter stories by projectId
        query = {'projectId': project_id}
        stories = list(collection.find(query).sort('created_at', -1))
        
        # Convert ObjectId to string and format dates
        for story in stories:
            convert_objectid_to_str(story)
            # Convert datetime objects to ISO format strings
            if 'created_at' in story and isinstance(story['created_at'], datetime):
                story['created_at'] = story['created_at'].isoformat()
            if 'updated_at' in story and isinstance(story['updated_at'], datetime):
                story['updated_at'] = story['updated_at'].isoformat()
        
        return jsonify({
            'success': True,
            'stories': stories
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@stories_bp.route('/<story_id>', methods=['GET'])
@jwt_required()
def get_story(story_id):
    """Get a single user story by ID"""
    try:
        if not story_id:
            return jsonify({
                'success': False,
                'error': 'Invalid story ID'
            }), 400
        
        db = get_db()
        collection = db['stories']
        story = collection.find_one({'storyId': story_id})
        
        if not story:
            return jsonify({
                'success': False,
                'error': 'Story not found'
            }), 404
        
        convert_objectid_to_str(story)
        # Convert datetime objects to ISO format strings
        if 'created_at' in story and isinstance(story['created_at'], datetime):
            story['created_at'] = story['created_at'].isoformat()
        if 'updated_at' in story and isinstance(story['updated_at'], datetime):
            story['updated_at'] = story['updated_at'].isoformat()
        
        return jsonify({
            'success': True,
            'story': story
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@stories_bp.route('/', methods=['POST'], strict_slashes=False)
@jwt_required()
def create_story():
    """Create a new user story"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('role') or not data.get('goal') or not data.get('acceptance_criteria'):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: role, goal, and acceptance_criteria are required'
            }), 400
        
        # Validate projectId
        if not data.get('projectId'):
            return jsonify({
                'success': False,
                'error': 'projectId is required'
            }), 400
        
        # Prepare story document
        story_doc = {
            'role': data.get('role'),
            'goal': data.get('goal'),
            'description': data.get('description', ''),
            'acceptance_criteria': data.get('acceptance_criteria'),
            'story_points': data.get('story_points'),
            'business_value': data.get('business_value'),
            'projectId': data.get('projectId'),
            'storyId': str(uuid.uuid4()),
            'status': data.get('status', 'draft'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        db = get_db()
        collection = db['stories']
        result = collection.insert_one(story_doc)
        
        # Retrieve the created story
        created_story = collection.find_one({'storyId': story_doc['storyId']})
        
        convert_objectid_to_str(created_story)
        # Convert datetime objects to ISO format strings
        if 'created_at' in created_story and isinstance(created_story['created_at'], datetime):
            created_story['created_at'] = created_story['created_at'].isoformat()
        if 'updated_at' in created_story and isinstance(created_story['updated_at'], datetime):
            created_story['updated_at'] = created_story['updated_at'].isoformat()
        
        return jsonify({
            'success': True,
            'story': created_story,
            'message': 'User story created successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@stories_bp.route('/<story_id>', methods=['PUT'])
@jwt_required()
def update_story(story_id):
    """Update an existing user story"""
    try:
        if not story_id:
            return jsonify({
                'success': False,
                'error': 'Invalid story ID'
            }), 400
        
        db = get_db()
        collection = db['stories']
        story = collection.find_one({'storyId': story_id})
        
        if not story:
            return jsonify({
                'success': False,
                'error': 'Story not found'
            }), 404
        
        data = request.get_json()
        
        # Validate required fields if being updated
        if 'role' in data and not data['role']:
            return jsonify({
                'success': False,
                'error': 'Role cannot be empty'
            }), 400
        if 'goal' in data and not data['goal']:
            return jsonify({
                'success': False,
                'error': 'Goal cannot be empty'
            }), 400
        if 'acceptance_criteria' in data and not data['acceptance_criteria']:
            return jsonify({
                'success': False,
                'error': 'Acceptance criteria cannot be empty'
            }), 400
        
        # Build update document
        update_doc = {'updated_at': datetime.utcnow()}
        if 'role' in data:
            update_doc['role'] = data['role']
        if 'goal' in data:
            update_doc['goal'] = data['goal']
        if 'description' in data:
            update_doc['description'] = data['description']
        if 'acceptance_criteria' in data:
            update_doc['acceptance_criteria'] = data['acceptance_criteria']
        if 'story_points' in data:
            update_doc['story_points'] = data['story_points']
        if 'business_value' in data:
            update_doc['business_value'] = data['business_value']
        if 'projectId' in data:
            update_doc['projectId'] = data['projectId']
        if 'status' in data:
            # Validate status value
            valid_statuses = ['draft', 'groomed', 'sprint-ready']
            if data['status'] in valid_statuses:
                update_doc['status'] = data['status']
            else:
                return jsonify({
                    'success': False,
                    'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'
                }), 400
        
        # Update the story
        collection.update_one(
            {'storyId': story_id},
            {'$set': update_doc}
        )
        
        # Retrieve updated story
        updated_story = collection.find_one({'storyId': story_id})
        
        convert_objectid_to_str(updated_story)
        # Convert datetime objects to ISO format strings
        if 'created_at' in updated_story and isinstance(updated_story['created_at'], datetime):
            updated_story['created_at'] = updated_story['created_at'].isoformat()
        if 'updated_at' in updated_story and isinstance(updated_story['updated_at'], datetime):
            updated_story['updated_at'] = updated_story['updated_at'].isoformat()
        
        return jsonify({
            'success': True,
            'story': updated_story,
            'message': 'User story updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@stories_bp.route('/<story_id>', methods=['DELETE'])
@jwt_required()
def delete_story(story_id):
    """Delete a user story"""
    try:
        if not story_id:
            return jsonify({
                'success': False,
                'error': 'Invalid story ID'
            }), 400
        
        db = get_db()
        collection = db['stories']
        result = collection.delete_one({'storyId': story_id})
        
        if result.deleted_count == 0:
            return jsonify({
                'success': False,
                'error': 'Story not found'
            }), 404
        
        return jsonify({
            'success': True,
            'message': 'User story deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

