import { useMemo, useState } from "react";

const TABS = [
  { key: "checklist", label: "Check List Cadastro" },
  { key: "simulador", label: "Simulador de taxa e Juros" },
];

export default function CreditoCadastro() {
  const [tab, setTab] = useState("checklist");

  const active = useMemo(() => TABS.find((t) => t.key === tab) || TABS[0], [tab]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--text)" }}>Crédito / Cadastro</h1>
          <div style={{ marginTop: 6, color: "var(--muted)" }}>Módulo de apoio ao cadastro e simulações</div>
        </div>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>Aba: <b style={{ color: "var(--text)" }}>{active.label}</b></div>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={tab === t.key ? "rn-button primary" : "rn-button"}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        style={{
          marginTop: 14,
          padding: 16,
          borderRadius: 12,
          border: "1px solid var(--color-border-card)",
          background: "var(--color-bg-card)",
          color: "var(--color-text-main)",
        }}
      >
        {tab === "checklist" && (
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Check List Cadastro</div>
            <div style={{ color: "var(--muted)" }}>
              Placeholder: aqui entram os itens de checklist do cadastro.
            </div>
          </div>
        )}

        {tab === "simulador" && (
          <div>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Simulador de taxa e Juros</div>
            <div style={{ color: "var(--muted)" }}>
              Placeholder: aqui entra o simulador (taxa/juros) do módulo de crédito.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
