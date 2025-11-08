# backend/app/routes/ideas.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.models.idea import Idea
from app.models.organization import Organization
from mongoengine.errors import ValidationError, DoesNotExist

ideas_bp = Blueprint("ideas", __name__)

def validate_payload(payload):
    errors = []
    title = payload.get("title", "")
    description = payload.get("description", "")
    # tags = payload.get("tags", [])
    priority = payload.get("priority", "medium")
    org_id = payload.get("organization_id")

    if not isinstance(title, str) or len(title.strip()) < 3:
        errors.append("title must be at least 3 characters")
    if not isinstance(description, str) or len(description.strip()) < 5:
        errors.append("description must be at least 5 characters")
    if priority not in ("low", "medium", "high"):
        errors.append("priority must be one of low|medium|high")
    if not org_id:
        errors.append("organization_id is required")
    return errors

@ideas_bp.route("", methods=["POST"])
@jwt_required()
def create_idea():
    
    user = get_jwt_identity() or {}
    payload = request.get_json() or {}
    
    errors = validate_payload(payload)
    if errors:
        return jsonify({"errors": "errors"}), 400
    
    org_id = payload.get("organization_id")
    org = Organization.objects(id=org_id).first()
    if not org:
        return jsonify({"msg": "organization not found"}), 404

    try:
        idea = Idea(
            title=payload["title"].strip(),
            description=payload["description"].strip(),
            priority=payload.get("priority", "medium"),
            status="new",
            createdBy=user.get("user_id", "anonymous"),
            organization=org
        )
        idea.save()
        return jsonify(idea.to_dict()), 201
    except ValidationError as e:
        return jsonify({"msg": "validation error", "error": str(e)}), 401
    except Exception as e:
        return jsonify({"msg": "failed to create idea", "error": str(e)}), 500

@ideas_bp.route("", methods=["GET"])
@jwt_required()
def list_ideas():
    
    org_id = request.args.get("organization_id")
    try:
        if org_id:
            ideas = Idea.objects(organization=org_id).order_by("-createdAt")
        else:
            ideas = Idea.objects().order_by("-createdAt")
        out = [i.to_dict() for i in ideas]
        return jsonify(out), 200
    except Exception as e:
        return jsonify({"msg": "failed to fetch ideas", "error": str(e)}), 500

@ideas_bp.route("/<idea_id>", methods=["GET"])
@jwt_required()
def get_idea(idea_id):
    try:
        idea = Idea.objects.get(id=idea_id)
        return jsonify(idea.to_dict()), 200
    except DoesNotExist:
        return jsonify({"msg": "not found"}), 403
    except Exception as e:
        return jsonify({"msg": "error", "error": str(e)}), 500
