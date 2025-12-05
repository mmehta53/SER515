from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from mongoengine.connection import get_db
from mongoengine.errors import DoesNotExist, ValidationError
from datetime import datetime
import uuid
from app.models.mvp import Mvp
import io
import csv
from io import BytesIO
from bson import ObjectId

def convert_objectid_to_str(doc):
    """Convert MongoDB ObjectId to string in document"""
    if doc and '_id' in doc:
        doc['_id'] = str(doc['_id'])
    return doc

mvps_bp = Blueprint('mvps', __name__)


# role helpers
def get_current_role():
    claims = get_jwt() or {}
    return claims.get('role')

def require_chicken():
    """Return True if current user is a chicken role, False otherwise"""
    return get_current_role() == 'chicken'

#post API to create MVP
@mvps_bp.route('/', methods=['POST'])
@jwt_required()
def create_mvp():
    """Create a new MVP for a project"""
    data = request.get_json()
    try:
        # only chickens can create MVPs
        if not require_chicken():
            return jsonify({'success': False, 'error': 'Only chicken role may create MVPs'}), 403
        target_date = None
        if data.get('targetReleaseDate'):
            # Convert string 'YYYY-MM-DD' to datetime object
            target_date = datetime.strptime(data['targetReleaseDate'], '%Y-%m-%d')

        new_mvp = Mvp(
            name=data['name'],
            projectId=data['projectId'],
            description=data.get('description', ''),
            targetReleaseDate=target_date
        )
        new_mvp.save()
        return jsonify({'success': True, 'mvp': new_mvp.to_dict()}), 201
    except ValidationError as e:
        return jsonify({'success': False, 'error': str(e)}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f'An error occurred: {str(e)}'}), 500

@mvps_bp.route('/', methods=['GET'])
@jwt_required()
def get_mvps_for_project():
    """Get all MVPs for a given project"""
    project_id = request.args.get('projectId')
    if not project_id:
        return jsonify({'success': False, 'error': 'projectId is required'}), 400
    
    mvps = Mvp.objects(projectId=project_id)
    db = get_db()
    
    results = []
    for mvp in mvps:
        mvp_dict = mvp.to_dict()
        
        # Fetch full story details for stories in this MVP
        story_ids = mvp_dict.get('storyIds', [])
        if story_ids:
            stories_cursor = db.stories.find({'storyId': {'$in': story_ids}})
            stories_list = [convert_objectid_to_str(story) for story in stories_cursor]
            mvp_dict['stories'] = stories_list
        else:
            mvp_dict['stories'] = []
        results.append(mvp_dict)
        
    return jsonify({'success': True, 'mvps': results}), 200

@mvps_bp.route('/<mvp_id>', methods=['PUT'])
@jwt_required()
def update_mvp(mvp_id):
    """Update an MVP's details"""
    data = request.get_json()
    db = get_db()
    try:
        # only chickens can update MVPs
        if not require_chicken():
            return jsonify({'success': False, 'error': 'Only chicken role may update MVPs'}), 403
        mvp = Mvp.objects.get(mvpId=mvp_id)
        if 'name' in data:
            mvp.name = data['name']
        if 'description' in data:
            mvp.description = data['description']
        if 'targetReleaseDate' in data:
            # Convert string 'YYYY-MM-DD' to datetime object, or None if empty
            target_date_str = data.get('targetReleaseDate')
            mvp.targetReleaseDate = datetime.strptime(target_date_str, '%Y-%m-%d') if target_date_str else None
        
        mvp.save()
        return jsonify({'success': True, 'mvp': mvp.to_dict()}), 200
    except DoesNotExist:
        return jsonify({'success': False, 'error': 'MVP not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': f'An error occurred: {str(e)}'}), 500

