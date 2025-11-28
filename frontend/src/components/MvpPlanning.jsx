import { useState, useEffect, useMemo } from 'react';
import Cookies from 'js-cookie';
import api from '../utils/api';
import './MvpPlanning.css';

const MvpPlanning = () => {
    const [mvps, setMvps] = useState([]);
    const [availableStories, setAvailableStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [notification, setNotification] = useState('');
    const [projectId, setProjectId] = useState(null);
    const [role, setRole] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddToMvp, setShowAddToMvp] = useState(null); // Tracks which story's dropdown is open

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMvp, setEditingMvp] = useState(null); // null for new, mvp object for editing

    // Confirmation Modal State
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [mvpToDelete, setMvpToDelete] = useState(null);

    useEffect(() => {
        const projId = Cookies.get('projectId');
        // Determine logged-in user's role from localStorage (set on login)
        try {
            const rawUser = localStorage.getItem('user');
            if (rawUser) {
                const parsed = JSON.parse(rawUser);
                setRole(parsed.role || '');
            }
        } catch (e) {
            // ignore
        }
        if (projId) {
            setProjectId(projId);
            // Chain API calls to avoid potential race conditions on the backend
            fetchMvps(projId).then(() => {
                fetchAvailableStories(projId);
            });
        } else {
            setError('Project ID not found. Please go back to the dashboard and select a project.');
            setLoading(false);
        }
    }, []);

    const showNotification = (message) => {
        setNotification(message);
        setTimeout(() => {
            setNotification('');
        }, 3000);
    };

    const fetchMvps = async (projId) => {
        try {
            const response = await api.get(`/mvps/?projectId=${projId}`);
            setMvps(response.data.mvps || []);
        } catch (err) {
            setError('Failed to fetch MVPs.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableStories = async (projId) => {
        try {
            const response = await api.get(`/mvps/available-stories?projectId=${projId}`);
            setAvailableStories(response.data.stories || []);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch available stories.');
            console.error(err);
        }
    };

    const handleRemoveStoryFromMvp = async (mvpId, storyId) => {
        try {
            await api.delete(`/mvps/${mvpId}/stories/${storyId}`);
            showNotification('Story removed from MVP.');
            fetchMvps(projectId);
            fetchAvailableStories(projectId);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to remove story.');
            console.error(err);
        }
    };

    const handleAddStoryToMvp = async (storyId, mvpId, mvpStatus = null) => {
        try {
            const payload = { storyId };
            if (mvpStatus) payload.mvpStatus = mvpStatus;
            await api.post(`/mvps/${mvpId}/stories`, payload);
            setShowAddToMvp(null); // Close dropdown
            showNotification('Story assigned to MVP.');
            fetchMvps(projectId);
            fetchAvailableStories(projectId);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to assign story.');
            console.error(err);
        }
    };

    const handleDeleteMvp = (mvpId) => {
        setMvpToDelete(mvpId);
        setIsConfirmModalOpen(true);
    };

    const handleUpdateStoryMvpStatus = async (mvpId, storyId, mvpStatus) => {
        try {
            await api.put(`/mvps/${mvpId}/stories/${storyId}`, { mvpStatus });
            showNotification('MVP story status updated.');
            fetchMvps(projectId);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update story status.');
            console.error(err);
        }
    };

    const confirmDeleteMvp = async () => {
        if (!mvpToDelete) return;
        try {
            await api.delete(`/mvps/${mvpToDelete}`);
            showNotification('MVP deleted successfully.');
            fetchMvps(projectId);
            fetchAvailableStories(projectId); // Stories might become available
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete MVP.');
            console.error(err);
        } finally {
            closeConfirmModal();
        }
    };

    const closeConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setMvpToDelete(null);
    };

    const openModalForNew = () => {
        setEditingMvp(null);
        setIsModalOpen(true);
    };

    const openModalForEdit = (mvp) => {
        setEditingMvp(mvp);
        setIsModalOpen(true);
    };

    const handleSaveMvp = async (mvpData) => {
        try {
            if (editingMvp) {
                // Update existing MVP
                await api.put(`/mvps/${editingMvp.mvpId}`, mvpData);
                showNotification('MVP updated successfully.');
            } else {
                // Create new MVP
                await api.post('/mvps/', { ...mvpData, projectId });
                showNotification('MVP created successfully.');
            }
            fetchMvps(projectId);
            setIsModalOpen(false);
            setEditingMvp(null);
        } catch (err) {
            const errorMessage = err.response?.data?.error || (editingMvp ? 'Failed to update MVP.' : 'Failed to create MVP.');
            setError(errorMessage);
            console.error(err);
        }
    };

    const filteredAvailableStories = useMemo(() => {
        if (!searchTerm) return availableStories;
        const term = searchTerm.toLowerCase();
        return availableStories.filter(story =>
            story.goal?.toLowerCase().includes(term) ||
            story.role?.toLowerCase().includes(term) ||
            story.storyId?.toLowerCase().includes(term)
        );
    }, [availableStories, searchTerm]);

    const getFilteredMvps = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return mvps;

        // Create a new array of MVPs, filtering stories within them
        const filteredMvps = mvps.map(mvp => {
            const filteredStories = mvp.stories.filter(story =>
                story.goal?.toLowerCase().includes(term) ||
                story.role?.toLowerCase().includes(term) ||
                story.storyId?.toLowerCase().includes(term)
            );
            return { ...mvp, stories: filteredStories };
        });

        // Filter out MVPs that don't have the search term in their own fields
        // and also have no matching stories after filtering.
        return filteredMvps.filter(mvp =>
            mvp.name.toLowerCase().includes(term) ||
            mvp.description.toLowerCase().includes(term) ||
            mvp.stories.length > 0
        );

    }, [mvps, searchTerm]);

    if (loading) {
        return <div className="loading">Loading MVP Planner...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    const MvpCard = ({ mvp }) => {
        const totalPoints = mvp.stories.reduce((sum, story) => sum + (story.story_points || 0), 0);
        const readyPoints = mvp.stories
            .filter(s => s.status === 'sprint-ready')
            .reduce((sum, story) => sum + (story.story_points || 0), 0);
        const businessValue = mvp.stories.reduce((sum, story) => sum + (story.business_value || 0), 0);
        const progress = totalPoints > 0 ? (readyPoints / totalPoints) * 100 : 0;

        return (
            <div className="mvp-card">
                        <div className="mvp-card-header">
                    <h3>{mvp.name}</h3>
                    <div className="mvp-actions">
                                {role === 'chicken' && (
                                    <>
                                        <button className="btn-icon" title="Edit MVP" onClick={() => openModalForEdit(mvp)}>✏️</button>
                                        <button className="btn-icon btn-danger" title="Delete MVP" onClick={() => handleDeleteMvp(mvp.mvpId)}>🗑️</button>
                                    </>
                                )}
                    </div>
                </div>
                <p className="mvp-description">{mvp.description}</p>
                {mvp.targetReleaseDate && <p className="mvp-date">Target: {new Date(mvp.targetReleaseDate).toLocaleDateString()}</p>}

                <div className="mvp-metrics">
                    <div className="metric">
                        <span className="metric-label">Story Points:</span>
                        <span className="metric-value">{totalPoints}</span>
                    </div>
                    <div className="metric">
                        <span className="metric-label">Business Value:</span>
                        <span className="metric-value">{businessValue}</span>
                    </div>
                </div>

                <div className="mvp-progress">
                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="progress-label">{Math.round(progress)}% Ready ({readyPoints}/{totalPoints} pts)</span>
                </div>

                <div className="mvp-stories-list">
                    <h4>Stories ({mvp.stories.length})</h4>
                    {mvp.stories.length > 0 ? mvp.stories.map(story => (
                        <div key={story.storyId} className="story-card-sm">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                <span className="story-title-sm">{story.goal}</span>
                                {story.mvpStatus ? <span className="mvp-status">{story.mvpStatus}</span> : null}

                                {/* Chicken can edit mvpStatus on already-assigned stories */}
                                {role === 'chicken' && (
                                    <select
                                        value={story.mvpStatus || ''}
                                        onChange={(e) => handleUpdateStoryMvpStatus(mvp.mvpId, story.storyId, e.target.value || null)}
                                        style={{ marginLeft: 'auto' }}
                                    >
                                        <option value="">No status</option>
                                        <option value="must-have">must-have</option>
                                        <option value="nice-to-have">nice-to-have</option>
                                    </select>
                                )}

                                {role === 'chicken' && (
                                    <button
                                        className="btn-remove-story"
                                        onClick={() => handleRemoveStoryFromMvp(mvp.mvpId, story.storyId)}
                                        title="Remove from MVP"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    )) : <p className="no-stories-in-mvp">Use the '+' button on an available story.</p>}
                </div>
            </div>
        );
    };

    const MvpModal = ({ isOpen, onClose, onSave, mvp }) => {
        const [name, setName] = useState('');
        const [description, setDescription] = useState('');
        const [targetReleaseDate, setTargetReleaseDate] = useState('');

        useEffect(() => {
            if (mvp) {
                setName(mvp.name || '');
                setDescription(mvp.description || '');
                setTargetReleaseDate(mvp.targetReleaseDate ? new Date(mvp.targetReleaseDate).toISOString().split('T')[0] : '');
            } else {
                setName('');
                setDescription('');
                setTargetReleaseDate('');
            }
        }, [mvp, isOpen]);

        if (!isOpen) return null;

        const handleSubmit = (e) => {
            e.preventDefault();
            onSave({ name, description, targetReleaseDate });
        };

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2>{mvp ? 'Edit MVP' : 'Create New MVP'}</h2>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="mvp-name">Name</label>
                            <input id="mvp-name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label htmlFor="mvp-description">Description</label>
                            <textarea id="mvp-description" value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="mvp-date">Target Release Date</label>
                            <input id="mvp-date" type="date" value={targetReleaseDate} onChange={e => setTargetReleaseDate(e.target.value)} />
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                            <button type="submit" className="btn-primary">Save</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
        if (!isOpen) return null;

        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2>{title}</h2>
                    <div className="modal-body">
                        {children}
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="button" className="btn-danger" onClick={onConfirm}>Delete</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="mvp-planning-container">
            {notification && <div className="notification">{notification}</div>}
            <MvpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveMvp} mvp={editingMvp} />

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmDeleteMvp}
                title="Confirm Deletion"
            >
                <p>Are you sure you want to delete this MVP? All assigned stories will become available again.</p>
            </ConfirmationModal>

            <div className="mvp-controls">
                {role === 'chicken' && (
                    <button className="btn-primary" onClick={openModalForNew}>+ Create New MVP</button>
                )}
                <input
                    type="text"
                    placeholder="Search MVPs or stories..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="mvp-board-layout">
                <div className="mvp-board">
                    <h2>MVPs</h2>
                    {mvps.length === 0 && !searchTerm ? (
                        <div className="empty-state">
                            <p>No MVPs planned yet. Create one to start grouping stories.</p>
                        </div>
                    ) : (
                        <div className="mvp-list">
                            {getFilteredMvps.map(mvp => <MvpCard key={mvp.mvpId} mvp={mvp} />)}
                            {getFilteredMvps.length === 0 && searchTerm && <p>No MVPs or stories match your search.</p>}
                        </div>
                    )}
                </div>
                <div className="available-stories-pool">
                    <h2>Available Groomed Stories</h2>
                    <div className="available-stories-list">
                        {filteredAvailableStories.length > 0 ? filteredAvailableStories.map(story => (
                            <div key={story.storyId} className="story-card-sm available">
                                <span className="story-title-sm">{story.goal}</span>
                                <div className="add-to-mvp-container">
                                    <button
                                        className="btn-add-story"
                                        onClick={() => setShowAddToMvp(showAddToMvp === story.storyId ? null : story.storyId)}
                                        title="Add to MVP"
                                    >
                                        +
                                    </button>
                                    {showAddToMvp === story.storyId && (
                                        <div className="add-to-mvp-dropdown">
                                            {mvps.length > 0 ? mvps.map(mvp => (
                                                <div key={mvp.mvpId}>
                                                    <button onClick={() => handleAddStoryToMvp(story.storyId, mvp.mvpId)}>
                                                        {mvp.name}
                                                    </button>
                                                </div>
                                            )) : <div className="no-mvps-to-add">No MVPs exist</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )) : (
                            <p className="no-stories-in-pool">
                                {searchTerm ? 'No matching stories.' : 'No available groomed stories.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MvpPlanning;