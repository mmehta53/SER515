#!/usr/bin/env python3
"""
Create one organization and an admin user.

This script creates a default organization (if missing) and an admin user
with password "123456". The password is hashed using the project's
`User.set_password` (which calls `werkzeug.security.generate_password_hash`).

Run with:
    python backend/scripts/create_admin.py

Note: `MONGO_URI` environment variable must be set (same as when running the app).
"""
import uuid
from datetime import datetime
from app import create_app
from app.models.organization import Organization
from app.models.user import User


def main():
    app = create_app()
    with app.app_context():
        org_name = "organization"
        org_desc = "Automatically created organization by script"

        # Create organization if it doesn't exist
        org = Organization.objects(name=org_name).first()
        if org:
            print(f"Organization already exists: {org.id} - {org.name}")
        else:
            org = Organization(
                name=org_name,
                description=org_desc,
                isActive=True,
                createdAt=datetime.utcnow()
            )
            org.save()
            print(f"Created organization: {org.id} - {org.name}")

        # Choose an admin-related email based on organization name
        safe_name = org.name.replace(' ', '').lower()
        admin_email = f"admin@{safe_name}.com"

        # Avoid creating duplicate users
        existing_user = User.objects(email=admin_email).first()
        if existing_user:
            print(f"Admin user already exists: {existing_user.userId} - {existing_user.email}")
            return

        # Create admin user
        admin_user = User(
            userId=str(uuid.uuid4()),
            email=admin_email,
            firstName="Admin",
            lastName="User",
            role="admin",
            isActive=True,
            orgId=str(org.id),
            createdAt=datetime.utcnow()
        )
        # Use the model helper which uses the same hashing as the app
        admin_user.set_password("123456")
        admin_user.save()

        print(f"Created admin user: {admin_user.userId} - {admin_user.email}")
        print("Password is set to '123456' (stored hashed in DB).")


if __name__ == '__main__':
    main()
