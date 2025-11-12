import uuid
from datetime import datetime
from mongoengine import Document, StringField, DateTimeField, ListField, ReferenceField, IntField, EmbeddedDocument, EmbeddedDocumentListField
from app.models.organization import Organization

class Comment(EmbeddedDocument):
    """Embedded comment document"""
    commentId = StringField(default=lambda: str(uuid.uuid4()))
    userId = StringField(required=True)
    userName = StringField(required=True)
    text = StringField(required=True)
    createdAt = DateTimeField(default=datetime.utcnow)

class Vote(EmbeddedDocument):
    """Embedded vote document to track upvotes/downvotes per user"""
    userId = StringField(required=True)
    voteType = StringField(required=True)  # 'upvote' or 'downvote'

class Idea(Document):
    meta = {'collection': 'ideas'}

    ideaId = StringField(required=True, unique=True, default=lambda: str(uuid.uuid4()))  # Custom unique ID
    title = StringField(required=True, max_length=255)
    description = StringField(required=True)
    tags = ListField(StringField(max_length=50))
    status = StringField(default='new')  # 'new', 'reviewed', 'moved'
    createdBy = StringField(required=True)  # userId
    createdByName = StringField()  # userName
    projId = StringField(required=True)  # Project ID (foreign key)
    upvotes = IntField(default=0)
    downvotes = IntField(default=0)
    votes = EmbeddedDocumentListField(Vote)  # Track individual votes
    comments = EmbeddedDocumentListField(Comment)  # Embedded comments
    createdAt = DateTimeField(default=datetime.utcnow)
    updatedAt = DateTimeField(default=datetime.utcnow)

    def save(self, *args, **kwargs):
        self.updatedAt = datetime.utcnow()
        return super(Idea, self).save(*args, **kwargs)

    def to_dict(self):
        """Return a dictionary representation for API responses."""
        return {
            "ideaId": self.ideaId,
            "title": self.title,
            "description": self.description,
            "tags": self.tags if self.tags else [],
            "status": self.status,
            "createdBy": self.createdBy,
            "createdByName": self.createdByName,
            "projId": self.projId,
            "upvotes": self.upvotes,
            "downvotes": self.downvotes,
            "comments": [
                {
                    "commentId": comment.commentId,
                    "userId": comment.userId,
                    "userName": comment.userName,
                    "text": comment.text,
                    "createdAt": comment.createdAt.isoformat() if comment.createdAt else None
                }
                for comment in (self.comments if self.comments else [])
            ],
            "createdAt": self.createdAt.isoformat() if self.createdAt else None,
            "updatedAt": self.updatedAt.isoformat() if self.updatedAt else None,
        }