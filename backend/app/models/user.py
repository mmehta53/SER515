# app/models/user.py
import uuid
from datetime import datetime
from mongoengine import Document, StringField, BooleanField, DateTimeField
from werkzeug.security import generate_password_hash, check_password_hash

class User(Document):
    meta = {
        'collection': 'users',
        'strict': False 
    }
    userId = StringField(required=True)
    email = StringField(required=True)
    passwordHash = StringField(required=True)
    firstName = StringField()
    lastName = StringField()
    role = StringField(required=True)
    isActive = BooleanField(default=True)
    lastLogin = DateTimeField()
    orgId = StringField(required=True)
    createdAt = DateTimeField()

    def set_password(self, password):
        self.passwordHash = generate_password_hash(password)

    def check_password(self, password):
        print(f"Checking password for user: {self.email}")
        print(f"Stored hash exists: {bool(self.passwordHash)}")
        result = check_password_hash(self.passwordHash, password)
        print(f"Password check result: {result}")
        return result

    @classmethod
    def print_user_debug(cls, email):
        user = cls.objects(email=email).first()
        if user:
            print(f"Found user with email: {email}")
            print(f"User ID: {user.userId}")
            print(f"Has password hash: {bool(user.passwordHash)}")
            print(f"Is active: {user.isActive}")
            print(f"Role: {user.role}")
        else:
            print(f"No user found with email: {email}")