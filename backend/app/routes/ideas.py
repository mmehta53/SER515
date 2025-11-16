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

@ideas_bp.route("/<idea_id>", methods=["GET"])
@jwt_required()
def get_idea(idea_id):
    """Get a specific idea by ID"""
    try:
        idea = Idea.objects.get(ideaId=idea_id)
        return jsonify(idea.to_dict()), 200
    except DoesNotExist:
        return jsonify({"msg": "idea not found"}), 404
    except Exception as e:
        return jsonify({"msg": "error", "error": str(e)}), 500

@ideas_bp.route("/<idea_id>", methods=["PUT"])
@jwt_required()
def update_idea(idea_id):
    """Update an existing idea
    
    Allows updating title, description, tags, and status.
    """
    try:
        user_id = get_jwt_identity()
        payload = request.get_json() or {}
        
        idea = Idea.objects.get(ideaId=idea_id)

        if idea.createdBy != user_id:
            return jsonify({"msg": "unauthorized"}), 403
        
        # Update fields if present in payload
        if "title" in payload:
            title = payload["title"].strip()
            if len(title) < 3:
                return jsonify({"errors": ["title must be at least 3 characters"]}), 400
            idea.title = title
            
        if "description" in payload:
            description = payload["description"].strip()
            if len(description) < 5:
                return jsonify({"errors": ["description must be at least 5 characters"]}), 400
            idea.description = description
            
        if "tags" in payload:
            idea.tags = parse_tags(payload["tags"])
            
        if "status" in payload:
            idea.status = payload["status"]
            
        idea.save()
        
        return jsonify(idea.to_dict()), 200
        
    except DoesNotExist:
        return jsonify({"msg": "idea not found"}), 404
    except ValidationError as e:
        return jsonify({"msg": "validation error", "error": str(e)}), 400
    except Exception as e:
        return jsonify({"msg": "failed to update idea", "error": str(e)}), 500

@ideas_bp.route("/<idea_id>/upvote", methods=["POST"])
@jwt_required()
def upvote_idea(idea_id):
    """Upvote an idea"""
    try:
        user_id = get_jwt_identity()
        idea = Idea.objects.get(ideaId=idea_id)
        
        # Check if user has already voted
        existing_vote = next((v for v in (idea.votes or []) if v.userId == user_id), None)
        
        if existing_vote:
            if existing_vote.voteType == 'upvote':
                return jsonify({"msg": "user has already upvoted this idea"}), 400
            else:
                # Remove downvote and add upvote
                idea.votes.remove(existing_vote)
                idea.downvotes -= 1
        
        # Add upvote
        vote = Vote(userId=user_id, voteType='upvote')
        idea.votes.append(vote)
        idea.upvotes += 1
        idea.save()
        
        return jsonify(idea.to_dict()), 200
        
    except DoesNotExist:
        return jsonify({"msg": "idea not found"}), 404
    except Exception as e:
        return jsonify({"msg": "error", "error": str(e)}), 500


@ideas_bp.route("/<idea_id>/downvote", methods=["POST"])
@jwt_required()
def downvote_idea(idea_id):
    """Downvote an idea"""
    try:
        user_id = get_jwt_identity()
        idea = Idea.objects.get(ideaId=idea_id)
        
        # Check if user has already voted
        existing_vote = next((v for v in (idea.votes or []) if v.userId == user_id), None)
        
        if existing_vote:
            if existing_vote.voteType == 'downvote':
                return jsonify({"msg": "user has already downvoted this idea"}), 400
            else:
                # Remove upvote and add downvote
                idea.votes.remove(existing_vote)
                idea.upvotes -= 1
        
        # Add downvote
        vote = Vote(userId=user_id, voteType='downvote')
        idea.votes.append(vote)
        idea.downvotes += 1
        idea.save()
        
        return jsonify(idea.to_dict()), 200
        
    except DoesNotExist:
        return jsonify({"msg": "idea not found"}), 404
    except Exception as e:
        return jsonify({"msg": "error", "error": str(e)}), 500


@ideas_bp.route("/<idea_id>/comment", methods=["POST"])
@jwt_required()
def add_comment(idea_id):
    """Add a comment to an idea
    
    Expected JSON payload:
    {
        "text": "comment text"
    }
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        payload = request.get_json() or {}
        
        if not payload.get("text"):
            return jsonify({"msg": "comment text is required"}), 400
        
        idea = Idea.objects.get(ideaId=idea_id)
        
        # Get user name
        user = User.objects(userId=user_id).first()
        user_name = f"{user.firstName} {user.lastName}".strip() if user else "Unknown"
        
        # Create comment
        comment = Comment(
            userId=user_id,
            userName=user_name,
            text=payload["text"].strip()
        )
        
        if not idea.comments:
            idea.comments = []
        
        idea.comments.append(comment)
        idea.save()
        
        return jsonify(idea.to_dict()), 200
        
    except DoesNotExist:
        return jsonify({"msg": "idea not found"}), 404
    except Exception as e:
        return jsonify({"msg": "error", "error": str(e)}), 500