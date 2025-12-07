"""Notification helper functions for creating and managing notifications."""
import hashlib
import logging
from datetime import datetime
from mongoengine.connection import get_db
from app.models.notification import Notification, NotificationPreference

logger = logging.getLogger(__name__)


def _get_event_hash(event_type: str, story_id: str, triggered_by: str) -> str:
    """Generate a hash for deduplication of notifications.
    
    Prevents duplicate notifications for the same event within a time window.
    """
    key = f"{event_type}:{story_id}:{triggered_by}"
    return hashlib.md5(key.encode()).hexdigest()


def _should_deduplicate(event_hash: str, time_window_seconds: int = 60) -> bool:
    """Check if a notification with this hash was sent recently (within time_window).
    
    This prevents spamming the same notification multiple times.
    """
    db = get_db()
    cutoff = datetime.utcnow()
    cutoff_seconds_ago = datetime.fromtimestamp(
        cutoff.timestamp() - time_window_seconds
    )
    
    recent = db.notifications.find_one({
        'eventHash': event_hash,
        'createdAt': {'$gte': cutoff_seconds_ago}
    })
    
    return recent is not None


def create_notification(
    user_id: str,
    project_id: str,
    event_type: str,
    title: str,
    message: str,
    triggered_by_id: str,
    triggered_by_name: str = "System",
    related_story_id: str = None,
    related_mvp_id: str = None,
    deduplicate: bool = True,
    dedup_window: int = 60,
) -> dict:
    """Create a notification for a user.
    
    Args:
        user_id: recipient userId
        project_id: projectId
        event_type: 'sprint_ready', 'story_updated', etc.
        title: notification title
        message: notification message
        triggered_by_id: userId of who triggered it
        triggered_by_name: display name of who triggered it
        related_story_id: storyId if applicable
        related_mvp_id: mvpId if applicable
        deduplicate: if True, skip if similar notification sent recently
        dedup_window: time window in seconds for dedup check
    
    Returns:
        dict with 'success', 'notificationId' or 'error'
    """
    try:
        # Check preferences
        try:
            prefs = NotificationPreference.objects(userId=user_id, projectId=project_id).first()
        except Exception:
            prefs = None
        
        # Default to allow if no prefs found
        if prefs:
            # Check event type mapping
            if event_type == 'sprint_ready' and not prefs.notifySprintReady:
                return {"success": True, "skipped": True, "reason": "sprint_ready disabled"}
            if event_type == 'story_updated' and not prefs.notifyStoryUpdated:
                return {"success": True, "skipped": True, "reason": "story_updated disabled"}
            if event_type == 'status_change' and not prefs.notifyStatusChange:
                return {"success": True, "skipped": True, "reason": "status_change disabled"}
            if event_type == 'comment' and not prefs.notifyComments:
                return {"success": True, "skipped": True, "reason": "comments disabled"}
        
        # Generate dedup hash
        event_hash = _get_event_hash(event_type, related_story_id or "", triggered_by_id)
        
        # Check deduplication
        if deduplicate and _should_deduplicate(event_hash, dedup_window):
            return {"success": True, "skipped": True, "reason": "duplicate within window"}
        
        # Create notification
        notif = Notification(
            userId=user_id,
            projectId=project_id,
            eventType=event_type,
            title=title,
            message=message,
            relatedStoryId=related_story_id,
            relatedMvpId=related_mvp_id,
            triggeredBy=triggered_by_id,
            triggeredByName=triggered_by_name,
            eventHash=event_hash,
        )
        notif.save()
        
        return {"success": True, "notificationId": notif.notificationId}
    
    except Exception as e:
        logger.exception("Error creating notification")
        return {"success": False, "error": str(e)}


def broadcast_notification_to_project(
    project_id: str,
    event_type: str,
    title: str,
    message: str,
    triggered_by_id: str,
    triggered_by_name: str = "System",
    related_story_id: str = None,
    related_mvp_id: str = None,
    exclude_user_id: str = None,
    deduplicate: bool = True,
) -> dict:
    """Create and send a notification to all active project members.
    
    Args:
        project_id: projectId
        event_type: notification event type
        title, message: notification content
        triggered_by_id: userId who triggered it
        triggered_by_name: display name
        related_story_id, related_mvp_id: context
        exclude_user_id: if set, don't notify this user (usually the person who triggered)
        deduplicate: enable dedup
    
    Returns:
        dict with 'success', 'notified_count' or 'error'
    """
    try:
        db = get_db()
        
        # Find all active users in this project
        # Assuming users have an orgId and projects have a list of memberIds or orgId reference
        # For now, query users by orgId from project
        project_doc = db.projects.find_one({'projId': project_id})
        if not project_doc:
            return {"success": False, "error": "Project not found"}
        
        org_id = project_doc.get('orgId')
        users = list(db.users.find({'orgId': org_id, 'isActive': True}))
        
        notified_count = 0
        for user in users:
            user_id = user.get('userId')
            
            # Skip excluded user (usually the trigger)
            if exclude_user_id and user_id == exclude_user_id:
                continue

            # Respect per-user preferences (check via notification_preferences collection)
            try:
                pref_doc = db.notification_preferences.find_one({'userId': user_id, 'projectId': project_id})
            except Exception:
                pref_doc = None

            # Map event type to preference field; default to True when preference missing
            pref_field_map = {
                'sprint_ready': 'notifySprintReady',
                'story_updated': 'notifyStoryUpdated',
                'status_change': 'notifyStatusChange',
                'comment': 'notifyComments',
            }
            pref_field = pref_field_map.get(event_type)

            if pref_field:
                pref_enabled = True
                if pref_doc is not None:
                    # Preference stored with camelCase keys - check accordingly
                    pref_enabled = bool(pref_doc.get(pref_field, True))
                if not pref_enabled:
                    # User opted out for this event type
                    continue

            # Create notification for this user
            res = create_notification(
                user_id=user_id,
                project_id=project_id,
                event_type=event_type,
                title=title,
                message=message,
                triggered_by_id=triggered_by_id,
                triggered_by_name=triggered_by_name,
                related_story_id=related_story_id,
                related_mvp_id=related_mvp_id,
                deduplicate=deduplicate,
            )

            if res.get("success") and not res.get("skipped"):
                notified_count += 1
        
        return {"success": True, "notified_count": notified_count}
    
    except Exception as e:
        logger.exception("Error broadcasting notification")
        return {"success": False, "error": str(e)}
