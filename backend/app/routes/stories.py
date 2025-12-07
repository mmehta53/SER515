from flask_jwt_extended import jwt_required, get_jwt_identity
from flask import Blueprint, request, jsonify
from mongoengine.connection import get_db
from datetime import datetime
from bson import ObjectId
import uuid
from app.utils.notifications import broadcast_notification_to_project


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
            'updated_at': datetime.utcnow(),
            'comments': [], # Initialize comments array
            'ideaId': data.get('ideaId') # Link to the idea
        }
        
        db = get_db()
        collection = db['stories']
        result = collection.insert_one(story_doc)
        
        # Retrieve the created story
        # If an ideaId is provided, update the idea's status to 'moved'
        if story_doc.get('ideaId'):
            ideas_collection = db['ideas']
            ideas_collection.update_one(
                {'ideaId': story_doc['ideaId']},
                {'$set': {'status': 'moved'}}
            )
        
        # Increment totalStories count in the project
        projects_collection = db['projects']
        projects_collection.update_one(
            {'projId': story_doc['projectId']},
            {'$inc': {'totalStories': 1}}
        )
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

@stories_bp.route('/<story_id>/comment', methods=['POST'])
@jwt_required()
def add_comment_to_story(story_id):
    """Add a comment to a user story"""
    try:
        data = request.get_json()
        if not data or 'text' not in data or not data['text'].strip():
            return jsonify({'success': False, 'error': 'Comment text is required'}), 400

        db = get_db()
        collection = db['stories']
        story = collection.find_one({'storyId': story_id})

        if not story:
            return jsonify({'success': False, 'error': 'Story not found'}), 404

        current_user_id = get_jwt_identity()
        user = db['users'].find_one({'userId': current_user_id})
        user_name = user.get('firstName', 'Anonymous') if user else 'Anonymous'

        comment = {
            'commentId': str(uuid.uuid4()),
            'userId': current_user_id,
            'userName': user_name,
            'text': data['text'].strip(),
            'created_at': datetime.utcnow()
        }

        collection.update_one(
            {'storyId': story_id},
            {'$push': {'comments': comment}}
        )

        # Retrieve updated story
        updated_story = collection.find_one({'storyId': story_id})

        # Broadcast a comment notification to project members (excluding the commenter)
        try:
            project_id = updated_story.get('projectId')
            broadcast_notification_to_project(
                project_id=project_id,
                event_type='comment',
                title='New comment on story',
                message=f"{user_name} commented on '{updated_story.get('goal', 'Story')}'",
                triggered_by_id=current_user_id,
                triggered_by_name=user_name,
                related_story_id=story_id,
                exclude_user_id=current_user_id,
                deduplicate=False,
            )
        except Exception:
            # Notification failures should not break the comment API
            pass

        convert_objectid_to_str(updated_story)
        if 'created_at' in updated_story and isinstance(updated_story['created_at'], datetime):
            updated_story['created_at'] = updated_story['created_at'].isoformat()
        if 'updated_at' in updated_story and isinstance(updated_story['updated_at'], datetime):
            updated_story['updated_at'] = updated_story['updated_at'].isoformat()

        return jsonify(updated_story), 200

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

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
        
        # Trigger notifications if status changed to sprint-ready or essential fields changed
        current_user_id = get_jwt_identity()
        db = get_db()
        user = db['users'].find_one({'userId': current_user_id})
        user_name = user.get('firstName', 'Unknown') if user else 'Unknown'
        project_id = updated_story.get('projectId')

        # Debug logging
        old_status = story.get('status', 'draft')
        new_status = data.get('status')
        print(f"[NOTIFICATION DEBUG] old_status={old_status}, new_status={new_status}, project_id={project_id}")
        
        # Check if status changed to sprint-ready (only notify if transitioning TO sprint-ready)
        if new_status == 'sprint-ready' and old_status != 'sprint-ready':
            print(f"[NOTIFICATION DEBUG] Triggering sprint_ready notification")
            broadcast_notification_to_project(
                project_id=project_id,
                event_type='sprint_ready',
                title=f"Story Ready for Sprint",
                message=f"{user_name} marked '{updated_story.get('goal', 'Story')}' as sprint-ready",
                triggered_by_id=current_user_id,
                triggered_by_name=user_name,
                related_story_id=story_id,
                exclude_user_id=current_user_id,
                deduplicate=False,
            )
        else:
            print(f"[NOTIFICATION DEBUG] Skipped sprint_ready: new_status={new_status}, old_status={old_status}")

            # Notify when status changes to 'draft' or 'groomed' (separate notifications)
            if new_status in ['draft', 'groomed'] and old_status != new_status:
                try:
                    broadcast_notification_to_project(
                        project_id=project_id,
                        event_type='status_change',
                        title='Story status changed',
                        message=f"{user_name} changed status to '{new_status}' for '{updated_story.get('goal', 'Story')}'",
                        triggered_by_id=current_user_id,
                        triggered_by_name=user_name,
                        related_story_id=story_id,
                        exclude_user_id=current_user_id,
                        deduplicate=False,
                    )
                except Exception:
                    # Don't fail the update if broadcasting fails
                    pass
        
        # Notify on essential field changes (goal, acceptance_criteria, story_points, business_value)
        essential_fields = ['goal', 'acceptance_criteria', 'story_points', 'business_value']
        changed_essentials = [f for f in essential_fields if f in data and data[f] != story.get(f)]
        
        if changed_essentials:
            field_names = ', '.join(changed_essentials)
            broadcast_notification_to_project(
                project_id=project_id,
                event_type='story_updated',
                title=f"Story Updated",
                message=f"{user_name} updated {field_names} in '{updated_story.get('goal', 'Story')}'",
                triggered_by_id=current_user_id,
                triggered_by_name=user_name,
                related_story_id=story_id,
                exclude_user_id=current_user_id,
                deduplicate=False,  # allow multiple updates
            )
        
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
        # Find and delete the story to get its projectId
        deleted_story = collection.find_one_and_delete({'storyId': story_id})
        
        if not deleted_story:
            return jsonify({
                'success': False,
                'error': 'Story not found'
            }), 404
        
        # Decrement totalStories count in the project
        projects_collection = db['projects']
        projects_collection.update_one(
            {'projId': deleted_story['projectId']},
            {'$inc': {'totalStories': -1}}
        )
        
        return jsonify({
            'success': True,
            'message': 'User story deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
