import { Navigate } from 'react-router-dom';

// PrivateRoute: Redirect to dashboard if user is authenticated, otherwise show login
export const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // If there's no token, allow access to login page
  if (!token) {
    return children;
  }
  
  // If user is logged in, redirect to appropriate dashboard based on role
  if (user.role === 'admin') {
    return <Navigate to="/admin" />;
  } else if (user.role === 'user') {
    return <Navigate to="/user" />;
  } else {
    return <Navigate to="/dashboard" />;
  }
};

// AuthRoute: Redirect to login if user is not authenticated
export const AuthRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" />;
  }
  
  return children;
};