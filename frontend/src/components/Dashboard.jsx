import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import './Dashboard.css';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const navigate = useNavigate();

    // Fetch projects when component mounts
    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects/');
            if (response.data && response.data.projects) {
                setProjects(response.data.projects);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to fetch projects');
            console.error('Error fetching projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        try {
            const response = await api.post('/projects/', {
                name: newProject.name,
                description: newProject.description
            });
            
            if (response.data && response.data.project) {
                setProjects([...projects, response.data.project]);
                setNewProject({ name: '', description: '' }); // Reset form
                setShowForm(false); // Hide form after successful creation
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create project');
            console.error('Error creating project:', err);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    const handleLogout = () => {
        // Clear all auth-related data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        Cookies.remove('projectId');
        Cookies.remove('projectName');
        
        // Redirect to login page
        navigate('/');
    };

    const handleProjectClick = (project) => {
        // Store project ID and name in cookies
        Cookies.set('projectId', project.projId, { expires: 7 });
        Cookies.set('projectName', project.name, { expires: 7 });
        
        // Navigate to project page without projId in URL
        navigate('/project', { state: { project } });
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1 className="dashboard-title">Projects Dashboard</h1>
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>
            
            {/* Create Project Button */}
            <div className="create-project-section">
                {!showForm ? (
                    <button 
                        onClick={() => setShowForm(true)} 
                        className="create-project-btn"
                    >
                        + Create New Project
                    </button>
                ) : (
                    <div className="project-form-card">
                        <div className="form-header">
                            <h2 className="form-title">Create New Project</h2>
                            <button 
                                onClick={() => {
                                    setShowForm(false);
                                    setNewProject({ name: '', description: '' });
                                    setError('');
                                }} 
                                className="close-form-btn"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="project-form">
                            <div className="form-group">
                                <input
                                    type="text"
                                    placeholder="Project Name"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <textarea
                                    placeholder="Project Description"
                                    value={newProject.description}
                                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                                    className="form-textarea"
                                    rows="4"
                                    required
                                />
                            </div>
                            {error && <div className="error-message">{error}</div>}
                            <button type="submit" className="submit-button">
                                Create Project
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Projects List */}
            <div className="projects-section">
                <h2 className="section-title">Your Projects</h2>
                {projects.length === 0 ? (
                    <p className="no-projects">No projects found. Create your first project!</p>
                ) : (
                    <div className="projects-grid">
                        {projects.map((project) => (
                            <div 
                                key={project.projId} 
                                className="project-card"
                                onClick={() => handleProjectClick(project)}
                                style={{ cursor: 'pointer' }}
                            >
                                <h3 className="project-name">{project.name}</h3>
                                <p className="project-description">{project.description}</p>
                                <div className="project-stats">
                                    <p><span className="stat-label">Status:</span> {project.status}</p>
                                    <p><span className="stat-label">Progress:</span> {project.progress}%</p>
                                    <p><span className="stat-label">Stories:</span> {project.readyStories} ready / {project.totalStories} total</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
