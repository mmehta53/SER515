import React, { useState, useEffect, useRef } from "react";
import api from "../utils/api";
import './IdeaCreation.css';

const IdeaCreation = ({ project, onMoveToStoryBuilder, highlightIdeaId, onHighlightDone }) => {
  const [ideas, setIdeas] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    project: project?.projId || "",   // this will map to projId when posting
    tags: ""
  });

  // const [filterUsername, setFilterUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentIdeaId, setCommentIdeaId] = useState(null);
  const [editingIdeaId, setEditingIdeaId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', tags: '' });
  const ideaRefs = useRef({});

 useEffect(() => {
    const projectId = project?.projId;
    if (projectId) {
      setFormData(prev => ({ ...prev, project: projectId }));
      loadIdeas(projectId);
    }
  }, [project]); // Re-run if project prop changes

  useEffect(() => {
    if (highlightIdeaId && ideaRefs.current[highlightIdeaId]) {
      const element = ideaRefs.current[highlightIdeaId];
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlight');
      setTimeout(() => {
        element.classList.remove('highlight');
        onHighlightDone();
      }, 2500);
    }
  }, [highlightIdeaId, onHighlightDone, ideas]);

  const normalizeId = (idea) => idea.ideaId || idea.id || idea._id || "";
  const getCurrentUserId = () => {
    try {
      const raw = localStorage.getItem('user');
      if (!raw) return null;
      const u = JSON.parse(raw);
      return u?.userId || u?.id || null;
    } catch (e) {
      return null;
    }
  };

  // Drag/drop: track currently dragged id for visual feedback
  const [draggedIdeaId, setDraggedIdeaId] = useState(null);

  const loadIdeas = async (projId = "") => {
    setLoading(true);
    setError("");
    try {
      const projectToUse = projId || formData.project;
      if (!projectToUse) {
        setIdeas([]); // nothing to fetch
        setLoading(false);
        return;
      }
      const resp = await api.get(`/ideas/project/${encodeURIComponent(projectToUse)}`);
      // backend returns array of idea dicts
      const data = resp.data || [];
      // normalize a few fields so UI works with different shapes
      const normalized = data.map(i => ({
        ...i,
        _localId: normalizeId(i),
        title: i.title,
        description: i.description,
        tags: i.tags || [],
        comments: i.comments || [],
        votes: i.votes || [],
        createdByName: i.createdByName || i.created_by_username || i.createdBy || "Unknown",
        upvotes: typeof i.upvotes === "number" ? i.upvotes : 0,
        downvotes: typeof i.downvotes === "number" ? i.downvotes : 0
      }));
      // derive current user's vote for each idea
      const currentUserId = getCurrentUserId();
      normalized.forEach(n => {
        const my = (n.votes || []).find(v => v.userId === currentUserId);
        n.currentUserVote = my ? my.voteType : null;
      });
      setIdeas(normalized);
    } catch (err) {
      console.error(err);
      setError("Failed to load ideas");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // const handleFilterChange = (e) => setFilterUsername(e.target.value);

  // const applyFilter = () => {
  //   // client-side filter on loaded ideas
  //   if (!filterUsername) {
  //     loadIdeas(formData.project);
  //     return;
  //   }
  //   setIdeas(prev => prev.filter(idea => {
  //     const username = idea.createdByName || "";
  //     return username.toLowerCase() === filterUsername.trim().toLowerCase();
  //   }));
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!formData.project) {
        setError("Project ID is required");
        setLoading(false);
        return;
      }

      // backend expects "projId" and tags can be a comma string (your backend's parse_tags expects a string)
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        projId: formData.project.trim(),
        tags: formData.tags ? formData.tags.trim() : ""
      };

      const resp = await api.post("/ideas/", payload);
      const createdIdea = resp.data;

      const normalized = {
        ...createdIdea,
        _localId: normalizeId(createdIdea),
        tags: createdIdea.tags || (createdIdea.tags ? createdIdea.tags : []),
        comments: createdIdea.comments || [],
        votes: createdIdea.votes || [],
        createdByName: createdIdea.createdByName || createdIdea.created_by_username || "Unknown",
        upvotes: typeof createdIdea.upvotes === "number" ? createdIdea.upvotes : 0,
        downvotes: typeof createdIdea.downvotes === "number" ? createdIdea.downvotes : 0
      };

      // set currentUserVote for created idea
      try { const uid = getCurrentUserId(); const mv = (normalized.votes || []).find(v=>v.userId===uid); normalized.currentUserVote = mv?mv.voteType:null; } catch(e){}

  setIdeas(prev => [normalized, ...prev]);
  // clear only the fields we want to reset but keep the project so list remains
  setFormData(prev => ({ ...prev, title: "", description: "", tags: "" }));
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError("Failed to create idea");
    } finally {
      setLoading(false);
    }
  };

  // Inline edit handlers (client-side only)
  const startEditing = (idea) => {
    setEditingIdeaId(idea._localId || idea.ideaId || idea.id || idea._id);
    setEditForm({ title: idea.title || '', description: idea.description || '', tags: (idea.tags||[]).join(', ') });
  };

  const cancelEditing = () => {
    setEditingIdeaId(null);
    setEditForm({ title: '', description: '', tags: '' });
  };

  const saveEdit = (idea) => {
    const id = idea._localId || idea.ideaId || idea.id || idea._id;
    const updated = { ...idea, title: editForm.title.trim(), description: editForm.description.trim(), tags: editForm.tags.split(',').map(t => t.trim()).filter(Boolean) };
    // Persist edit to backend
    (async () => {
      try {
        const payload = {
          title: updated.title,
          description: updated.description,
          tags: editForm.tags, // Send the raw comma-separated string
        };
        const resp = await api.put(`/ideas/${encodeURIComponent(id)}`, payload);
        const saved = resp.data;
        const norm = { ...saved, _localId: normalizeId(saved), tags: saved.tags || [], comments: saved.comments || [] };
        setIdeas(prev => prev.map(i => (i._localId === id ? norm : i)));
      } catch (err) {
        console.error('Failed to save edit', err);
        // fallback to local update
        setIdeas(prev => prev.map(i => (i._localId === id ? { ...i, ...updated } : i)));
      } finally {
        setEditingIdeaId(null);
      }
    })();
  };

  const voteOnIdea = async (ideaId, voteType) => {
    // voteType: 'upvote' | 'downvote'
    try {
      const endpoint = voteType === 'upvote' ? `/ideas/${encodeURIComponent(ideaId)}/upvote`
                                            : `/ideas/${encodeURIComponent(ideaId)}/downvote`;
      const resp = await api.post(endpoint);
      return resp.data;
    } catch (err) {
      throw err;
    }
  };

  const handleVote = async (idea) => {
    // this helper resolves which vote from the clicked button via dataset
    // kept simple: callers will call handleVote with (idea, 'upvote') etc
  };

  const handleVoteClick = async (idea, voteType) => {
    setError("");
    try {
      // prevent sending same vote twice
      if ((idea.currentUserVote || null) === voteType) {
        setError(`You already ${voteType}`);
        return;
      }
      const updated = await voteOnIdea(idea.ideaId || idea._localId || idea.id || idea._id, voteType);
      // normalize and replace
      const normalized = {
        ...updated,
        _localId: normalizeId(updated),
        tags: updated.tags || [],
        comments: updated.comments || [],
        createdByName: updated.createdByName || updated.created_by_username || "Unknown",
        upvotes: typeof updated.upvotes === "number" ? updated.upvotes : 0,
        downvotes: typeof updated.downvotes === "number" ? updated.downvotes : 0
      };
      try { const uid = getCurrentUserId(); normalized.votes = updated.votes || []; const mv = normalized.votes.find(v=>v.userId===uid); normalized.currentUserVote = mv?mv.voteType:null; } catch(e){}
      setIdeas(prev => prev.map(i => (i._localId === normalized._localId ? normalized : i)));
    } catch (err) {
      console.error(err);
      setError("Failed to submit vote");
    }
  };

  // Drag & drop handlers
  const onDragStart = (e, idea) => {
    const id = idea._localId || idea.ideaId || idea.id || idea._id;
    e.dataTransfer.setData('text/plain', id);
    setDraggedIdeaId(id);
  };
  const onDragEnd = () => setDraggedIdeaId(null);

  const onColumnDragOver = (e) => {
    e.preventDefault();
  };

  const onColumnDrop = (e, targetStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id) return;

    // Prevent dropping into 'moved' column
    if (targetStatus === 'moved') {
      setError("Ideas can only be moved here by creating a user story.");
      setDraggedIdeaId(null);
      return;
    }

    const prevState = ideas;
    const dragged = prevState.find(i => (i._localId || i.ideaId || i.id || i._id) === id);
    if (!dragged) return setDraggedIdeaId(null);

    // Prevent dragging out of 'moved' column
    if (dragged.status === 'moved') {
      setError("A 'moved' idea cannot change its status.");
      setDraggedIdeaId(null);
      return;
    }

    // Optimistic UI update
    setIdeas(prev => {
      const updated = { ...dragged, status: targetStatus };
      const without = prev.filter(i => (i._localId || i.ideaId || i.id || i._id) !== id);
      return [updated, ...without];
    });
    setDraggedIdeaId(null);
    // Persist status change
    (async () => {
      try {
        await api.put(`/ideas/${encodeURIComponent(id)}`, { status: targetStatus });
        // Clear any previous errors on success
        if (error) {
          setError("");
        }
      } catch (err) {
        console.error('Failed to persist move', err);
        // revert to previous state on failure
        setError("You are unauthorized to change the status of this idea. Only the creator can change it.");
        setIdeas(prevState);
      }
    })();
  };

  const openCommentBox = (ideaId) => {
    setCommentIdeaId(ideaId);
    setCommentText("");
  };

  const handleCommentChange = (e) => setCommentText(e.target.value);

  const addCommentToIdea = async (ideaId, payload) => {
    // POST to /ideas/<ideaId>/comment
    const resp = await api.post(`/ideas/${encodeURIComponent(ideaId)}/comment`, { text: payload.text });
    return resp.data;
  };

  const submitComment = async () => {
    if (!commentText.trim() || !commentIdeaId) return;
    try {
      const payload = {
        text: commentText.trim()
      };
      const updatedIdea = await addCommentToIdea(commentIdeaId, payload);
      const normalized = {
        ...updatedIdea,
        _localId: normalizeId(updatedIdea),
        tags: updatedIdea.tags || [],
        comments: updatedIdea.comments || [],
        createdByName: updatedIdea.createdByName || updatedIdea.created_by_username || "Unknown",
        upvotes: typeof updatedIdea.upvotes === "number" ? updatedIdea.upvotes : 0,
        downvotes: typeof updatedIdea.downvotes === "number" ? updatedIdea.downvotes : 0
      };
      setIdeas(prev => prev.map(idea => (idea._localId === normalized._localId ? normalized : idea)));
      setCommentIdeaId(null);
      setCommentText("");
    } catch (err) {
      console.error(err);
      setError("Failed to add comment");
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="idea-creation-container">
      <button onClick={() => setShowForm(!showForm)} className="toggle-form-btn">
        {showForm ? "Cancel" : "+ Add New Idea"}
      </button>

      {/* General error message display */}
      {error && (
        <div className="error-banner">
          <span>{error}</span>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="idea-form">
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Idea Title"
            required
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Description"
            required
          />
          <input
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="Tags (comma separated)"
          />
          <button type="submit" className="submit-btn">Create Idea</button>
        </form>
      )}

      {/* Filter temporarily disabled
      <div className="filter-container">
        <input
          type="text"
          placeholder="Filter by creator username"
          value={filterUsername}
          onChange={handleFilterChange}
        />
        <button onClick={applyFilter}>Apply Filter</button>
        <button onClick={() => loadIdeas(formData.project)}>Load Ideas for Project</button>
      </div>
      */}

      <h2 className="ideas-main-header">Ideas Board</h2>
      {ideas.length === 0 ? (
        <p>No ideas created</p>
      ) : (
        <div className="ideas-columns">
          {['new', 'reviewed', 'moved'].map((col) => (
            <div className={`ideas-column`} key={col} onDragOver={onColumnDragOver} onDrop={(e) => onColumnDrop(e, col)}>
              <h3 className="column-title">{col.charAt(0).toUpperCase() + col.slice(1)}</h3>
              <ul className="ideas-list">
                {ideas.filter(i => ((i.status||'new').toLowerCase() === col)).map((idea) => {
                  const id = idea._localId || idea.ideaId || idea.id || idea._id;
                  const isEditing = editingIdeaId === id;
                  const isCreator = idea.createdBy === getCurrentUserId();
                  return (
                    <li 
                      key={id} 
                      id={id}
                      ref={el => ideaRefs.current[id] = el}
                      className={`idea-card ${draggedIdeaId === id ? 'dragging' : ''} ${idea.status === 'moved' ? 'locked' : ''}`} 
                      draggable={idea.status !== 'moved'} 
                      onDragStart={(e) => idea.status !== 'moved' && onDragStart(e, idea)} 
                      onDragEnd={onDragEnd}
                    >
                      <div className="idea-title" style={{fontWeight:700}}>{idea.title}</div>
                      <div className="idea-creator">by {idea.createdByName || (idea.createdBy || '').slice(0,8)}</div>

                      {isEditing ? (
                        <div className="idea-edit">
                          <input className="idea-edit-input" name="title" value={editForm.title} onChange={handleEditChange} />
                          <textarea className="idea-edit-input" name="description" value={editForm.description} onChange={handleEditChange} />
                          <input className="idea-edit-input" name="tags" value={editForm.tags} onChange={handleEditChange} />
                          <div className="edit-actions">
                            <button className="save-edit" onClick={() => saveEdit(idea)}>Save</button>
                            <button className="cancel-edit" onClick={cancelEditing}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="idea-description">{idea.description}</div>
                          <div className="tags">{(idea.tags||[]).map(t => <span key={t} className="tag">{t}</span>)}</div>
                          <div className="actions-inline">
                            <button className={`upvote ${idea.currentUserVote==='upvote'?'disabled':''}`} onClick={() => handleVoteClick(idea, 'upvote')} disabled={idea.currentUserVote==='upvote'}>▲ {idea.upvotes || 0}</button>
                            <button className={`downvote ${idea.currentUserVote==='downvote'?'disabled':''}`} onClick={() => handleVoteClick(idea, 'downvote')} disabled={idea.currentUserVote==='downvote'}>▼ {idea.downvotes || 0}</button>
                            <button className="comment-btn" onClick={() => openCommentBox(id)}>💬 Comment</button>
                            {isCreator && <button className="comment-btn" onClick={() => startEditing(idea)}>✏️ Edit</button>}
                            {col === 'reviewed' && (
                              <button className="move-to-story-btn" onClick={() => onMoveToStoryBuilder(idea)}>🚀 Move to Story Builder</button>
                            )}
                            {/* <button className="comment-btn" onClick={() => startEditing(idea)}>✏️ Edit</button> */}
                          </div>
                        </>
                      )}

                      <div className="comments-list">
                        {(idea.comments || []).length > 0 ? (
                          (idea.comments || []).map((c, idx) => (
                            <div key={c.commentId || idx} className="comment-item">
                              <strong>{c.userName || c.userId || 'Anon'}</strong>: {c.text}
                            </div>
                          ))
                        ) : (
                          <div className="no-comments">No comments yet</div>
                        )}
                      </div>

                      {commentIdeaId === id && (
                        <div className="comment-box">
                          <textarea value={commentText} onChange={handleCommentChange} placeholder="Write a comment..." />
                          <button className="submit-comment" onClick={submitComment}>Post</button>
                          <button className="cancel-comment" onClick={() => setCommentIdeaId(null)}>Cancel</button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IdeaCreation;
