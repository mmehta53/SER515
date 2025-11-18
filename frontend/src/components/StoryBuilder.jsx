import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { storyAPI } from '../services/api';
import StoryForm from './StoryForm';
import StoryPreview from './StoryPreview';
import './StoryList.css';

const StoryBuilder = () => {
  const [projectId, setProjectId] = useState(null);
  const [error, setError] = useState(null);
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
  }, []);

  const handleCreate = async (storyData) => {
    if (!projectId) {
      setError('No project ID available');
      return;
    }
    
    try {
      // Add projectId to story data
      const storyWithProject = { ...storyData, projectId };
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
      
      alert('Story created successfully! Check the Backlog section to view it.');
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
      <div className="story-list-header">
        <h1>Create User Story</h1>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="form-preview-layout">
        <div className="form-section">
          <StoryForm
            story={null}
            onSubmit={handleCreate}
            onCancel={handleCancel}
            onFormDataChange={handleFormDataChange}
          />
        </div>
        <div className="preview-section">
          <StoryPreview formData={formData} />
        </div>
      </div>
    </div>
  );
};

export default StoryBuilder;

