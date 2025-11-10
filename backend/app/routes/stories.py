from flask import Blueprint, request, jsonify
from app.database import MongoDB
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId

stories_bp = Blueprint('stories', __name__)

def object_id_to_str(doc):
    """Convert MongoDB ObjectId to string in document"""
    if doc and '_id' in doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    return doc

@stories_bp.route('/', methods=['GET'], strict_slashes=False)
def get_stories():
    """Get all user stories (backlog)"""
    try:
        collection = MongoDB.get_collection()
        stories = list(collection.find().sort('created_at', -1))
        
        # Convert ObjectId to string and format dates
        for story in stories:
            object_id_to_str(story)
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
def get_story(story_id):
    """Get a single user story by ID"""
    try:
        if not ObjectId.is_valid(story_id):
            return jsonify({
                'success': False,
                'error': 'Invalid story ID'
            }), 400
        
        collection = MongoDB.get_collection()
        story = collection.find_one({'_id': ObjectId(story_id)})
        
        if not story:
            return jsonify({
                'success': False,
                'error': 'Story not found'
            }), 404
        
        object_id_to_str(story)
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
        
        # Prepare story document
        story_doc = {
            'role': data.get('role'),
            'goal': data.get('goal'),
            'description': data.get('description', ''),
            'acceptance_criteria': data.get('acceptance_criteria'),
            'story_points': data.get('story_points'),
            'business_value': data.get('business_value'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        collection = MongoDB.get_collection()
        result = collection.insert_one(story_doc)
        
        # Retrieve the created story
        created_story = collection.find_one({'_id': result.inserted_id})
        object_id_to_str(created_story)
        
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
def update_story(story_id):
    """Update an existing user story"""
    try:
        if not ObjectId.is_valid(story_id):
            return jsonify({
                'success': False,
                'error': 'Invalid story ID'
            }), 400
        
        collection = MongoDB.get_collection()
        story = collection.find_one({'_id': ObjectId(story_id)})
        
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
        
        # Update the story
        collection.update_one(
            {'_id': ObjectId(story_id)},
            {'$set': update_doc}
        )
        
        # Retrieve updated story
        updated_story = collection.find_one({'_id': ObjectId(story_id)})
        object_id_to_str(updated_story)
        
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
def delete_story(story_id):
    """Delete a user story"""
    try:
        if not ObjectId.is_valid(story_id):
            return jsonify({
                'success': False,
                'error': 'Invalid story ID'
            }), 400
        
        collection = MongoDB.get_collection()
        result = collection.delete_one({'_id': ObjectId(story_id)})
        
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