@mvps_bp.route('/<mvp_id>', methods=['DELETE'])
@jwt_required()
def delete_mvp(mvp_id):
    """Delete an MVP"""
    db = get_db()
    # Only chickens can delete MVPs
    if not require_chicken():
        return jsonify({'success': False, 'error': 'Only chicken role may delete MVPs'}), 403

    # Unset mvpId and mvpStatus from all stories associated with this MVP
    db.stories.update_many({'mvpId': mvp_id}, {'$unset': {'mvpId': '', 'mvpStatus': ''}})

    try:
        mvp = Mvp.objects.get(mvpId=mvp_id)
        mvp.delete()
        return jsonify({'success': True, 'message': 'MVP deleted successfully'}), 200
    except DoesNotExist:
        return jsonify({'success': False, 'error': 'MVP not found'}), 404
    
@mvps_bp.route('/<mvp_id>/stories', methods=['POST'])
@jwt_required()
def assign_story_to_mvp(mvp_id):
    """Assign a story to an MVP"""
    data = request.get_json()
    story_id = data.get('storyId')
    if not story_id:
        return jsonify({'success': False, 'error': 'storyId is required'}), 400

    db = get_db()
    try:
        # Only pig or chicken can add stories to an MVP
        claims_role = get_current_role()
        if claims_role not in ['pig', 'chicken']:
            return jsonify({'success': False, 'error': 'Only pig or chicken role may add stories to an MVP'}), 403

        # Validate optional mvpStatus
        mvp_status = data.get('mvpStatus')
        if mvp_status:
            if mvp_status not in ['must-have', 'nice-to-have']:
                return jsonify({'success': False, 'error': 'Invalid mvpStatus. Must be must-have or nice-to-have'}), 400
            # Only chickens are allowed to set the mvpStatus
            if claims_role != 'chicken':
                return jsonify({'success': False, 'error': 'Only chicken role may set MVP-specific story status'}), 403

        # Add story to MVP's list
        Mvp.objects(mvpId=mvp_id).update_one(add_to_set__storyIds=story_id)

        # Set mvpId and optionally mvpStatus on the story
        update_fields = {'mvpId': mvp_id}
        if mvp_status:
            update_fields['mvpStatus'] = mvp_status

        db.stories.update_one({'storyId': story_id}, {'$set': update_fields})

        return jsonify({'success': True, 'message': 'Story assigned to MVP'}), 200
    except DoesNotExist:
        return jsonify({'success': False, 'error': 'MVP not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': f'An error occurred: {str(e)}'}), 500

