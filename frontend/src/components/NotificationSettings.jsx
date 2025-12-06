import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '../utils/api';
import './NotificationSettings.css';

const NotificationSettings = () => {
  const [preferences, setPreferences] = useState({
    notifySprintReady: true,
    notifyStoryUpdated: true,
    notifyStatusChange: true,
    notifyComments: true,
  });
  const [projectId, setProjectId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Get projectId from cookies
    const projId = Cookies.get('projectId');
    if (projId) {
      setProjectId(projId);
      fetchPreferences(projId);
    } else {
      setError('No project selected');
      setLoading(false);
    }
  }, []);

  const fetchPreferences = async (projId) => {
    try {
      setLoading(true);
      const resp = await api.get(`/notifications/preferences?projectId=${projId}`);
      setPreferences(resp.data.preferences);
    } catch (err) {
      console.error('Error fetching preferences:', err);
      setError(err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (field) => {
    setPreferences((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setMessage('');
      setError('');

      await api.put('/notifications/preferences', {
        projectId,
        ...preferences,
      });

      setMessage('Preferences saved successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save preferences');
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="notification-settings-container">Loading preferences...</div>;
  }

  return (
    <div className="notification-settings-container">
      <div className="notification-settings-card">
        <h2>Notification Preferences</h2>
        <p className="settings-description">Manage which notifications you want to receive</p>

        {error && <div className="settings-error">{error}</div>}
        {message && <div className="settings-success">{message}</div>}

        <div className="settings-section">
          <h3>Event Types</h3>
          <div className="settings-list">
            <div className="settings-item">
              <div className="settings-label">
                <label htmlFor="notifySprintReady">Story marked as sprint-ready</label>
                <p className="settings-help">Get notified when stories are marked ready for sprint</p>
              </div>
              <input
                id="notifySprintReady"
                type="checkbox"
                checked={preferences.notifySprintReady}
                onChange={() => handleToggle('notifySprintReady')}
                className="settings-toggle"
              />
            </div>

            <div className="settings-item">
              <div className="settings-label">
                <label htmlFor="notifyStoryUpdated">Story updated</label>
                <p className="settings-help">Get notified when story details are changed</p>
              </div>
              <input
                id="notifyStoryUpdated"
                type="checkbox"
                checked={preferences.notifyStoryUpdated}
                onChange={() => handleToggle('notifyStoryUpdated')}
                className="settings-toggle"
              />
            </div>

            <div className="settings-item">
              <div className="settings-label">
                <label htmlFor="notifyStatusChange">Status changes</label>
                <p className="settings-help">Get notified when story status changes</p>
              </div>
              <input
                id="notifyStatusChange"
                type="checkbox"
                checked={preferences.notifyStatusChange}
                onChange={() => handleToggle('notifyStatusChange')}
                className="settings-toggle"
              />
            </div>

            <div className="settings-item">
              <div className="settings-label">
                <label htmlFor="notifyComments">Comments</label>
                <p className="settings-help">Get notified when people comment on stories</p>
              </div>
              <input
                id="notifyComments"
                type="checkbox"
                checked={preferences.notifyComments}
                onChange={() => handleToggle('notifyComments')}
                className="settings-toggle"
              />
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button className="btn-primary" onClick={handleSavePreferences} disabled={saving}>
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
