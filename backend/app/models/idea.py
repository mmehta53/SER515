import uuid
from datetime import datetime
from mongoengine import Document, StringField, DateTimeField, ListField, ReferenceField
from app.models.organization import Organization

class Idea(Document):
    meta = {'collection': 'ideas'}

    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    title = StringField(required=True, max_length=255)
    description = StringField(required=True)
    # tags = ListField(StringField(max_length=50))
    priority = StringField(choices=('low', 'medium', 'high'), default='medium')
    status = StringField(default='new') 
    createdBy = StringField(required=True) 
    organization = ReferenceField(Organization, required=True)
    createdAt = DateTimeField(default=datetime.utcnow)
    updatedAt = DateTimeField(default=datetime.utcnow)

    def save(self, *args, **kwargs):
        
        self.updatedAt = datetime.utcnow()
        return super(Idea, self).save(*args, **kwargs)

    def to_dict(self):
        """Return a dictionary representation for API responses."""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            # "tags": self.tags,
            "priority": self.priority,
            "status": self.status,
            "createdBy": self.createdBy,
            "organization": str(self.organization.id) if self.organization else None,
            "createdAt": self.createdAt.isoformat() if self.createdAt else None,
            "updatedAt": self.updatedAt.isoformat() if self.updatedAt else None,
        }