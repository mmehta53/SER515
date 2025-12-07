import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '../utils/api';
import './SprintReadiness.css';

function SprintReadiness() {
  const [stories, setStories] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const storiesPerPage = 5;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const projId = Cookies.get('projectId');
        if (projId) {
          const resp = await api.get(`/stories?projectId=${projId}`);
          if (resp.data && resp.data.success) {
            // map backend story shape to local shape
            const mapped = resp.data.stories.map(s => ({
              id: s.storyId || s.storyId || s._id,
              title: s.goal || s.title || s.description || 'No title',
              storyPoints: s.story_points || s.storyPoints || s.storyPoints || null,
              businessValue: s.business_value || s.businessValue || null,
              role: s.role || null,
              goal: s.goal || s.role || null,
              description: s.description || '',
              acceptance: s.acceptance_criteria || s.acceptance_criteria || s.acceptance || false,
              status: (s.status && (s.status === 'sprint-ready' || s.status === 'Sprint Ready')) ? 'Sprint Ready' : (s.status || 'Draft')
            }));
            setStories(mapped);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        // ignore and fallback to sample
      }

      // fallback sample
      const sample = [
        { id: 'US-201', title: 'OAuth login', storyPoints: 8, businessValue: 20, role: 'User', goal: 'Allow OAuth', description: 'Enable OAuth login for users', acceptance: true, status: 'Sprint Ready' },
        { id: 'US-202', title: 'Project page', storyPoints: null, businessValue: 10, role: '', goal: '', description: '', acceptance: false, status: 'Needs Work' },
        { id: 'US-203', title: 'README template', storyPoints: 2, businessValue: null, role: 'Developer', goal: 'Provide README', description: 'Create README template', acceptance: true, status: 'Needs Work' },
        { id: 'US-204', title: 'User Dashboard', storyPoints: 5, businessValue: 15, role: 'Admin', goal: 'View analytics', description: 'Dashboard with charts', acceptance: true, status: 'Sprint Ready' },
        { id: 'US-205', title: 'Email notifications', storyPoints: 3, businessValue: 8, role: 'User', goal: 'Receive alerts', description: 'Send email alerts', acceptance: false, status: 'Needs Work' },
        { id: 'US-206', title: 'API Integration', storyPoints: 13, businessValue: 25, role: 'Developer', goal: 'Connect APIs', description: 'Third party API integration', acceptance: true, status: 'Sprint Ready' },
        { id: 'US-207', title: 'Search feature', storyPoints: 8, businessValue: 18, role: 'User', goal: 'Find content', description: 'Full text search', acceptance: true, status: 'Sprint Ready' },
        { id: 'US-208', title: 'Export data', storyPoints: null, businessValue: 12, role: 'Admin', goal: 'Export reports', description: '', acceptance: false, status: 'Needs Work' }
      ];
      setStories(sample);
      setLoading(false);
    }
    load();
  }, []);

  function assess(s) {
    const hasPoints = s.storyPoints !== null && s.storyPoints !== undefined;
    const hasBV = s.businessValue !== null && s.businessValue !== undefined;
    const hasRole = s.role && String(s.role).trim().length > 0;
    const hasGoal = s.goal && String(s.goal).trim().length > 0;
    const hasDescription = s.description && String(s.description).trim().length > 0;
    const hasAcceptance = !!s.acceptance;
    const ready = hasPoints && hasBV && hasRole && hasGoal && hasDescription && hasAcceptance;
    return { ready, hasPoints, hasBV, hasRole, hasGoal, hasDescription, hasAcceptance };
  }

  const augmented = stories.map(s => ({ ...s, _assess: assess(s) }));

  const counts = augmented.reduce((acc, s) => {
    if (s._assess.ready) acc.ready++;
    else acc.needs++;
    return acc;
  }, { ready: 0, needs: 0 });

  const total = counts.ready + counts.needs || 0;
  const readinessPct = total ? Math.round((counts.ready / total) * 100) : 0;

  const filtered = augmented.filter(s => {
    if (filterStatus === 'Sprint Ready' && !s._assess.ready) return false;
    if (filterStatus === 'Needs Work' && s._assess.ready) return false;
    if (query && !(`${s.title}`.toLowerCase().includes(query.toLowerCase()))) return false;
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / storiesPerPage);
  const startIndex = (currentPage - 1) * storiesPerPage;
  const paginatedStories = filtered.slice(startIndex, startIndex + storiesPerPage);

  // Reset to page 1 when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, query]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="sr-root">
      <h2>Sprint Readiness Checker</h2>

      <div className="sr-top">
        <div className="sr-boxes">
          <div className="sr-box sr-ready-box">
            <div className="sr-box-title">Complete</div>
            <div className="sr-box-count">{counts.ready}</div>
          </div>
          <div className="sr-box sr-needs-box">
            <div className="sr-box-title">Needs Work</div>
            <div className="sr-box-count">{counts.needs}</div>
          </div>
          <div className="sr-box sr-readiness-pct">
            <div className="sr-box-title">Readiness %</div>
            <div className="sr-box-count">{readinessPct}%</div>
            <div className="sr-readiness">
              <div className="sr-readiness-bar" style={{ width: `${readinessPct}%` }} />
            </div>
          </div>
        </div>
        <div className="sr-search">
          <input
            type="text"
            placeholder="Search stories by title..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="sr-filter sr-filter-below">
        <label>Filter by status</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="All">All stories</option>
          <option value="Sprint Ready">Complete</option>
          <option value="Needs Work">Needs Work</option>
        </select>
      </div>

      <div className="sr-assessment">
        <div className="sr-title-assessment">Sprint Readiness Assessment</div>
        <div className="sr-row sr-head">
          <div className="col story-col">Story</div>
          <div className="col points-col">Story Points</div>
          <div className="col bv-col">Business Value</div>
          <div className="col role-col">Role described</div>
          <div className="col goal-col">Goal defined</div>
          <div className="col desc-col">Description</div>
          <div className="col accept-col">Acceptance criteria</div>
          <div className="col status-col">Status</div>
        </div>

        {paginatedStories.map(s => (
          <div key={s.id} className="sr-row">
            <div className="col story-col">
              <div className="sr-id">{s.id}</div>
              <div className="sr-title">{s.title}</div>
            </div>
            <div className="col points-col">{s.storyPoints ?? '—'}</div>
            <div className="col bv-col">{s.businessValue ?? '—'}</div>
            <div className="col role-col">{s._assess.hasRole ? <span className="check">✔️</span> : <span className="cross">✖️</span>}</div>
            <div className="col goal-col">{s._assess.hasGoal ? <span className="check">✔️</span> : <span className="cross">✖️</span>}</div>
            <div className="col desc-col">{s._assess.hasDescription ? <span className="check">✔️</span> : <span className="cross">✖️</span>}</div>
            <div className="col accept-col">{s._assess.hasAcceptance ? <span className="check">✔️</span> : <span className="cross">✖️</span>}</div>
            <div className="col status-col">{s._assess.ready ? <span className="status-ready">Complete</span> : <span className="status-needs">Needs Work</span>}</div>
          </div>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="sr-pagination">
          <button
            className="sr-page-btn sr-page-arrow"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {getPageNumbers().map(page => (
            <button
              key={page}
              className={`sr-page-btn ${currentPage === page ? 'sr-page-active' : ''}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="sr-page-btn sr-page-arrow"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

export default SprintReadiness;
