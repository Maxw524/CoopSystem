import { Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "./Sidebar";

const THEME_STORAGE_KEY = "coopsystem-theme";

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  function onLogout() {
    logout(true);
    navigate("/login", { replace: true });
  }

  const displayName = useMemo(() => {
    if (typeof user === "string") return user;

    return (
      user?.nomeCompleto ||
      user?.nome ||
      user?.username ||
      user?.usuario ||
      user?.user ||
      user?.login ||
      "Usuario"
    );
  }, [user]);

  const displaySetor = useMemo(() => {
    if (!user?.setor || user.setor === "Não definido" || user.setor === "") return "";
    return user.setor;
  }, [user]);

  return (
    <div className="app">
      <Sidebar isOpen={sidebarOpen} />

      <div className={`app-main ${!sidebarOpen ? "expanded" : ""}`}>
        <header className="app-header">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            title="Mostrar ou ocultar menu"
            type="button"
          >
            Menu
          </button>

          <nav className="app-nav">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              title="Alternar tema"
            >
              <span className="theme-toggle__dot" aria-hidden="true" />
              <span className="theme-toggle__text">
                {theme === "dark" ? "Tema claro" : "Tema escuro"}
              </span>
            </button>

            <button
              type="button"
              className="rn-chip"
              onClick={() => navigate("/trocar-senha")}
              title="Trocar senha"
              style={{
                padding: "8px 14px",
                fontSize: "13px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 2,
                cursor: "pointer",
                outline: "none",
              }}
            >
              <span style={{ fontWeight: "500" }}>{displayName}</span>
              {displaySetor && (
                <span style={{ 
                  fontSize: "11px", 
                  opacity: 0.8,
                  fontWeight: "400"
                }}>
                  {displaySetor}
                </span>
              )}
            </button>

            <button
              type="button"
              className="rn-button warn"
              style={{ padding: "8px 16px", fontSize: "13px" }}
              onClick={onLogout}
            >
              Sair
            </button>
          </nav>
        </header>

        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
