import uuid
from datetime import datetime
from mongoengine import Document, StringField, BooleanField, DateTimeField, DictField, ListField


class Notification(Document):
    """A single notification sent to a user."""
    meta = {'collection': 'notifications'}

    notificationId = StringField(required=True, unique=True, default=lambda: str(uuid.uuid4()))
    userId = StringField(required=True, index=True)
    projectId = StringField(required=True)
    eventType = StringField(required=True)
    title = StringField(required=True)
    message = StringField(required=True)
    relatedStoryId = StringField()
    relatedMvpId = StringField()
    triggeredBy = StringField()
    triggeredByName = StringField()
    isRead = BooleanField(default=False)
    createdAt = DateTimeField(default=datetime.utcnow)
    
    eventHash = StringField(index=True)


class NotificationPreference(Document):
    """User's notification preferences."""
    meta = {
        'collection': 'notification_preferences',
        'indexes': [
            {
                'fields': ['userId', 'projectId'],
                'unique': True
            }
        ]
    }

    prefId = StringField(required=True, unique=True, default=lambda: str(uuid.uuid4()))
    userId = StringField(required=True, index=True)
    projectId = StringField(required=True, index=True)
    
    # Toggle preferences for each event type (default all True for new users)
    notifySprintReady = BooleanField(default=True)
    notifyStoryUpdated = BooleanField(default=True)
    notifyStatusChange = BooleanField(default=True)
    notifyComments = BooleanField(default=True)
    
    createdAt = DateTimeField(default=datetime.utcnow)
    updatedAt = DateTimeField(default=datetime.utcnow)

    def save(self, *args, **kwargs):
        """Update timestamp on save."""
        self.updatedAt = datetime.utcnow()
        return super(NotificationPreference, self).save(*args, **kwargs)

    def to_dict(self):
        """Return dict representation."""
        return {
            'prefId': self.prefId,
            'userId': self.userId,
            'projectId': self.projectId,
            'notifySprintReady': self.notifySprintReady,
            'notifyStoryUpdated': self.notifyStoryUpdated,
            'notifyStatusChange': self.notifyStatusChange,
            'notifyComments': self.notifyComments,
            'createdAt': self.createdAt.isoformat() if self.createdAt else None,
            'updatedAt': self.updatedAt.isoformat() if self.updatedAt else None,
        }
