// frontend/src/components/IdeaForm.jsx
import React, { useState, useEffect } from "react";
import api from "../utils/api";

export default function IdeaForm({ onCreated }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [orgs, setOrgs] = useState([]);
  const [organizationId, setOrganizationId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {

    api.get("/projects")   
      .then(res => {
        // if your projects endpoint returns orgs/projects list, adapt accordingly
        setOrgs(res.data || []);
        if (res.data && res.data.length > 0) setOrganizationId(res.data[0].id || "");
      }).catch(err => {
        console.error("Failed to load organizations/projects", err);
        setOrgs([]);
      });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!organizationId) {
      setMessage("Please select an organization.");
      return;
    }
    try {
      const payload = {
        title,
        description,
        priority,
        organization_id: organizationId
      };
      const res = await api.post("/ideas", payload);
      setMessage("Idea created successfully.");
      setTitle(""); setDescription(""); setPriority("medium");
      onCreated && onCreated();
    } catch (err) {
      console.error(err);
      const body = err.response?.data || err;
      setMessage("Error: " + (body?.errors ? body.errors.join(", ") : JSON.stringify(body)));
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
      <h4>Create Idea</h4>
      <form onSubmit={submit}>
        <div>
          <label>Title</label><br />
          <input value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%" }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Description</label><br />
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} style={{ width: "100%" }} />
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Organization</label><br />
          <select value={organizationId} onChange={e => setOrganizationId(e.target.value)} style={{ width: "100%" }}>
            <option value="">-- select organization --</option>
            {orgs.map(o => <option key={o.id} value={o.id}>{o.name || o.title || o.id}</option>)}
          </select>
        </div>
        <div style={{ marginTop: 8 }}>
          <label>Priority</label><br />
          <select value={priority} onChange={e => setPriority(e.target.value)}>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </select>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">Create Idea</button>
        </div>
      </form>
      {message && <div style={{ marginTop: 8 }}>{message}</div>}
    </div>
  );
}
