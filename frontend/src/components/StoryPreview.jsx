import './StoryPreview.css';

const StoryPreview = ({ formData }) => {
  const { role, goal, description, acceptance_criteria, story_points, business_value } = formData || {};

  const formatAcceptanceCriteria = (criteria) => {
    if (!criteria) return null;
    return criteria.split('\n').filter(line => line.trim()).map((line, index) => (
      <div key={index} className="preview-criteria-line">{line.trim()}</div>
    ));
  };

  const getPriorityLabel = () => {
    // This can be enhanced if priority field is added
    return 'Medium';
  };

  return (
    <div className="story-preview-container">
      <div className="story-preview-header">
        <h2>
          <span className="preview-icon">👁️</span> Live Preview
        </h2>
        <p>See how your user story will appear</p>
      </div>

      <div className="story-preview-card">
        <div className="preview-user-story-section">
          <h3>User Story</h3>
          <div className="preview-user-story-content">
            {role && goal ? (
              <p className="preview-user-story-text">
                As a <strong>{role}</strong>, I want <strong>{goal}</strong>
                {description ? ` so that ${description}` : '.'}
              </p>
            ) : (
              <p className="preview-placeholder">Fill in Role and Goal to see preview</p>
            )}
          </div>
        </div>

        {(acceptance_criteria || story_points || business_value) && (
          <div className="preview-story-details">
            <h4>Story Details</h4>
            
            <div className="preview-details-grid">
              {story_points && (
                <div className="preview-detail-item">
                  <span className="detail-label">Story Points:</span>
                  <span className="detail-value">{story_points}</span>
                </div>
              )}
              
              {business_value && (
                <div className="preview-detail-item">
                  <span className="detail-label">Business Value:</span>
                  <span className="detail-value">{business_value}</span>
                </div>
              )}
              
              <div className="preview-detail-item">
                <span className="detail-label">Priority:</span>
                <span className="detail-tag priority-medium">{getPriorityLabel()}</span>
              </div>
            </div>

            {acceptance_criteria && (
              <div className="preview-section">
                <span className="section-label">Acceptance Criteria:</span>
                <div className="preview-acceptance-criteria">
                  {formatAcceptanceCriteria(acceptance_criteria)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryPreview;

