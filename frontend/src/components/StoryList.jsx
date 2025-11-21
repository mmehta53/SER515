import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { storyAPI } from '../services/api';
import StoryCard from './StoryCard';
import StoryForm from './StoryForm';
import StoryPreview from './StoryPreview';
import './StoryList.css';

const StoryList = ({ onShowIdea }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStory, setEditingStory] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
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
      loadStories(projId);
    } else {
      setError('No project selected. Please select a project first.');
      setLoading(false);
    }
  }, []);

  const loadStories = async (projId) => {
    if (!projId) {
      setError('No project ID available');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await storyAPI.getAllStories(projId);
      setStories(data);
    } catch (err) {
      setError(err.message || 'Failed to load stories');
      console.error('Error loading stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (storyData) => {
    if (!projectId) {
      setError('No project ID available');
      return;
    }
    
    try {
      // Add projectId to story data
      const storyWithProject = { ...storyData, projectId };
      await storyAPI.createStory(storyWithProject);
      setShowForm(false);
      setFormData({
        role: '',
        goal: '',
        description: '',
        acceptance_criteria: '',
        story_points: '',
        business_value: '',
      });
      loadStories(projectId);
    } catch (err) {
      setError(err.message || 'Failed to create story');
      alert(`Error: ${err.message}`);
    }
  };

  const handleUpdate = async (storyData) => {
    if (!projectId) {
      setError('No project ID available');
      return;
    }
    
    try {
      // Preserve projectId when updating
      const storyWithProject = { ...storyData, projectId };
      await storyAPI.updateStory(editingStory.storyId || editingStory.id, storyWithProject);
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
      loadStories(projectId);
    } catch (err) {
      setError(err.message || 'Failed to update story');
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddComment = async (storyId, text) => {
    if (!text || !text.trim()) return;

    try {
      const updatedStory = await storyAPI.addComment(storyId, text);
      setStories(prevStories =>
        prevStories.map(story =>
          (story.storyId || story.id) === storyId ? updatedStory : story
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to add comment');
      console.error('Error adding comment:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const confirmDelete = async () => {
    if (!storyToDelete) return;
    try {
      await storyAPI.deleteStory(storyToDelete);
      loadStories(projectId);
    } catch (err) {
      setError(err.message || 'Failed to delete story');
    } finally {
      setShowDeleteConfirm(false);
      setStoryToDelete(null);
    }
  };

  const handleDelete = (storyId) => {
    setStoryToDelete(storyId);
    setShowDeleteConfirm(true);
  };

  const handleEdit = (story) => {
    setEditingStory(story);
    // Pre-fill the form data with the story being edited
    setFormData({
      id: story.storyId || story.id, // Keep track of id for update
      role: story.role || '',
      goal: story.goal || '',
      description: story.description || '',
      acceptance_criteria: story.acceptance_criteria || '',
      story_points: story.story_points || '',
      business_value: story.business_value || '',
    });
    setShowForm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setStoryToDelete(null);
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
              storyData={formData}
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
          <p>Go to Story Builder to create your first user story!</p>
        </div>
      ) : (
        <div className="stories-grid">
          {stories.map((story) => (
            <StoryCard
            key={story.storyId || story.id}
              story={story}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShowIdea={onShowIdea}
              onAddComment={handleAddComment}
            />
          ))}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete this user story? This action cannot be undone.</p>
            <div className="popup-actions">
              <button onClick={confirmDelete} className="btn-danger">
                Delete
              </button>
              <button onClick={cancelDelete} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryList;
