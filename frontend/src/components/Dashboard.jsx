import { useState, useEffect } from 'react';
import api from '../utils/api';

import { useNavigate } from 'react-router-dom';

function Dashboard() {
    const [projects, setProjects] = useState([]);
    const [newProject, setNewProject] = useState({ name: '', description: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
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
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create project');
            console.error('Error creating project:', err);
        }
    };

    if (loading) return <div>Loading...</div>;

    const handleLogout = () => {
        // Clear all auth-related data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirect to login page
        navigate('/');
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h1>Projects Dashboard</h1>
                <button
                    onClick={handleLogout}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}
                >
                    Logout
                </button>
            </div>
            
            {/* Create Project Form */}
            <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc' }}>
                <h2 style={{ marginBottom: '15px' }}>Create New Project</h2>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            placeholder="Project Name"
                            value={newProject.name}
                            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                            required
                        />
                        <textarea
                            placeholder="Project Description"
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                            required
                        />
                    </div>
                    <button 
                        type="submit"
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Create Project
                    </button>
                </form>
            </div>

            {/* Error Message */}
            {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

            {/* Projects List */}
            <div>
                <h2 style={{ marginBottom: '15px' }}>Your Projects</h2>
                {projects.length === 0 ? (
                    <p>No projects found.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {projects.map((project) => (
                            <div 
                                key={project.projId}
                                style={{
                                    padding: '15px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px'
                                }}
                            >
                                <h3 style={{ marginBottom: '10px' }}>{project.name}</h3>
                                <p style={{ marginBottom: '10px', color: '#666' }}>{project.description}</p>
                                <div style={{ fontSize: '0.9em', color: '#666' }}>
                                    <p>Status: {project.status}</p>
                                    <p>Progress: {project.progress}%</p>
                                    <p>Stories: {project.readyStories} ready / {project.totalStories} total</p>
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
