import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import './Project.css';
import IdeaCreation from './IdeaCreation';
import StoryBuilder from './StoryBuilder';
import StoryList from './StoryList';
import MvpPlanning from './MvpPlanning';
import SprintReadiness from './SprintReadiness';
import NotificationPanel from './NotificationPanel';
import api from '../utils/api';
import NotificationSettings from './NotificationSettings';

function Project() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activePage, setActivePage] = useState('ideation');
    const [projectInfo, setProjectInfo] = useState(null);
    const [ideaForStory, setIdeaForStory] = useState(null);
    const [highlightIdeaId, setHighlightIdeaId] = useState(null);
    const [projId, setProjId] = useState(null);
    const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [highlightStoryId, setHighlightStoryId] = useState(null);

    useEffect(() => {
        // Get project info from location state
        if (location.state?.project) {
            setProjectInfo(location.state.project);
            Cookies.set('projectId', location.state.project.projId, { expires: 7 });
            Cookies.set('projectName', location.state.project.name, { expires: 7 });
            setProjId(location.state.project.projId);
        } else {
            // Fallback to cookies if no state provided
            const storedProjId = Cookies.get('projectId');
            const storedProjectName = Cookies.get('projectName');
            
            if (storedProjId) {
                setProjId(storedProjId);
                setProjectInfo({
                    projId: storedProjId,
                    name: storedProjectName || 'Project'
                });
            } else {
                // No project found, redirect to dashboard
                navigate('/dashboard');
            }
        }
    }, [location.state, navigate]);

    const handleNavigation = (page) => {
        setActivePage(page);
    };

    const handleMoveToStoryBuilder = (idea) => {
        setIdeaForStory(idea);
        setActivePage('story-builder');
    };

    const handleShowIdea = (ideaId) => {
        setHighlightIdeaId(ideaId);
        setActivePage('ideation');
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    const handleLogout = () => {
        // Clear all auth-related data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('projectId');
        Cookies.remove('projectName');
        
        // Redirect to login page
        navigate('/');
    };

    const navigationItems = [
        { id: 'ideation', label: 'Ideation', icon: '💡' },
        { id: 'story-builder', label: 'Story Builder', icon: '📖' },
        { id: 'backlog', label: 'Backlog', icon: '📋' },
        { id: 'mvp-planning', label: 'MVP Planning', icon: '🎯' },
        { id: 'sprint-readiness', label: 'Sprint Readiness', icon: '⚡' },
        { id: 'exports', label: 'Exports', icon: '📤' },
        { id: 'notification-settings', label: 'Notifications', icon: '🔔' }
    ];

    const openStoryFromNotification = (storyId) => {
        // Open backlog and set highlight for the requested story
        setActivePage('backlog');
        // small delay to ensure StoryList has mounted and will receive prop
        setTimeout(() => setHighlightStoryId(storyId), 100);
    };

    // Fetch unread notifications count for the current project
    const fetchUnreadCount = async (projectId) => {
        try {
            if (!projectId) {
                setUnreadCount(0);
                return;
            }
            const resp = await api.get(`/notifications/?projectId=${projectId}&limit=100`);
            const notifs = resp.data.notifications || [];
            const unread = notifs.filter((n) => !n.isRead).length;
            setUnreadCount(unread);
        } catch (err) {
            console.error('Error fetching unread count:', err);
        }
    };

    // Refresh unread count when project changes
    useEffect(() => {
        if (projId) fetchUnreadCount(projId);
    }, [projId]);

    return (
        <div className="project-container">
            {/* Left Sidebar Navigation */}
            <nav className="project-sidebar">
                <div className="sidebar-header">
                    <h2 className="project-title">
                        {projectInfo?.name || 'Project'}
                    </h2>
                    <button 
                        className="back-button"
                        onClick={handleBackToDashboard}
                        title="Back to Dashboard"
                    >
                        ←
                    </button>
                </div>

                <div className="nav-items">
                    {navigationItems.map((item) => (
                        <button
                            key={item.id}
                            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                            onClick={() => handleNavigation(item.id)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="sidebar-footer">
                    <div className="project-id-info">
                        <p className="info-label">Project ID</p>
                        <p className="info-value">{projId}</p>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="project-main">
                <header className="project-header">
                    <h1>
                        {navigationItems.find(item => item.id === activePage)?.label}
                    </h1>
                    <div className="header-actions">
                        <button 
                            className="notification-button"
                            onClick={() => setNotificationPanelOpen(!notificationPanelOpen)}
                            title="Notifications"
                        >
                            🔔
                            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                        </button>
                        <button onClick={handleLogout} className="logout-button">
                            Logout
                        </button>
                    </div>
                </header>

                <div className="project-content">
                    {/* Ideation Page */}
                    {activePage === 'ideation' && (
                        <div className="page-content">
                            <IdeaCreation 
                                project={projectInfo} 
                                onMoveToStoryBuilder={handleMoveToStoryBuilder}
                                highlightIdeaId={highlightIdeaId}
                                onHighlightDone={() => setHighlightIdeaId(null)}
                            />
                        </div>
                    )}

                    {/* Story Builder Page */}
                    {activePage === 'story-builder' && (
                        <div className="page-content story-builder-content">
                            <StoryBuilder onNavigate={handleNavigation} idea={ideaForStory} />
                        </div>
                    )}

                    {/* Backlog Page */}
                    {activePage === 'backlog' && (
                        <div className="page-content story-builder-content">
                            <StoryList onShowIdea={handleShowIdea} highlightStoryId={highlightStoryId} />
                        </div>
                    )}

                    {/* MVP Planning Page */}
                    {activePage === 'mvp-planning' && (
                        <div className="page-content">
                            <MvpPlanning />
                        </div>
                    )}

                    {/* Sprint Readiness Page */}
                    {activePage === 'sprint-readiness' && (
                        <div className="page-content">
                            <SprintReadiness />
                        </div>
                    )}

                    {/* Exports Page */}
                    {activePage === 'exports' && (
                        <div className="page-content">
                            <h2>Exports</h2>
                            <p>Coming soon...</p>
                        </div>
                    )}

                    {/* Notification Settings Page */}
                    {activePage === 'notification-settings' && (
                        <div className="page-content">
                            <NotificationSettings />
                        </div>
                    )}
                </div>
            </main>

            {/* Notification Panel */}
            <NotificationPanel 
                projectId={projId} 
                isOpen={notificationPanelOpen} 
                onClose={() => setNotificationPanelOpen(false)}
                onOpenStory={openStoryFromNotification}
                onCountChange={(c) => setUnreadCount(c)}
            />
        </div>
    );
}

export default Project;
