import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function SistrawtsHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.admin === true || (user?.roles || []).includes("Admin");

  return (
    <div className="page-container">
      <div style={{ maxWidth: 980, margin: "24px auto" }}>
        <h1 style={{ margin: 0, color: "var(--color-text-main)" }}>Sistrawts</h1>
        <div style={{ marginTop: 6, color: "var(--color-text-label)", opacity: 0.9 }}>
          Sistema de gerenciamento de planos de acao
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/sistrawts/planos")}
            style={{
              textAlign: "left",
              padding: 20,
              borderRadius: 12,
              border: "1px solid var(--color-border-card)",
              background: "var(--color-bg-card)",
              color: "var(--color-text-main)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-2))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                }}
              >
                PA
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Planos de Acao</div>
                <div style={{ marginTop: 4, color: "var(--color-text-label)", fontSize: 12, opacity: 0.9 }}>
                  Crie e gerencie planos de acao
                </div>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate("/sistrawts/dashboard-indicadores")}
            style={{
              textAlign: "left",
              padding: 20,
              borderRadius: 12,
              border: "1px solid var(--color-border-card)",
              background: "var(--color-bg-card)",
              color: "var(--color-text-main)",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                }}
              >
                📊
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Dashboard Indicadores</div>
                <div style={{ marginTop: 4, color: "var(--color-text-label)", fontSize: 12, opacity: 0.9 }}>
                  Acompanhe metas e resultados
                </div>
              </div>
            </div>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate("/sistrawts/indicadores")}
              style={{
                textAlign: "left",
                padding: 20,
                borderRadius: 12,
                border: "1px solid var(--color-border-card)",
                background: "var(--color-bg-card)",
                color: "var(--color-text-main)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                  }}
                >
                  📈
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Gerenciar Indicadores</div>
                  <div style={{ marginTop: 4, color: "var(--color-text-label)", fontSize: 12, opacity: 0.9 }}>
                    Cadastre metas e categorias
                  </div>
                </div>
              </div>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => navigate("/admin-usuarios")}
              style={{
                textAlign: "left",
                padding: 20,
                borderRadius: 12,
                border: "1px solid var(--color-border-card)",
                background: "var(--color-bg-card)",
                color: "var(--color-text-main)",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #f59e0b, #d97706)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                  }}
                >
                  AD
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>Usuarios</div>
                  <div style={{ marginTop: 4, color: "var(--color-text-label)", fontSize: 12, opacity: 0.9 }}>
                    Gerencie usuarios e permissoes por modulo
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>

        <div style={{ marginTop: 32 }} className="card">
          <div className="card-title">Sobre o Sistrawts</div>
          <div style={{ lineHeight: 1.6, color: "var(--color-text-label)" }}>
            <p style={{ margin: "0 0 12px 0" }}>
              O <strong style={{ color: "var(--color-text-main)" }}>Sistrawts</strong> organiza planos de acao,
              trativas e micro acoes de forma centralizada.
            </p>

            <h4 style={{ margin: "16px 0 8px 0", color: "var(--color-text-main)" }}>Como funciona:</h4>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              <li>Admins criam planos e definem responsaveis.</li>
              <li>Micro acoes sao criadas dentro de um plano.</li>
              <li>A conclusao das micro acoes atualiza o percentual do plano.</li>
              <li>Responsaveis registram trativa e podem anexar comprovantes.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
