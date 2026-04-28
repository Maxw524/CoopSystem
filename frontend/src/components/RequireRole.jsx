import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { hasAnyRole } from "../utils/accessControl";

export default function RequireRole({ allowedRoles, redirectTo = "/renegociacao", children }) {
  const { user, checking } = useAuth();

  if (checking) return null;

  if (!hasAnyRole(user, allowedRoles)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
