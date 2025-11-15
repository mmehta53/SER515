import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Project from "./components/Project";
import { PrivateRoute, AuthRoute } from "./components/PrivateRoute";
import AdminDashboard from "./components/AdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Login route - protected from authenticated users */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Login />
            </PrivateRoute>
          } 
        />
        {/* Login route - protected from authenticated users */}
        <Route 
          path="/admindashboard" 
          element={
            <AuthRoute>
              <AdminDashboard/>
            </AuthRoute>
          } 
          />
        {/* Protected routes - require authentication */}
        {/* <Route 
          path="/admin" 
          element={
            <AuthRoute>
              <Dashboard />
            </AuthRoute>
          } 
        /> */}
        <Route 
          path="/user" 
          element={
            <AuthRoute>
              <Dashboard />
            </AuthRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <AuthRoute>
              <Dashboard />
            </AuthRoute>
          } 
        />
        <Route 
          path="/project" 
          element={
            <AuthRoute>
              <Project />
            </AuthRoute>
          } 
        />

        {/* Catch all other routes and redirect to dashboard if authenticated, login if not */}
        <Route 
          path="*" 
          element={
            localStorage.getItem('token') 
              ? <Navigate to="/dashboard" /> 
              : <Navigate to="/" />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
