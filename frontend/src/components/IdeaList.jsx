import React, { useEffect, useState } from "react";
import api from "../utils/api";

export default function IdeaList() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/ideas");
      setIdeas(res.data || []);
    } catch (err) {
      console.error("Failed to load ideas", err);
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div>Loading ideas...</div>;
  return (
    <div>
      <h4>Ideas</h4>
      {ideas.length === 0 && <div>No ideas yet</div>}
      {ideas.map(i => (
        <div key={i.id} style={{ border: "1px solid #eee", padding: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{i.title}</strong>
            <small>{i.priority}</small>
          </div>
          <div style={{ marginTop: 6 }}>{i.description}</div>
          <div style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
            Org: {i.organization_name || i.organization || "—"} • Status: {i.status} • Created: {new Date(i.createdAt).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}
