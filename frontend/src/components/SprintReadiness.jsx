import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import api from '../utils/api';
import './SprintReadiness.css';

function SprintReadiness() {
  const [stories, setStories] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

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
              goal: s.goal || s.role || null,
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
        { id: 'US-201', title: 'OAuth login', storyPoints: 8, businessValue: 20, goal: 'Allow OAuth', acceptance: true, status: 'Sprint Ready' },
        { id: 'US-202', title: 'Project page', storyPoints: null, businessValue: 10, goal: '', acceptance: false, status: 'Needs Work' },
        { id: 'US-203', title: 'README template', storyPoints: 2, businessValue: null, goal: 'Provide README', acceptance: true, status: 'Needs Work' }
      ];
      setStories(sample);
      setLoading(false);
    }
    load();
  }, []);

  function assess(s) {
    const hasPoints = s.storyPoints !== null && s.storyPoints !== undefined;
    const hasBV = s.businessValue !== null && s.businessValue !== undefined;
    const hasGoal = s.goal && String(s.goal).trim().length > 0;
    const hasAcceptance = !!s.acceptance;
    const ready = hasPoints && hasBV && hasGoal && hasAcceptance;
    return { ready, hasPoints, hasBV, hasGoal, hasAcceptance };
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

  return (
    <div className="sr-root">
      <h2>Sprint Readiness Checker</h2>

      <div className="sr-top">
        <div className="sr-boxes">
          <div className="sr-box sr-ready-box">
            <div className="sr-box-title">Sprint Ready</div>
            <div className="sr-box-count">{counts.ready}</div>
          </div>
          <div className="sr-box sr-needs-box">
            <div className="sr-box-title">Needs Work</div>
            <div className="sr-box-count">{counts.needs}</div>
          </div>
          <div className="sr-box sr-readiness-pct">
            <div className="sr-box-title">Readiness %</div>
            <div className="sr-readiness">
              <div className="sr-readiness-bar" style={{ width: `${readinessPct}%` }} />
              <div className="sr-readiness-label">{readinessPct}%</div>
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
          <option value="Sprint Ready">Sprint Ready</option>
          <option value="Needs Work">Needs Work</option>
        </select>
      </div>

      <div className="sr-assessment">
        <div className="sr-title-assessment">Sprint Readiness Assessment</div>
        <div className="sr-row sr-head">
          <div className="col story-col">Story</div>
          <div className="col points-col">Story Points</div>
          <div className="col bv-col">Business Value</div>
          <div className="col goal-col">Goal defined</div>
          <div className="col accept-col">Acceptance criteria</div>
          <div className="col status-col">Status</div>
        </div>

        {filtered.map(s => (
          <div key={s.id} className="sr-row">
            <div className="col story-col">
              <div className="sr-id">{s.id}</div>
              <div className="sr-title">{s.title}</div>
            </div>
            <div className="col points-col">{s.storyPoints ?? '—'}</div>
            <div className="col bv-col">{s.businessValue ?? '—'}</div>
            <div className="col goal-col">{s._assess.hasGoal ? <span className="check">✔️</span> : <span className="cross">✖️</span>}</div>
            <div className="col accept-col">{s._assess.hasAcceptance ? <span className="check">✔️</span> : <span className="cross">✖️</span>}</div>
            <div className="col status-col">{s._assess.ready ? <span className="status-ready">Sprint Ready</span> : <span className="status-needs">Needs Work</span>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SprintReadiness;
