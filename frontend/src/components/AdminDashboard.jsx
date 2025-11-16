import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "pig",
    password: "",
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // ✅ Check for admin login
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    fetchOrganizations();
  }, [navigate]);

  // ✅ Fetch organizations
  const fetchOrganizations = async () => {
    try {
      const response = await api.get("/admin/organizations");
      if (response.data && response.data.organizations) {
        setOrganizations(response.data.organizations);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  // ✅ Fetch users for selected org
  const fetchUsers = async (orgId) => {
    try {
      const response = await api.get(`/admin/organizations/${orgId}/users`);
      const users = response.data?.users || [];
      const org = organizations.find((o) => o.id === orgId);
      setSelectedOrg({
        id: orgId,
        name: org?.name || "Organization",
        users: users,
      });
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // ✅ Add user (auto-include orgId)
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newUser,
        orgId: selectedOrg.id,
      };
      await api.post(`/auth/register-user`, payload);
      setMessage("✅ User added successfully!");
      fetchUsers(selectedOrg.id);
      setNewUser({
        email: "",
        firstName: "",
        lastName: "",
        role: "pig",
        password: "",
      });
    } catch (error) {
      setMessage("❌ Error adding user. Please try again.");
      console.error("Add user error:", error);
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {/* Organizations Section */}
      <section className="organizations-section">
        <h2>Organizations</h2>
        <div className="org-list">
          {organizations.length > 0 ? (
            organizations.map((org) => (
              <div
                key={org.id}
                className="org-card"
                onClick={() => fetchUsers(org.id)}
              >
                <strong>{org.name}</strong>
                <p>{org.description}</p>
              </div>
            ))
          ) : (
            <p>No organizations available.</p>
          )}
        </div>
      </section>

      {/* Users Section */}
      {selectedOrg && (
        <section className="user-section">
          <h2>{selectedOrg.name} - Users</h2>

          {selectedOrg.users && selectedOrg.users.length > 0 ? (
            <table className="user-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrg.users.map((u) => (
                  <tr key={u.userId}>
                    <td>{u.email}</td>
                    <td>
                      {u.firstName} {u.lastName}
                    </td>
                    <td>{u.role}</td>
                    <td>{u.isActive ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No users found for this organization.</p>
          )}

          {/* Add User Form */}
          <form onSubmit={handleAddUser} className="add-user-form">
            <h3>Add New User</h3>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                value={newUser.firstName}
                onChange={(e) =>
                  setNewUser({ ...newUser, firstName: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                value={newUser.lastName}
                onChange={(e) =>
                  setNewUser({ ...newUser, lastName: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
              >
                <option value="pig">Pig</option>
                <option value="chicken">Chicken</option>
              </select>
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
            </div>

            <button type="submit" className="add-btn">
              Add User
            </button>
          </form>
        </section>
      )}

      {message && <p className="status-msg">{message}</p>}
    </div>
  );
}
