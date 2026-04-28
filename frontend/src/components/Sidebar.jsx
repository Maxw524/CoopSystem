import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { canAccessModule, hasAnyRole } from "../utils/accessControl";

export default function Sidebar({ isOpen = true }) {
  const { user } = useAuth();
  const [dashboards, setDashboards] = useState([]);

  const canSeeAdmin = hasAnyRole(user, ["Admin"]);
  const canSeeJuridico = canAccessModule(user, "juridico");
  const canSeeSistrawts = canAccessModule(user, "sistrawts");
  const canSeeCreditoSimulador = canAccessModule(user, "simuladorTaxa");
  const dashboardCollections = useMemo(() => {
    const collections = new Map();

    dashboards.forEach((dashboard) => {
      const collectionSlug = dashboard.collectionSlug || dashboard.slug;
      const collectionTitle = dashboard.collectionTitle || dashboard.title;

      if (!collections.has(collectionSlug)) {
        collections.set(collectionSlug, {
          slug: collectionSlug,
          title: collectionTitle,
          entrySlug: dashboard.slug,
        });
      }

      if (dashboard.pageOrder === 0 || dashboard.slug === collectionSlug) {
        collections.get(collectionSlug).entrySlug = dashboard.slug;
      }
    });

    return Array.from(collections.values());
  }, [dashboards]);

  useEffect(() => {
    let ignore = false;

    async function loadDashboards() {
      if (!user) {
        setDashboards([]);
        return;
      }

      try {
        const { data } = await api.get("/dashboards");
        if (!ignore) {
          setDashboards(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!ignore) {
          setDashboards([]);
        }

        console.warn("[Dashboards] Falha ao carregar o menu dinamico.", error);
      }
    }

    loadDashboards();

    return () => {
      ignore = true;
    };
  }, [user]);

  return (
    <aside className={`app-sidebar ${!isOpen ? "collapsed" : ""}`}>
      <div className="app-sidebar-header">
        <NavLink to="/" className="app-sidebar-logo-link">
          <img src="/Designer.png" alt="CoopSystem" />
        </NavLink>
      </div>

      <div className="app-sidebar-menu">
        <div className="app-sidebar-section">Renegociacao / Cobranca</div>

        <NavLink
          to="/renegociacao"
          className={({ isActive }) => (isActive ? "active app-sidebar-subitem" : "app-sidebar-subitem")}
        >
          Recoopera
        </NavLink>

        {canSeeJuridico && (
          <NavLink
            to="/juridico"
            className={({ isActive }) => (isActive ? "active app-sidebar-subitem" : "app-sidebar-subitem")}
          >
            Juridico
          </NavLink>
        )}

        {canSeeSistrawts && (
          <>
            <div className="app-sidebar-section">Sistratws</div>

            <NavLink
              to="/sistrawts/planos"
              className={({ isActive }) => (isActive ? "active app-sidebar-subitem" : "app-sidebar-subitem")}
            >
              Planos de Acao
            </NavLink>

            <NavLink
              to="/sistrawts/indicadores"
              className={({ isActive }) => (isActive ? "active app-sidebar-subitem" : "app-sidebar-subitem")}
            >
              Indicadores
            </NavLink>
          </>
        )}

        <div className="app-sidebar-section">Credito / Cadastro</div>

        {canSeeCreditoSimulador && (
          <NavLink
            to="/credito-simulador-taxa"
            className={({ isActive }) => (isActive ? "active app-sidebar-subitem" : "app-sidebar-subitem")}
          >
            Simulador de Taxa
          </NavLink>
        )}

        <NavLink
          to="/credito-checklist-cadastro"
          className={({ isActive }) => (isActive ? "active app-sidebar-subitem" : "app-sidebar-subitem")}
        >
          Check List Cadastro
        </NavLink>

        {dashboards.length > 0 && <div className="app-sidebar-section">Dashboards</div>}

        {dashboards.length > 0 && (
          <NavLink
            to="/dashboards"
            end
            className={({ isActive }) => (isActive ? "active app-sidebar-subitem" : "app-sidebar-subitem")}
          >
            Catalogo
          </NavLink>
        )}

        {dashboardCollections.map((collection) => (
          <NavLink
            key={collection.slug}
            to={`/dashboards/${collection.entrySlug}`}
            className={({ isActive }) => (isActive ? "active app-sidebar-subitem" : "app-sidebar-subitem")}
          >
            {collection.title}
          </NavLink>
        ))}

        {canSeeAdmin && <div className="app-sidebar-section">Admin</div>}

        {canSeeAdmin && (
          <NavLink
            to="/admin-usuarios"
            className={({ isActive }) => (isActive ? "active app-sidebar-subitem" : "app-sidebar-subitem")}
          >
            Usuarios
          </NavLink>
        )}

        {canSeeAdmin && (
          <NavLink
            to="/admin-setores"
            className={({ isActive }) => (isActive ? "active app-sidebar-subitem" : "app-sidebar-subitem")}
          >
            Setores
          </NavLink>
        )}

        {canSeeAdmin && (
          <NavLink
            to="/admin-recoopera-taxas"
            className={({ isActive }) => (isActive ? "active app-sidebar-subitem" : "app-sidebar-subitem")}
          >
            Recoopera Taxas
          </NavLink>
        )}
      </div>
    </aside>
  );
}
