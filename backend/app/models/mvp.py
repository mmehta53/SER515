import uuid
from datetime import datetime
from mongoengine import Document, StringField, DateTimeField, ListField

class Mvp(Document):
    meta = {'collection': 'mvps'}

    mvpId = StringField(required=True, unique=True, default=lambda: str(uuid.uuid4()))
    name = StringField(required=True)
    description = StringField()
    targetReleaseDate = DateTimeField()
    projectId = StringField(required=True)
    storyIds = ListField(StringField())
    createdAt = DateTimeField(default=datetime.utcnow)
    updatedAt = DateTimeField(default=datetime.utcnow)

    def save(self, *args, **kwargs):
        """On save, update timestamps"""
        if not self.createdAt:
            self.createdAt = datetime.utcnow()
        self.updatedAt = datetime.utcnow()
        return super(Mvp, self).save(*args, **kwargs)

    def to_dict(self):
        """Return a dictionary representation for API responses."""
        return {
            "mvpId": self.mvpId,
            "name": self.name,
            "description": self.description,
            "targetReleaseDate": self.targetReleaseDate.isoformat() if self.targetReleaseDate else None,
            "projectId": self.projectId,
            "storyIds": self.storyIds,
            "createdAt": self.createdAt.isoformat() if self.createdAt else None,
            "updatedAt": self.updatedAt.isoformat() if self.updatedAt else None,
        }

    def __repr__(self):
        return f"<Mvp {self.name}>"