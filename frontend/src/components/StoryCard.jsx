import './StoryCard.css';

const StoryCard = ({ story, onEdit, onDelete }) => {
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
    <div className="story-card">
      <div className="story-card-header">
        <div className="story-id">Story #{story.id}</div>
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
            onClick={() => onDelete(story.id)}
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

      <div className="story-card-footer">
        <span className="story-date">Created: {formatDate(story.created_at)}</span>
        {story.updated_at !== story.created_at && (
          <span className="story-date">Updated: {formatDate(story.updated_at)}</span>
        )}
      </div>
    </div>
  );
};

export default StoryCard;

