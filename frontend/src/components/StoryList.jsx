import { useState, useEffect } from 'react';
import { storyAPI } from '../services/api';
import StoryCard from './StoryCard';
import StoryForm from './StoryForm';
import StoryPreview from './StoryPreview';
import './StoryList.css';

const StoryList = () => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [formData, setFormData] = useState({
    role: '',
    goal: '',
    description: '',
    acceptance_criteria: '',
    story_points: '',
    business_value: '',
  });

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await storyAPI.getAllStories();
      setStories(data);
    } catch (err) {
      setError(err.message || 'Failed to load stories');
      console.error('Error loading stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (storyData) => {
    try {
      await storyAPI.createStory(storyData);
      setShowForm(false);
      setFormData({
        role: '',
        goal: '',
        description: '',
        acceptance_criteria: '',
        story_points: '',
        business_value: '',
      });
      loadStories();
    } catch (err) {
      setError(err.message || 'Failed to create story');
      alert(`Error: ${err.message}`);
    }
  };

  const handleUpdate = async (storyData) => {
    try {
      await storyAPI.updateStory(editingStory.id, storyData);
      setEditingStory(null);
      setShowForm(false);
      setFormData({
        role: '',
        goal: '',
        description: '',
        acceptance_criteria: '',
        story_points: '',
        business_value: '',
      });
      loadStories();
    } catch (err) {
      setError(err.message || 'Failed to update story');
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this user story?')) {
      return;
    }

    try {
      await storyAPI.deleteStory(storyId);
      loadStories();
    } catch (err) {
      setError(err.message || 'Failed to delete story');
      alert(`Error: ${err.message}`);
    }
  };

  const handleEdit = (story) => {
    setEditingStory(story);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStory(null);
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

  if (showForm) {
    return (
      <div className="story-list-container">
        <div className="form-preview-layout">
          <div className="form-section">
            <StoryForm
              story={editingStory}
              onSubmit={editingStory ? handleUpdate : handleCreate}
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
  }

  return (
    <div className="story-list-container">
      <div className="story-list-header">
        <h1>User Stories Backlog</h1>
        <button 
          className="btn-primary btn-large"
          onClick={() => setShowForm(true)}
        >
          + Create New Story
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading stories...</div>
      ) : stories.length === 0 ? (
        <div className="empty-state">
          <h2>No user stories yet</h2>
          <p>Create your first user story to get started!</p>
          <button 
            className="btn-primary"
            onClick={() => setShowForm(true)}
          >
            Create Your First Story
          </button>
        </div>
      ) : (
        <div className="stories-grid">
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StoryList;

