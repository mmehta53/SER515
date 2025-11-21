import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showAddUserForm, setShowAddUserForm] = useState(false);

  const [newUser, setNewUser] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "pig",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [showMessageCard, setShowMessageCard] = useState(false);

  const [editingUser, setEditingUser] = useState(null);

  const navigate = useNavigate();

  // Check for admin login
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    fetchOrganizations();
  }, [navigate]);

  // Fetch organizations
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

  // Fetch users for selected org
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
      setShowAddUserForm(false);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Add user
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newUser, orgId: selectedOrg.id };
      await api.post(`/auth/register-user`, payload);

      setMessage("User added successfully!");
      setShowMessageCard(true);
      setTimeout(() => setShowMessageCard(false), 3000);

      fetchUsers(selectedOrg.id);
      setShowAddUserForm(false);

      setNewUser({
        email: "",
        firstName: "",
        lastName: "",
        role: "pig",
        password: "",
      });
    } catch (error) {
      setMessage("Error adding user. Please try again.");
      setShowMessageCard(true);
      setTimeout(() => setShowMessageCard(false), 3000);
      console.error("Add user error:", error);
    }
  };

  // Deactivate user
  const deactivateUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/deactivate`);

      setMessage("User deactivated successfully!");
      setShowMessageCard(true);
      setTimeout(() => setShowMessageCard(false), 3000);

      fetchUsers(selectedOrg.id);
    } catch (error) {
      setMessage("Error deactivating user.");
      setShowMessageCard(true);
      setTimeout(() => setShowMessageCard(false), 3000);
      console.error("Deactivate user error:", error);
    }
  };

  // Save edited user
  const handleEditUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        role: editingUser.role,
      };

      await api.put(`/admin/users/${editingUser.userId}`, payload);

      setMessage("User updated successfully!");
      setShowMessageCard(true);
      setTimeout(() => setShowMessageCard(false), 3000);

      setEditingUser(null);
      fetchUsers(selectedOrg.id);
    } catch (error) {
      setMessage("Error updating user.");
      setShowMessageCard(true);
      setTimeout(() => setShowMessageCard(false), 3000);
      console.error("Edit user error:", error);
    }
  };

  // Logout
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

      {/* Success / Error Message */}
      {showMessageCard && <div className="message-card">{message}</div>}

      {/* Organizations */}
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

      {/* Add User Form */}
      {selectedOrg && showAddUserForm && (
        <section className="add-user-form">
          <h3>Add New User</h3>
          <form onSubmit={handleAddUser}>
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

      {/* Edit User Popup */}
      {editingUser && (
        <div className="edit-popup">
          <div className="edit-popup-inner">
            <h3>Edit User</h3>
            <form onSubmit={handleEditUser}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  value={editingUser.firstName}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, firstName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  value={editingUser.lastName}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, lastName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value })
                  }
                >
                  <option value="pig">Pig</option>
                  <option value="chicken">Chicken</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button type="submit" className="add-btn">Save Changes</button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      {selectedOrg && (
        <section className="user-section">
          <div className="user-section-header">
            <h2>{selectedOrg.name} - Users</h2>

            <button
              className="new-user-btn"
              onClick={() => setShowAddUserForm(!showAddUserForm)}
            >
              + Add New User
            </button>
          </div>

          {selectedOrg.users && selectedOrg.users.length > 0 ? (
            <table className="user-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
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
                    <td>
                      {u.isActive && (
                      <button
                        className="edit-btn"
                        onClick={() => setEditingUser(u)}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      className="deactivate-btn"
                      disabled={!u.isActive}
                      onClick={() => deactivateUser(u.userId)}
                    >
                      {u.isActive ? "Deactivate" : "Deactivated"}
                    </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No users found for this organization.</p>
          )}
        </section>
      )}
    </div>
  );
}