@mvps_bp.route('/<mvp_id>/stories/<story_id>', methods=['DELETE'])
@jwt_required()
def remove_story_from_mvp(mvp_id, story_id):
    """Remove a story from an MVP"""
    db = get_db()
    # Only chickens may remove stories from an MVP
    if not require_chicken():
        return jsonify({'success': False, 'error': 'Only chicken role may remove stories from an MVP'}), 403

    # Remove story from MVP's list
    try:
        Mvp.objects(mvpId=mvp_id).update_one(pull__storyIds=story_id)

        # Unset mvpId and mvpStatus on the story
        db.stories.update_one({'storyId': story_id}, {'$unset': {'mvpId': '', 'mvpStatus': ''}})

        return jsonify({'success': True, 'message': 'Story removed from MVP'}), 200
    except DoesNotExist:
        return jsonify({'success': False, 'error': 'MVP not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'error': f'An error occurred: {str(e)}'}), 500


@mvps_bp.route('/<mvp_id>/stories/<story_id>', methods=['PUT'])
@jwt_required()
def update_mvp_story_status(mvp_id, story_id):
    """Allow chicken to set or change the mvpStatus for a story already assigned to an MVP.

    The request body should include {'mvpStatus': 'must-have'|'nice-to-have'|null}
    Only role 'chicken' is allowed to set or change this. If mvpStatus is null/empty it will be removed.
    """
    data = request.get_json() or {}
    mvp_status = data.get('mvpStatus')

    # Only chickens may set/change mvpStatus
    if not require_chicken():
        return jsonify({'success': False, 'error': 'Only chicken role may set MVP-specific story status'}), 403

    # Validate mvp_status if provided
    if mvp_status is not None and mvp_status not in ['must-have', 'nice-to-have', '']:
        return jsonify({'success': False, 'error': 'Invalid mvpStatus. Must be must-have or nice-to-have or empty to unset'}), 400

    db = get_db()
    # Ensure story exists and is currently assigned to this mvp
    story = db.stories.find_one({'storyId': story_id})
    if not story:
        return jsonify({'success': False, 'error': 'Story not found'}), 404

    if story.get('mvpId') != mvp_id:
        return jsonify({'success': False, 'error': 'Story is not assigned to the given MVP'}), 400

    try:
        if mvp_status:
            db.stories.update_one({'storyId': story_id}, {'$set': {'mvpStatus': mvp_status}})
        else:
            db.stories.update_one({'storyId': story_id}, {'$unset': {'mvpStatus': ''}})

        updated = db.stories.find_one({'storyId': story_id})
        convert_objectid_to_str(updated)
        return jsonify({'success': True, 'story': updated}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': f'An error occurred: {str(e)}'}), 500

@mvps_bp.route('/available-stories', methods=['GET'])
@jwt_required()
def get_available_stories():
    """
    Get stories that are 'groomed' and not yet assigned to an MVP for a project.
    """
    project_id = request.args.get('projectId')
    if not project_id:
        return jsonify({'success': False, 'error': 'projectId is required'}), 400

    db = get_db()
    query = {
        'projectId': project_id,
        'status': 'groomed',
        'mvpId': {'$exists': False}
    }
    stories = list(db.stories.find(query))

    for story in stories:
        convert_objectid_to_str(story)
        if 'created_at' in story and isinstance(story['created_at'], datetime):
            story['created_at'] = story['created_at'].isoformat()
        if 'updated_at' in story and isinstance(story['updated_at'], datetime):
            story['updated_at'] = story['updated_at'].isoformat()

    return jsonify({'success': True, 'stories': stories}), 200


@mvps_bp.route('/<mvp_id>/export', methods=['GET'])
@jwt_required()
def export_mvp(mvp_id):
    """Export a single MVP's details as CSV or PDF.

    Query params:
      - format: 'csv' (default) or 'pdf'
    Returns file attachment.
    """
    fmt = (request.args.get('format') or 'csv').lower()

    # Fetch MVP
    try:
        mvp = Mvp.objects.get(mvpId=mvp_id)
    except Exception:
        return jsonify({'success': False, 'error': 'MVP not found'}), 404

    mvp_dict = mvp.to_dict()

    # Fetch stories for this MVP
    db = get_db()
    story_ids = mvp_dict.get('storyIds') or []
    stories = []
    if story_ids:
        cursor = db.stories.find({'storyId': {'$in': story_ids}})
        for s in cursor:
            # convert objectid and datetimes
            if '_id' in s:
                s['_id'] = str(s['_1d']) if s.get('_1d') else str(s.get('_id'))
            if 'created_at' in s and isinstance(s['created_at'], datetime):
                s['created_at'] = s['created_at'].isoformat()
            if 'updated_at' in s and isinstance(s['updated_at'], datetime):
                s['updated_at'] = s['updated_at'].isoformat()
            stories.append(s)

    filename_base = f"mvp-{mvp_dict.get('name','') or mvp_id}".replace(' ', '_')

    if fmt == 'csv':
        # Create CSV in-memory
        output = io.StringIO()
        writer = csv.writer(output)

        # MVP meta
        writer.writerow(['MVP Field', 'Value'])
        writer.writerow(['mvpId', mvp_dict.get('mvpId')])
        writer.writerow(['name', mvp_dict.get('name')])
        writer.writerow(['description', mvp_dict.get('description') or ''])
        writer.writerow(['targetReleaseDate', mvp_dict.get('targetReleaseDate') or ''])
        writer.writerow(['projectId', mvp_dict.get('projectId') or ''])
        writer.writerow(['createdAt', mvp_dict.get('createdAt') or ''])
        writer.writerow(['updatedAt', mvp_dict.get('updatedAt') or ''])
        writer.writerow([])

        # Stories table
        writer.writerow(['Stories'])
        header = ['storyId', 'role', 'goal', 'description', 'acceptance_criteria', 'story_points', 'business_value', 'status', 'mvpStatus']
        writer.writerow(header)
        for s in stories:
            row = [s.get('storyId'), s.get('role'), s.get('goal'), s.get('description'), s.get('acceptance_criteria'), s.get('story_points'), s.get('business_value'), s.get('status'), s.get('mvpStatus')]
            writer.writerow([str(x) if x is not None else '' for x in row])

        csv_bytes = output.getvalue().encode('utf-8')
        buf = BytesIO(csv_bytes)
        buf.seek(0)
        return send_file(buf, as_attachment=True, download_name=f"{filename_base}.csv", mimetype='text/csv')

    elif fmt == 'pdf':
        # Generate simple PDF using reportlab
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib import colors
            from reportlab.lib.styles import getSampleStyleSheet
        except Exception:
            return jsonify({'success': False, 'error': 'PDF generation not available (reportlab not installed)'}), 500

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()
        elements = []

        # Title
        elements.append(Paragraph(f"MVP: {mvp_dict.get('name','')}", styles['Title']))
        elements.append(Spacer(1, 12))

        # MVP metadata
        meta_data = [
            ['Field', 'Value'],
            ['mvpId', mvp_dict.get('mvpId')],
            ['name', mvp_dict.get('name')],
            ['description', mvp_dict.get('description') or ''],
            ['targetReleaseDate', mvp_dict.get('targetReleaseDate') or ''],
            ['projectId', mvp_dict.get('projectId') or ''],
            ['createdAt', mvp_dict.get('createdAt') or ''],
            ['updatedAt', mvp_dict.get('updatedAt') or '']
        ]
        t = Table(meta_data, hAlign='LEFT', colWidths=[120, 360])
        t.setStyle(TableStyle([('BACKGROUND', (0,0), (-1,0), colors.lightgrey), ('GRID', (0,0), (-1,-1), 0.25, colors.grey)]))
        elements.append(t)
        elements.append(Spacer(1, 12))

        # Stories table
        if stories:
            story_header = [
                Paragraph('ID', styles['Normal']),
                Paragraph('Role', styles['Normal']),
                Paragraph('Goal', styles['Normal']),
                Paragraph('Points', styles['Normal']),
                Paragraph('Value', styles['Normal']),
                Paragraph('Status', styles['Normal']),
                Paragraph('MVP Status', styles['Normal'])
            ]
            data_table = [story_header]
            for s in stories:
                data_table.append([
                    Paragraph(s.get('storyId', ''), styles['Normal']),
                    Paragraph(s.get('role', ''), styles['Normal']),
                    Paragraph(s.get('goal', ''), styles['Normal']),
                    Paragraph(str(s.get('story_points', '')), styles['Normal']),
                    Paragraph(str(s.get('business_value', '')), styles['Normal']),
                    Paragraph(s.get('status', ''), styles['Normal']),
                    Paragraph(s.get('mvpStatus', ''), styles['Normal'])
                ])

            tbl = Table(data_table, hAlign='LEFT', colWidths=[60, 60, 180, 40, 40, 60, 60])
            tbl.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
                ('GRID', (0,0), (-1,-1), 0.25, colors.grey),
                ('FONTSIZE', (0,0), (-1,-1), 9),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ]))
            elements.append(tbl)

        doc.build(elements)
        buffer.seek(0)
        return send_file(buffer, as_attachment=True, download_name=f"{filename_base}.pdf", mimetype='application/pdf')

    else:
        return jsonify({'success': False, 'error': 'Invalid format. Use csv or pdf'}), 400