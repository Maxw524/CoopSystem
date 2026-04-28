import { Navigate } from "react-router-dom";

export default function RequireSystem({ systemKey, children }) {
  const selected = localStorage.getItem("selectedSystem");

  if (selected !== systemKey) {
    return <Navigate to="/sistemas" replace />;
  }

  return children;
}
