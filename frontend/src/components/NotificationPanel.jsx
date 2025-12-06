import { useState, useEffect } from 'react';
import api from '../utils/api';
import './NotificationPanel.css';

const NotificationPanel = ({ projectId, isOpen, onClose, onOpenStory }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && projectId) {
      fetchNotifications();
    }
  }, [isOpen, projectId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const resp = await api.get(`/notifications/?projectId=${projectId}&limit=30`);
      setNotifications(resp.data.notifications || []);
    } catch (err) {
      setError(err.message || 'Failed to load notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(
        notifications.map((n) =>
          n.notificationId === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put(`/notifications/read-all?projectId=${projectId}`);
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="notification-panel-overlay" onClick={onClose}>
      <div className="notification-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notification-panel-header">
          <h3>Notifications {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="notification-error">{error}</div>}

        {loading ? (
          <div className="notification-loading">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty">No notifications yet</div>
        ) : (
          <>
            {unreadCount > 0 && (
              <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                Mark all as read
              </button>
            )}
            <div className="notification-list">
              {notifications.map((notif) => (
                <div
                  key={notif.notificationId}
                  className={`notification-item ${notif.isRead ? 'read' : 'unread'}`}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif.notificationId)}
                >
                  <div className="notification-content">
                    <div className="notification-title">{notif.title}</div>
                    <div className="notification-message">{notif.message}</div>
                    <div className="notification-meta">
                      <span className="notification-time">{formatTime(notif.createdAt)}</span>
                      {notif.relatedStoryId && (
                        <button
                          className="notification-link"
                          onClick={() => {
                            if (onOpenStory) onOpenStory(notif.relatedStoryId);
                          }}
                        >
                          View story →
                        </button>
                      )}
                    </div>
                  </div>
                  {!notif.isRead && <div className="notification-unread-indicator"></div>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function formatTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);

  if (diffSecs < 60) return 'just now';
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
  return date.toLocaleDateString();
}

export default NotificationPanel;
