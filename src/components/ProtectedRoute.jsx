import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ role, allowedRoles, children }) {

  if (!role) {
    return <Navigate to="/" />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }

  return children;
}