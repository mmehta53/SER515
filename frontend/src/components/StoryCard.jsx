import { useState } from 'react';
import './StoryCard.css';

const StoryCard = ({ story, onEdit, onDelete, onShowIdea, onAddComment, ...props }) => {
  const [showComments, setShowComments] = useState(false);
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div
      data-storyid={story.storyId}
      className={`story-card ${showComments ? 'comments-visible' : ''} ${props.isDragging ? 'dragging' : ''} ${props.isHighlighted ? 'highlighted' : ''}`}
      draggable={props.draggable}
      onDragStart={props.onDragStart}
      onDragEnd={props.onDragEnd}>
      <div className="story-card-header">
        <div className="story-id">Story #{story.storyId || story.id}</div>
        <div className="story-actions">
          <button 
            className="btn-icon" 
            onClick={() => onEdit(story)}
            title="Edit story"
            aria-label="Edit story"
          >
            ✏️
          </button>
          <button 
            className="btn-icon btn-danger" 
            onClick={() => onDelete(story.storyId || story.id)}
            title="Delete story"
            aria-label="Delete story"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="story-content">
        <div className="story-role-goal">
          <div className="story-role">{story.role}</div>
          <div className="story-goal">{story.goal}</div>
        </div>

        {story.description && (
          <div className="story-description">
            <strong>Description:</strong>
            <p>{story.description}</p>
          </div>
        )}

        <div className="story-acceptance">
          <strong>Acceptance Criteria:</strong>
          <div className="acceptance-text">
            {story.acceptance_criteria.split('\n').map((line, idx) => (
              <div key={idx}>{line || <br />}</div>
            ))}
          </div>
        </div>

        <div className="story-metrics">
          {story.story_points !== null && story.story_points !== undefined && (
            <div className="metric">
              <span className="metric-label">Story Points:</span>
              <span className="metric-value">{story.story_points}</span>
            </div>
          )}
          {story.business_value !== null && story.business_value !== undefined && (
            <div className="metric">
              <span className="metric-label">Business Value:</span>
              <span className="metric-value">{story.business_value}</span>
            </div>
          )}
        </div>
      </div>

      <div className="story-comment-section">
        <button className="comment-toggle-btn" onClick={() => setShowComments(!showComments)}>
          💬 Comments ({story.comments?.length || 0})
        </button>
        {showComments && (
          <div className="comments-area">
            <div className="comments-list">
              {(story.comments || []).length > 0 ? (
                story.comments.map((c, idx) => (
                  <div key={c.commentId || idx} className="comment-item">
                    <div className="comment-header">
                      <strong className="comment-author">{c.userName || 'Anon'}</strong>
                      <span className="comment-date">{formatDate(c.created_at)}</span>
                    </div>
                    <p className="comment-text">{c.text}</p>
                  </div>
                ))
              ) : (
                <div className="no-comments">No comments yet.</div>
              )}
            </div>
            <form className="comment-form" onSubmit={(e) => { e.preventDefault(); onAddComment(story.storyId, e.target.elements.commentText.value); e.target.reset(); }}>
              <textarea name="commentText" placeholder="Add a comment..." required rows="2"></textarea>
              <button type="submit">Post</button>
            </form>
          </div>
        )}
      </div>

      <div className="story-card-footer">
        <span className="story-date">Created: {formatDate(story.created_at)}</span>
        {story.updated_at !== story.created_at && (
          <span className="story-date">Updated: {formatDate(story.updated_at)}</span>
        )}
        {story.ideaId && (
          <button 
            className="story-idea-link" 
            onClick={() => onShowIdea(story.ideaId)}
            title="Go to original idea"
          >
            🔗 From Idea
          </button>
        )}
      </div>
    </div>
  );
};

export default StoryCard;
