import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

function resolveErrorMessage(error) {
  const status = error?.response?.status;

  if (status === 403) {
    return "Seu usuario nao possui permissao para acessar este dashboard.";
  }

  if (status === 404) {
    return "Dashboard nao encontrado ou ainda nao configurado.";
  }

  return "Nao foi possivel carregar o dashboard selecionado.";
}

export default function DashboardViewer() {
  const { slug } = useParams();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(`/dashboards/${slug}`);
        if (!ignore) {
          setDashboard(data);
        }
      } catch (err) {
        if (!ignore) {
          setDashboard(null);
          setError(resolveErrorMessage(err));
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
  }, [slug]);

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", margin: 0, padding: 0 }}>
      {/* Header compacto */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        gap: 12, 
        flexWrap: "wrap",
        padding: "12px 16px",
        background: "var(--color-surface-main)",
        borderBottom: "1px solid var(--color-border-card)",
        minHeight: "60px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link className="rn-button" to="/dashboards" style={{ padding: "6px 12px", fontSize: "14px" }}>
            Voltar
          </Link>
          <div>
            <h1 style={{ margin: 0, color: "var(--color-text-main)", fontSize: "18px", fontWeight: 600 }}>
              {dashboard?.collectionTitle || dashboard?.title || "Dashboard"}
            </h1>
            <div style={{ marginTop: 2, color: "var(--color-text-label)", opacity: 0.8, fontSize: "13px" }}>
              {dashboard?.description || "Visualizacao generica carregada a partir do catalogo dinamico."}
            </div>
          </div>
        </div>

        {dashboard?.embedUrl && (
          <a 
            className="rn-button primary" 
            href={dashboard.embedUrl} 
            target="_blank" 
            rel="noreferrer"
            style={{ padding: "6px 12px", fontSize: "14px" }}
          >
            Abrir em nova aba
          </a>
        )}
      </div>

      {/* Container do iframe que ocupa todo o espaço restante */}
      <div style={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column",
        overflow: "hidden",
        background: "#fff"
      }}>
        {loading && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            height: "100%",
            fontSize: "16px",
            color: "var(--color-text-label)"
          }}>
            Carregando dashboard...
          </div>
        )}

        {!loading && error && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            height: "100%",
            fontSize: "16px",
            color: "#b91c1c",
            padding: "20px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        {!loading && !error && dashboard && (
          <iframe
            key={dashboard.slug}
            src={dashboard.embedUrl}
            title={dashboard.title}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              background: "#fff",
              display: "block"
            }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}
      </div>
    </div>
  );
}
