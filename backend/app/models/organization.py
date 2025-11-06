from app import db
from sqlalchemy.dialects.postgresql import UUID
import uuid

class Organization(db.Model):
    __tablename__ = 'organizations'
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())