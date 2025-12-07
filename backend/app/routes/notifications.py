"""Routes for notification management (fetching, marking read, preferences)."""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from mongoengine.connection import get_db
from datetime import datetime
import uuid

from app.models.notification import Notification, NotificationPreference

notifications_bp = Blueprint('notifications', __name__)


def convert_objectid_to_str(doc):
    """Convert MongoDB ObjectId to string in document."""
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc


@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all unread notifications for the current user (optionally filtered by project).
    
    Query params:
      - projectId (optional): if set, only get notifications for this project
      - limit (optional, default 50): max notifications to return
      - offset (optional, default 0): pagination offset
    """
    try:
        user_id = get_jwt_identity()
        project_id = request.args.get('projectId')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        query = {'userId': user_id}
        if project_id:
            query['projectId'] = project_id
        
        # Fetch notifications sorted by newest first, unread first
        notifs = list(Notification.objects(**query).order_by('-createdAt', '-isRead').skip(offset).limit(limit))
        
        result = []
        for n in notifs:
            result.append({
                'notificationId': n.notificationId,
                'eventType': n.eventType,
                'title': n.title,
                'message': n.message,
                'relatedStoryId': n.relatedStoryId,
                'relatedMvpId': n.relatedMvpId,
                'triggeredBy': n.triggeredBy,
                'triggeredByName': n.triggeredByName,
                'isRead': n.isRead,
                'createdAt': n.createdAt.isoformat() if n.createdAt else None,
            })
        
        return jsonify({'success': True, 'notifications': result}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@notifications_bp.route('/<notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    """Mark a single notification as read."""
    try:
        user_id = get_jwt_identity()
        
        notif = Notification.objects(notificationId=notification_id).first()
        if not notif:
            return jsonify({'success': False, 'error': 'Notification not found'}), 404
        
        # Verify ownership
        if notif.userId != user_id:
            return jsonify({'success': False, 'error': 'Unauthorized'}), 403
        
        notif.isRead = True
        notif.save()
        
        return jsonify({'success': True, 'message': 'Marked as read'}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications for the current user as read (optionally filtered by project)."""
    try:
        user_id = get_jwt_identity()
        project_id = request.args.get('projectId')
        
        query = {'userId': user_id}
        if project_id:
            query['projectId'] = project_id
        
        db = get_db()
        result = db.notifications.update_many(query, {'$set': {'isRead': True}})
        
        return jsonify({'success': True, 'updated': result.modified_count}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@notifications_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_notification_preferences():
    """Get notification preferences for the current user in a project.
    
    Query params:
      - projectId (required): project to get preferences for
    """
    try:
        user_id = get_jwt_identity()
        project_id = request.args.get('projectId')
        
        if not project_id:
            return jsonify({'success': False, 'error': 'projectId is required'}), 400
        
        prefs = NotificationPreference.objects(userId=user_id, projectId=project_id).first()
        
        if not prefs:
            # Return default preferences if not found
            return jsonify({'success': True, 'preferences': {
                'notifySprintReady': True,
                'notifyStoryUpdated': True,
                'notifyStatusChange': True,
                'notifyComments': True,
            }}), 200
        
        return jsonify({'success': True, 'preferences': prefs.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@notifications_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_notification_preferences():
    """Update notification preferences for the current user in a project.
    
    Body JSON:
      - projectId (required)
      - notifySprintReady (optional, bool)
      - notifyStoryUpdated (optional, bool)
      - notifyStatusChange (optional, bool)
      - notifyComments (optional, bool)
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json() or {}
        project_id = data.get('projectId')
        
        if not project_id:
            return jsonify({'success': False, 'error': 'projectId is required'}), 400
        
        # Get or create preferences
        prefs = NotificationPreference.objects(userId=user_id, projectId=project_id).first()
        if not prefs:
            prefs = NotificationPreference(userId=user_id, projectId=project_id)
        
        # Update fields if provided
        if 'notifySprintReady' in data:
            prefs.notifySprintReady = bool(data['notifySprintReady'])
        if 'notifyStoryUpdated' in data:
            prefs.notifyStoryUpdated = bool(data['notifyStoryUpdated'])
        if 'notifyStatusChange' in data:
            prefs.notifyStatusChange = bool(data['notifyStatusChange'])
        if 'notifyComments' in data:
            prefs.notifyComments = bool(data['notifyComments'])
        
        prefs.save()
        
        return jsonify({'success': True, 'preferences': prefs.to_dict()}), 200
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
