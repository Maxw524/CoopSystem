import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function DashboardsHome() {
  const [dashboards, setDashboards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const dashboardCollections = useMemo(() => {
    const collections = new Map();

    dashboards.forEach((dashboard) => {
      const collectionSlug = dashboard.collectionSlug || dashboard.slug;
      const collectionTitle = dashboard.collectionTitle || dashboard.title;

      if (!collections.has(collectionSlug)) {
        collections.set(collectionSlug, {
          slug: collectionSlug,
          title: collectionTitle,
          group: dashboard.group || "Dashboards",
          permissionKey: dashboard.permissionKey,
          description: dashboard.description || "Dashboard sem descricao cadastrada.",
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

    async function load() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/dashboards");

        if (!ignore) {
          setDashboards(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!ignore) {
          setDashboards([]);
          setError("Nao foi possivel carregar os dashboards liberados para o seu usuario.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--color-text-main)" }}>Dashboards</h1>
          <div style={{ marginTop: 6, color: "var(--color-text-label)", opacity: 0.9 }}>
            Catalogo dinamico carregado do servidor. Novos arquivos Python aparecem aqui sem alterar o React.
          </div>
        </div>
      </div>

      {loading && (
        <div className="card" style={{ marginTop: 16 }}>
          Carregando dashboards...
        </div>
      )}

      {!loading && error && (
        <div className="card" style={{ marginTop: 16, color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {!loading && !error && dashboards.length === 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          Nenhum dashboard dinamico foi liberado para o seu usuario.
        </div>
      )}

      {!loading && !error && dashboards.length > 0 && (
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 14,
          }}
        >
          {dashboardCollections.map((collection) => (
            <Link
              key={collection.slug}
              to={`/dashboards/${collection.entrySlug}`}
              className="card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="card-title">{collection.title}</div>
              <div style={{ marginTop: 8, fontSize: 12, color: "var(--color-text-label)" }}>
                {collection.group}
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: "var(--color-text-main)", opacity: 0.9 }}>
                {collection.description}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--color-text-label)" }}>
                Permissao da colecao: <b style={{ color: "var(--color-text-main)" }}>{collection.permissionKey}</b>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
