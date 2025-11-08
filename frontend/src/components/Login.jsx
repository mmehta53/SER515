import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Send credentials so backend can set cookies (JWT in cookies)
      const response = await axios.post(
        "http://127.0.0.1:5000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      // Backend currently sets JWTs as cookies and returns a `user` object in the JSON body
      // Adapt to both possibilities (token may or may not be returned)
      const { token, user } = response.data || {};
      const roleFromResp = (user && user.role) || (response.data && response.data.role) || null;

      if (token) {
        // if backend returns a token in the body, store it
        localStorage.setItem("token", token);
      }
      if (roleFromResp) {
        localStorage.setItem("role", roleFromResp);
      }

      // Redirect based on role
      if (roleFromResp === "admin") navigate("/admin");
      else if (roleFromResp === "user") navigate("/user");
      else navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-96">
        <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-all"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
