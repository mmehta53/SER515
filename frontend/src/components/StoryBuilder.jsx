import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { storyAPI } from '../services/api';
import StoryForm from './StoryForm';
import StoryPreview from './StoryPreview';
import './StoryList.css';

const StoryBuilder = ({ onNavigate, idea }) => {
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    goal: '',
    description: '',
    acceptance_criteria: '',
    story_points: '',
    business_value: '',
  });

  useEffect(() => {
    // Get projectId from cookies
    const projId = Cookies.get('projectId');
    if (projId) {
      setProjectId(projId);
    } else {
      setError('No project selected. Please select a project first.');
    }
    setLoading(false);

    if (idea) {
      setFormData({
        role: '', // Role needs to be filled by the user
        goal: idea.title || '',
        description: idea.description || '',
        acceptance_criteria: '', // To be filled by the user
        story_points: '',
        business_value: '',
      });
    }
  }, [idea]);

  const handleCreate = async (storyData) => {
    if (!projectId) {
      setError('No project ID available');
      return;
    }
    
    try {
      // Add projectId to story data
      const storyWithProject = { ...storyData, projectId, ideaId: idea?.ideaId };
      await storyAPI.createStory(storyWithProject);
      
      // Reset form after successful creation
      setFormData({
        role: '',
        goal: '',
        description: '',
        acceptance_criteria: '',
        story_points: '',
        business_value: '',
      });
      
      setShowSuccessPopup(true);
    } catch (err) {
      setError(err.message || 'Failed to create story');
      alert(`Error: ${err.message}`);
    }
  };

  const handleCancel = () => {
    setFormData({
      role: '',
      goal: '',
      description: '',
      acceptance_criteria: '',
      story_points: '',
      business_value: '',
    });
  };

  const handleFormDataChange = (data) => {
    setFormData(data);
  };

  const handleClosePopup = () => {
    setShowSuccessPopup(false);
    onNavigate('backlog');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!projectId) {
    return (
      <div className="story-list-container">
        <div className="error-banner">
          <span>⚠️ {error || 'No project selected. Please select a project first.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="story-list-container">

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="form-preview-layout">
        <div className="form-section">
          <StoryForm
            storyData={formData}
            onSubmit={handleCreate}
            onCancel={handleCancel}
            onFormDataChange={handleFormDataChange}
          />
        </div>
        <div className="preview-section">
          <StoryPreview formData={formData} />
        </div>
      </div>

      {showSuccessPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Success!</h2>
            <p>User story created successfully.</p>
            <p>You will now be redirected to the backlog.</p>
            <button onClick={handleClosePopup} className="btn-primary">OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryBuilder;
