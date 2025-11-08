from datetime import datetime
import uuid
from mongoengine import Document, StringField, DateTimeField, IntField

class Project(Document):
    meta = {
        'collection': 'projects',
        'strict': False
    }
    
    name = StringField(required=True)
    description = StringField(required=True)
    status = StringField(default='active')
    projId = StringField(required=True, default=lambda: str(uuid.uuid4()))
    orgId = StringField(required=True)
    createdAt = DateTimeField(default=datetime.utcnow)
    progress = IntField(default=0)
    totalStories = IntField(default=0)
    readyStories = IntField(default=0)

    @classmethod
    def get_projects_by_org_id(cls, org_id):
        return cls.objects(orgId=org_id)