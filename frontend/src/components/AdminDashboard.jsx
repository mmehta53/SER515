import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import { FiEdit } from "react-icons/fi";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [showAddOrgPopup, setShowAddOrgPopup] = useState(false);
  const [showEditOrgPopup, setShowEditOrgPopup] = useState(false);

  const [newOrg, setNewOrg] = useState({ name: "", description: "" });
  const [editOrg, setEditOrg] = useState({ id: "", name: "", description: "" });

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

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
      navigate("/login");
      return;
    }
    fetchOrganizations();
  }, [navigate]);

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

  // CREATE ORGANIZATION
  const handleAddOrganization = async () => {
    try {
      const response = await api.post("/admin/organizations", {
        name: newOrg.name,
        description: newOrg.description,
      });

      const createdOrg = response.data.organization;
      setOrganizations([...organizations, createdOrg]);

      setShowAddOrgPopup(false);
      setNewOrg({ name: "", description: "" });

      showMessage("Organization added successfully!");
    } catch (error) {
      showMessage(error.response?.data?.error || "Error adding organization");
    }
  };

  // UPDATE ORGANIZATION
  const handleEditOrganization = async () => {
    try {
      const response = await api.put(`/admin/organizations/${editOrg.id}`, {
        name: editOrg.name,
        description: editOrg.description,
      });

      const updatedOrg = response.data.organization;

      setOrganizations((prev) =>
        prev.map((org) => (org.id === updatedOrg.id ? updatedOrg : org))
      );

      setShowEditOrgPopup(false);
      showMessage("Organization updated successfully!");
    } catch (error) {
      showMessage(error.response?.data?.error || "Error updating organization");
    }
  };

  // DEACTIVATE ORGANIZATION
  const handleDeactivateOrganization = async (orgId) => {
    if (!window.confirm("Are you sure you want to deactivate this organization?"))
      return;

    try {
      await api.put(`/admin/organizations/${orgId}/deactivate`);

      setOrganizations((prev) => prev.filter((o) => o.id !== orgId));
      if (selectedOrg?.id === orgId) setSelectedOrg(null);

      showMessage("Organization deactivated successfully!");
    } catch (error) {
      showMessage(error.response?.data?.error || "Error deactivating organization");
    }
  };

  // FETCH USERS FOR SELECTED ORG
  const fetchUsers = async (orgId) => {
    try {
      const response = await api.get(`/admin/organizations/${orgId}/users`);
      const users = response.data?.users || [];
      const org = organizations.find((o) => o.id === orgId);

      setSelectedOrg({
        id: orgId,
        name: org?.name || "Organization",
        users,
      });

      setShowAddUserForm(false);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // ADD USER
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newUser, orgId: selectedOrg.id };
      await api.post("/auth/register-user", payload);

      showMessage("User added successfully!");
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
      showMessage(error.response?.data?.error || "Error adding user");
    }
  };

  // DEACTIVATE USER
  const deactivateUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/deactivate`);
      showMessage("User deactivated successfully!");
      fetchUsers(selectedOrg.id);
    } catch (error) {
      showMessage("Error deactivating user");
    }
  };

  // UPDATE USER
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

      showMessage("User updated successfully!");
      setEditingUser(null);
      fetchUsers(selectedOrg.id);
    } catch (error) {
      showMessage("Error updating user");
    }
  };

  // MESSAGE HANDLER
  const showMessage = (msg) => {
    setMessage(msg);
    setShowMessageCard(true);
    setTimeout(() => setShowMessageCard(false), 3000);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {showMessageCard && <div className="message-card">{message}</div>}

      {/* ORGANIZATIONS SECTION */}
      <section className="organizations-section">
        <div className="org-header">
          <h2>Organizations</h2>
          <button className="add-org-btn" onClick={() => setShowAddOrgPopup(true)}>
            + Add Organization
          </button>
        </div>

        <div className="org-list">
          {organizations.length > 0 ? (
            organizations.map((org) => (
              <div key={org.id} className="org-card">
                <div className="org-info" onClick={() => fetchUsers(org.id)}>
                  <strong>{org.name}</strong>
                  <p>{org.description}</p>
                </div>

                <div className="org-actions">
                  <button
                    className="icon-btn edit-btn"
                    onClick={() => {
                      setEditOrg(org);
                      setShowEditOrgPopup(true);
                    }}
                  >
                    <FiEdit size={17} />
                  </button>

                  <button
                    className="deactivate-btn"
                    onClick={() => handleDeactivateOrganization(org.id)}
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No organizations available.</p>
          )}
        </div>
      </section>

      {/* ADD ORG POPUP */}
      {showAddOrgPopup && (
        <div className="edit-popup">
          <div className="edit-popup-inner">
            <h3>Add Organization</h3>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={newOrg.name}
                onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={newOrg.description}
                onChange={(e) =>
                  setNewOrg({ ...newOrg, description: e.target.value })
                }
              />
            </div>

            <button className="add-btn" onClick={handleAddOrganization}>
              Add
            </button>
            <button className="cancel-btn" onClick={() => setShowAddOrgPopup(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* EDIT ORG POPUP */}
      {showEditOrgPopup && (
        <div className="edit-popup">
          <div className="edit-popup-inner">
            <h3>Edit Organization</h3>

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={editOrg.name}
                onChange={(e) =>
                  setEditOrg({ ...editOrg, name: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                value={editOrg.description}
                onChange={(e) =>
                  setEditOrg({ ...editOrg, description: e.target.value })
                }
              />
            </div>

            <button className="add-btn" onClick={handleEditOrganization}>
              Save Changes
            </button>
            <button className="cancel-btn" onClick={() => setShowEditOrgPopup(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* USERS SECTION */}
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

        {/* 🔼 Add User Form moved ABOVE the table */}
        {showAddUserForm && (
          <div className="add-user-form">
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
                  <option value="admin">Admin</option>
                </select>
              </div>

              <button type="submit" className="add-btn">Add User</button>
              <button
                type="button"
                className="cancel-btn"
                onClick={() => setShowAddUserForm(false)}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

        {/* 🔽 Table stays BELOW the add user form */}
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
                  <td>{u.firstName} {u.lastName}</td>
                  <td>{u.role}</td>
                  <td>{u.isActive ? "Active" : "Inactive"}</td>
                  <td>
                    {u.isActive && (
                      <button className="edit-btn" onClick={() => setEditingUser(u)}>
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

      {/* EDIT USER POPUP */}
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
    </div>
  );
}
