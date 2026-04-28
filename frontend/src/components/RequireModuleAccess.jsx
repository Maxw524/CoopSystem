import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { canAccessModule } from "../utils/accessControl";

export default function RequireModuleAccess({ moduleKey, redirectTo = "/inicio", children }) {
  const { user, checking } = useAuth();

  if (checking) return null;

  if (!canAccessModule(user, moduleKey)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
