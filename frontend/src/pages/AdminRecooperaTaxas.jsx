import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { setMatrizTaxasCampanha, getMatrizTaxasCampanha } from "../utils/taxasCampanha";

const KEYS = [
  "FAIXA_30|CURTO|SEM_REFORCO",
  "FAIXA_30|CURTO|AVAL",
  "FAIXA_30|CURTO|REAL",
  "FAIXA_30|LONGO|SEM_REFORCO",
  "FAIXA_30|LONGO|AVAL",
  "FAIXA_30|LONGO|REAL",
  "FAIXA_20|CURTO|SEM_REFORCO",
  "FAIXA_20|CURTO|AVAL",
  "FAIXA_20|CURTO|REAL",
  "FAIXA_20|LONGO|SEM_REFORCO",
  "FAIXA_20|LONGO|AVAL",
  "FAIXA_20|LONGO|REAL",
  "FAIXA_10|CURTO|SEM_REFORCO",
  "FAIXA_10|CURTO|AVAL",
  "FAIXA_10|CURTO|REAL",
  "FAIXA_10|LONGO|SEM_REFORCO",
  "FAIXA_10|LONGO|AVAL",
  "FAIXA_10|LONGO|REAL",
];

function labelKey(k) {
  const [faixa, prazo, reforco] = k.split("|");
  const faixaLabel = faixa === "FAIXA_30" ? "≥ 30%" : faixa === "FAIXA_20" ? "20–29,99%" : "10–19,99%";
  const prazoLabel = prazo === "CURTO" ? "≤ 24m" : "> 24m";
  const reforcoLabel = reforco === "SEM_REFORCO" ? "Sem Reforço" : reforco === "AVAL" ? "Aval" : "Real";
  return `${faixaLabel} • ${prazoLabel} • ${reforcoLabel}`;
}

export default function AdminRecooperaTaxas() {
  const [taxas, setTaxas] = useState(() => getMatrizTaxasCampanha());
  const [loadingTaxas, setLoadingTaxas] = useState(false);

  async function loadTaxas() {
    setLoadingTaxas(true);
    try {
      const { data } = await api.get("/config/taxas-campanha");
      setTaxas(data);
      setMatrizTaxasCampanha(data);
    } finally {
      setLoadingTaxas(false);
    }
  }

  async function saveTaxas() {
    await api.put("/admin/taxas-campanha", taxas);
    setMatrizTaxasCampanha(taxas);
    alert("Taxas salvas!");
  }

  function setTaxaValue(key, value) {
    const n = Number(value);
    setTaxas((prev) => ({ ...prev, [key]: Number.isFinite(n) ? n : prev[key] }));
  }

  useEffect(() => {
    loadTaxas();
  }, []);

  const taxaRows = useMemo(
    () =>
      KEYS.map((k) => ({
        key: k,
        label: labelKey(k),
        value: taxas?.[k] ?? "",
      })),
    [taxas]
  );

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--color-text-main)" }}>Recoopera Taxas</h1>
          <div style={{ marginTop: 6, color: "var(--color-text-label)", opacity: 0.85 }}>
            Definição da matriz de taxas do Recoopera
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="rn-button" type="button" onClick={loadTaxas} disabled={loadingTaxas}>
            {loadingTaxas ? "Carregando..." : "Recarregar"}
          </button>
          <button className="rn-button primary" type="button" onClick={saveTaxas}>
            Salvar taxas
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div style={{ marginBottom: 12, opacity: 0.9 }}>
          Dica: altere os valores e clique em <b>Salvar taxas</b>. O front passa a usar a matriz nova automaticamente.
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {taxaRows.map((row) => (
            <label
              key={row.key}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 140px",
                gap: 10,
                alignItems: "center",
              }}
            >
              <span style={{ color: "var(--color-text-main)" }}>{row.label}</span>
              <input
                value={row.value}
                onChange={(e) => setTaxaValue(row.key, e.target.value)}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--color-border-input)", background: "var(--color-bg-input)", color: "var(--color-text-main)" }}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
