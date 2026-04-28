import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Sistemas() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(() => localStorage.getItem("selectedSystem") || "");

  useEffect(() => {
    if (selected) {
      localStorage.setItem("selectedSystem", selected);
    } else {
      localStorage.removeItem("selectedSystem");
    }
  }, [selected]);

  function selectRecoopera() {
    setSelected("recoopera");
    navigate("/renegociacao", { replace: true });
  }

  function selectSistrawts() {
    setSelected("sistrawts");
    navigate("/sistrawts/planos", { replace: true });
  }

  return (
    <div className="page-container">
      <div style={{ maxWidth: 980, margin: "24px auto" }}>
        <h1 style={{ margin: 0, color: "var(--text)" }}>Selecione o sistema</h1>
        <div style={{ marginTop: 14, color: "var(--muted)" }}>
          Escolha qual sistema deseja acessar.
        </div>

        <div
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={selectRecoopera}
            style={{
              textAlign: "left",
              padding: 16,
              borderRadius: 12,
              border: "1px solid var(--color-border-card)",
              background: "var(--color-bg-card)",
              color: "var(--color-text-main)",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 16 }}>Recoopera</div>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
              Renegociação / Cobrança e módulos relacionados
            </div>
          </button>

          <button
            type="button"
            onClick={selectSistrawts}
            style={{
              textAlign: "left",
              padding: 16,
              borderRadius: 12,
              border: "1px solid var(--color-border-card)",
              background: "var(--color-bg-card)",
              color: "var(--color-text-main)",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 16 }}>Sistrawts</div>
            <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 12 }}>
              Sistema de Gerenciamento de Planos de Ação
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
