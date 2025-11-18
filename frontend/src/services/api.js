const API_BASE_URL = 'http://localhost:5001/api/stories/';

/**
 * API service for user stories CRUD operations
 */
export const storyAPI = {
  /**
   * Get all user stories (backlog) for a project
   */
  getAllStories: async (projectId) => {
    try {
      if (!projectId) {
        throw new Error('projectId is required');
      }
      
      const response = await fetch(`${API_BASE_URL}?projectId=${encodeURIComponent(projectId)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch stories`);
      }
      
      const data = await response.json();
      return data.stories;
    } catch (error) {
      if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Make sure the Flask backend is running on http://localhost:5001');
      }
      throw error;
    }
  },

  /**
   * Get a single user story by ID
   */
  getStory: async (id) => {
    const response = await fetch(`${API_BASE_URL}${id}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch story');
    }
    return data.story;
  },

  /**
   * Create a new user story
   */
  createStory: async (storyData) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create story`);
      }
      
      const data = await response.json();
      return data.story;
    } catch (error) {
      if (error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Make sure the Flask backend is running on http://localhost:5001');
      }
      throw error;
    }
  },

  /**
   * Update an existing user story
   */
  updateStory: async (id, storyData) => {
    const response = await fetch(`${API_BASE_URL}${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storyData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update story');
    }
    return data.story;
  },

  /**
   * Delete a user story
   */
  deleteStory: async (id) => {
    const response = await fetch(`${API_BASE_URL}${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete story');
    }
    return data;
  },
};

