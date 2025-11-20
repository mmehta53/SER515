import { useState, useEffect } from 'react';
import './StoryForm.css';

const StoryForm = ({ storyData, onSubmit, onCancel, onFormDataChange }) => {
  const [errors, setErrors] = useState({});

  // When the form is for editing, clear any previous validation errors.
  useEffect(() => {
    setErrors({});
  }, [storyData.role, storyData.goal]); // Reset errors if the core story changes

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Notify parent of data changes for live preview
    if (onFormDataChange) {
      onFormDataChange({
        ...storyData,
        [name]: value,
      });
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!storyData.role.trim()) {
      newErrors.role = 'Role is required';
    }
    if (!storyData.goal.trim()) {
      newErrors.goal = 'Goal is required';
    }
    if (!storyData.acceptance_criteria.trim()) {
      newErrors.acceptance_criteria = 'Acceptance criteria is required';
    }
    if (storyData.story_points && (isNaN(storyData.story_points) || storyData.story_points < 0)) {
      newErrors.story_points = 'Story points must be a positive number';
    }
    if (storyData.business_value && (isNaN(storyData.business_value) || storyData.business_value < 0)) {
      newErrors.business_value = 'Business value must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      role: storyData.role.trim(),
      goal: storyData.goal.trim(),
      description: storyData.description.trim(),
      acceptance_criteria: storyData.acceptance_criteria.trim(),
      story_points: storyData.story_points ? parseInt(storyData.story_points, 10) : null,
      business_value: storyData.business_value ? parseInt(storyData.business_value, 10) : null,
    };

    onSubmit(submitData);
  };

  return (
    <div className="story-form-container">
      <form className="story-form" onSubmit={handleSubmit} noValidate>
        <h2>{storyData.id ? 'Edit User Story' : 'Create New User Story'}</h2>
        
        <div className="form-group">
          <label htmlFor="role">
            Role <span className="required">*</span>
          </label>
          <input
            type="text"
            id="role"
            name="role"
            value={storyData.role}
            onChange={handleChange}
            placeholder="e.g., Pig"
            className={errors.role ? 'error' : ''}
          />
          {errors.role && <span className="error-message">{errors.role}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="goal">
            Goal <span className="required">*</span>
          </label>
          <textarea
            id="goal"
            name="goal"
            value={storyData.goal}
            onChange={handleChange}
            placeholder="e.g., I want to create detailed user stories"
            rows="3"
            className={errors.goal ? 'error' : ''}
          />
          {errors.goal && <span className="error-message">{errors.goal}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={storyData.description}
            onChange={handleChange}
            placeholder="Provide additional context or details about the story"
            rows="4"
          />
        </div>

        <div className="form-group">
          <label htmlFor="acceptance_criteria">
            Acceptance Criteria <span className="required">*</span>
          </label>
          <textarea
            id="acceptance_criteria"
            name="acceptance_criteria"
            value={storyData.acceptance_criteria}
            onChange={handleChange}
            placeholder="List the acceptance criteria (one per line or bullet points)"
            rows="5"
            className={errors.acceptance_criteria ? 'error' : ''}
          />
          {errors.acceptance_criteria && (
            <span className="error-message">{errors.acceptance_criteria}</span>
          )}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="story_points">Story Points</label>
            <input
              type="number"
              id="story_points"
              name="story_points"
              value={storyData.story_points}
              onChange={handleChange}
              placeholder="e.g., 5"
              min="0"
              className={errors.story_points ? 'error' : ''}
            />
            {errors.story_points && (
              <span className="error-message">{errors.story_points}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="business_value">Business Value</label>
            <input
              type="number"
              id="business_value"
              name="business_value"
              value={storyData.business_value}
              onChange={handleChange}
              placeholder="e.g., 8"
              min="0"
              className={errors.business_value ? 'error' : ''}
            />
            {errors.business_value && (
              <span className="error-message">{errors.business_value}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {storyData.id ? 'Update Story' : 'Create Story'}
          </button>
          {onCancel && (
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default StoryForm;
