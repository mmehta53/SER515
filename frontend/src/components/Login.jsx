import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import "./Login.css"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await api.post('/auth/login', { email, password });

      const { user } = response.data;
      
      if (user) {
        console.log("User logged in:", user);
        // Store user info and token in localStorage
        localStorage.setItem("user", JSON.stringify({
          userId: user.userId,
          email: user.email,
          role: user.role,
          orgId: user.orgId
        }));
        
        if (user.token) {
          localStorage.setItem("token", user.token);
        }
        
        // Token will be automatically handled by api.js interceptor
      }

      const roleFromResp = (user && user.role) || (response.data && response.data.role) || null;

      // Redirect based on role
      if (roleFromResp === "admin") navigate("/admindashboard");
      else if (roleFromResp === "user") navigate("/user");
      else navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-heading">
          Welcome Back 👋
        </h2>

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
          >
            Login
          </button>
        </form>

        <p className="login-footer">
          Don't have an account?{" "}
          <a href="/register" className="signup-link">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
