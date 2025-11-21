import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';
import './Project.css';
import IdeaCreation from './IdeaCreation'; // Import the IdeaCreation component
import StoryBuilder from './StoryBuilder'; // Import the StoryBuilder component
import StoryList from './StoryList'; // Import the StoryList component

function Project() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activePage, setActivePage] = useState('ideation');
    const [projectInfo, setProjectInfo] = useState(null);
    const [projId, setProjId] = useState(null);

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
        { id: 'exports', label: 'Exports', icon: '📤' }
    ];

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
                    <button onClick={handleLogout} className="logout-button">
                        Logout
                    </button>
                </header>

                <div className="project-content">
                    {/* Ideation Page */}
                    {activePage === 'ideation' && (
                        <div className="page-content">
                            <IdeaCreation project={projectInfo} />
                        </div>
                    )}

                    {/* Story Builder Page */}
                    {activePage === 'story-builder' && (
                        <div className="page-content story-builder-content">
                            <StoryBuilder onNavigate={handleNavigation} />
                        </div>
                    )}

                    {/* Backlog Page */}
                    {activePage === 'backlog' && (
                        <div className="page-content story-builder-content">
                            <StoryList />
                        </div>
                    )}

                    {/* MVP Planning Page */}
                    {activePage === 'mvp-planning' && (
                        <div className="page-content">
                            <h2>MVP Planning</h2>
                            <p>Coming soon...</p>
                        </div>
                    )}

                    {/* Sprint Readiness Page */}
                    {activePage === 'sprint-readiness' && (
                        <div className="page-content">
                            <h2>Sprint Readiness</h2>
                            <p>Coming soon...</p>
                        </div>
                    )}

                    {/* Exports Page */}
                    {activePage === 'exports' && (
                        <div className="page-content">
                            <h2>Exports</h2>
                            <p>Coming soon...</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Project;
