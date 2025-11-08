# app/models/organization.py
import uuid
from datetime import datetime
from mongoengine import Document, StringField, DateTimeField

class Organization(Document):
    meta = {'collection': 'organizations'}
    id = StringField(primary_key=True, default=lambda: str(uuid.uuid4()))
    name = StringField(required=True, max_length=255)
    description = StringField()
    createdAt = DateTimeField(default=datetime.utcnow)