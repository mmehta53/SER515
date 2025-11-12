# backend/app/routes/ideas.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from datetime import datetime
from app.models.idea import Idea, Comment, Vote
from app.models.user import User
from app.models.organization import Organization
from mongoengine.errors import ValidationError, DoesNotExist

ideas_bp = Blueprint("ideas", __name__)

def validate_create_idea_payload(payload):
    """Validate the payload for creating an idea"""
    errors = []
    title = payload.get("title", "")
    description = payload.get("description", "")
    proj_id = payload.get("projId")
    tags_str = payload.get("tags", "")

    if not isinstance(title, str) or len(title.strip()) < 3:
        errors.append("title must be at least 3 characters")
    if not isinstance(description, str) or len(description.strip()) < 5:
        errors.append("description must be at least 5 characters")
    if not proj_id:
        errors.append("projId is required")
    
    return errors

def parse_tags(tags_str):
    """Parse comma-separated tags string into a list"""
    if not tags_str or not isinstance(tags_str, str):
        return []
    return [tag.strip() for tag in tags_str.split(',') if tag.strip()]

@ideas_bp.route("/", methods=["POST"])
@jwt_required()
def create_idea():
    """Create a new idea
    
    Expected JSON payload:
    {
        "title": "string (min 3 chars)",
        "description": "string (min 5 chars)",
        "projId": "project_id",
        "tags": "comma,separated,tags"  # optional
    }
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        org_id = claims.get('orgId')
        payload = request.get_json() or {}
        
        # Validate payload
        errors = validate_create_idea_payload(payload)
        if errors:
            return jsonify({"errors": errors}), 400
        
        if not org_id:
            return jsonify({
                'error': 'Organization ID not found in token'
            }), 401
        
        # Get organization
        # org = Organization.objects(id=org_id).first()
        # if not org:
        #     return jsonify({"msg": "organization not found"}), 404
        
        # Get user details for createdByName
        user = User.objects(userId=user_id).first()
        created_by_name = f"{user.firstName} {user.lastName}".strip() if user else "Unknown"
        
        # Parse tags from comma-separated string
        tags = parse_tags(payload.get("tags", ""))
        
        # Create idea
        idea = Idea(
            title=payload["title"].strip(),
            description=payload["description"].strip(),
            tags=tags,
            status="new",
            createdBy=user_id,
            createdByName=created_by_name,
            projId=payload["projId"].strip(),
            # organization=org,
            upvotes=0,
            downvotes=0,
            comments=[]
        )
        idea.save()
        
        return jsonify(idea.to_dict()), 201
        
    except ValidationError as e:
        return jsonify({"msg": "validation error", "error": str(e)}), 400
    except Exception as e:
        return jsonify({"msg": "failed to create idea", "error": str(e)}), 500


@ideas_bp.route("/project/<proj_id>", methods=["GET"])
@jwt_required()
def get_ideas_by_project(proj_id):
    """Get all ideas for a specific project
    
    Query parameter:
    - proj_id: Project ID (path parameter)
    """
    try:
        ideas = Idea.objects(projId=proj_id).order_by("-createdAt")
        result = [idea.to_dict() for idea in ideas]
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"msg": "failed to fetch ideas", "error": str(e)}), 500
