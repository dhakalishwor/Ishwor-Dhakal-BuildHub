import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('accessToken');
  const role = localStorage.getItem('role');
  const location = useLocation();

  if (!token) {
    // Redirect to login if unauthenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If specific roles are required and user's role is not in the list
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Route them based on their actual role if known
    if (role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'client') return <Navigate to="/clientdashboard" replace />;
    if (role === 'contractor') return <Navigate to="/contractor" replace />;
    if (role === 'worker') return <Navigate to="/worker/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  // Renders the matched child route
  return <Outlet />;
};

export default ProtectedRoute;
