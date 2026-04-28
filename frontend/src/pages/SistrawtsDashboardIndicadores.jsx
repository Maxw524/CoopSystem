import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function SistrawtsDashboardIndicadores() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndicador, setSelectedIndicador] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedAno, setSelectedAno] = useState(new Date().getFullYear());
  const [selectedMes, setSelectedMes] = useState(new Date().getMonth() + 1);

  // Form para resultado
  const [resultadoForm, setResultadoForm] = useState({
    indicadorId: "",
    ano: selectedAno,
    mes: selectedMes,
    valorResultado: ""
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await api.get("/indicador/dashboard");
      setDashboardData(response.data);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const openResultModal = (indicador) => {
    setSelectedIndicador(indicador);
    setResultadoForm({
      indicadorId: indicador.id,
      ano: selectedAno,
      mes: selectedMes,
      valorResultado: ""
    });
    setShowResultModal(true);
  };

  const saveResultado = async () => {
    try {
      await api.post(`/indicador/${resultadoForm.indicadorId}/resultados`, resultadoForm);
      setShowResultModal(false);
      loadDashboard();
    } catch (error) {
      console.error("Erro ao salvar resultado:", error);
      alert("Erro ao salvar resultado");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Excelente": return "#22c55e";
      case "Bom": return "#eab308";
      case "Regular": return "#f97316";
      case "Ruim": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getProgressColor = (percentual) => {
    if (percentual >= 90) return "#22c55e";
    if (percentual >= 75) return "#eab308";
    if (percentual >= 60) return "#f97316";
    return "#ef4444";
  };

  const formatarValor = (valor, ehPercentual) => {
    if (ehPercentual) {
      return `${valor.toFixed(2)}%`;
    }
    return valor.toFixed(2);
  };

  const formatarMesAno = (ano, mes) => {
    return new Date(ano, mes - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
        <div style={{ padding: 60, textAlign: "center", opacity: 0.7 }}>
          <div style={{ fontSize: "16px" }}>Carregando indicadores...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
      {/* Cabeçalho */}
      <div style={{ 
        display: "flex", 
        alignItems: "baseline", 
        justifyContent: "space-between", 
        gap: 16,
        marginBottom: 32,
        paddingBottom: 20,
        borderBottom: "2px solid var(--color-border-card)"
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            color: "var(--color-text-main)", 
            fontSize: "32px", 
            fontWeight: "700",
            letterSpacing: "-0.5px"
          }}>
            📊 Dashboard de Indicadores
          </h1>
          <div style={{ 
            marginTop: 8, 
            color: "var(--color-text-label)", 
            opacity: 0.8, 
            fontSize: "16px" 
          }}>
            Acompanhamento em tempo real das metas estratégicas
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            className="rn-button"
            onClick={() => navigate("/sistrawts")}
            type="button"
            style={{ 
              padding: "12px 24px", 
              fontSize: "14px", 
              fontWeight: "600",
              borderRadius: "8px"
            }}
          >
            ← Voltar
          </button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: 16, 
        marginBottom: 32 
      }}>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--color-primary)" }}>
            {dashboardData.length}
          </div>
          <div style={{ fontSize: "14px", color: "var(--color-text-label)", marginTop: 4 }}>
            Indicadores Ativos
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "rgb(34, 197, 94)" }}>
            {dashboardData.filter(d => d.statusGeral === "Excelente").length}
          </div>
          <div style={{ fontSize: "14px", color: "var(--color-text-label)", marginTop: 4 }}>
            Excelentes
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "rgb(251, 191, 36)" }}>
            {dashboardData.filter(d => d.statusGeral === "Bom").length}
          </div>
          <div style={{ fontSize: "14px", color: "var(--color-text-label)", marginTop: 4 }}>
            Bom Desempenho
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "rgb(239, 68, 68)" }}>
            {dashboardData.filter(d => ["Regular", "Ruim"].includes(d.statusGeral)).length}
          </div>
          <div style={{ fontSize: "14px", color: "var(--color-text-label)", marginTop: 4 }}>
            Precisa Atenção
          </div>
        </div>
      </div>

      {/* Grid de Indicadores */}
      {dashboardData.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: "center", opacity: 0.7 }}>
          <div style={{ fontSize: "48px", marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: "18px", fontWeight: "500", marginBottom: 8 }}>
            Nenhum indicador encontrado
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>
            Entre em contato com o administrador para cadastrar indicadores
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
          {dashboardData.map((indicador) => (
            <div key={indicador.id} className="card" style={{ overflow: "hidden" }}>
              {/* Cabeçalho do Indicador */}
              <div style={{ 
                padding: "20px", 
                borderBottom: "1px solid var(--color-border-card)",
                background: "var(--color-bg-card)"
              }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: "var(--color-text-main)" }}>
                    {indicador.nomeMeta}
                  </h3>
                  <span style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "600",
                    background: getStatusColor(indicador.statusGeral),
                    color: "white"
                  }}>
                    {indicador.statusGeral}
                  </span>
                </div>
                <div style={{ fontSize: "14px", color: "var(--color-text-label)", marginBottom: 12 }}>
                  {indicador.categoriaNome}
                </div>
                
                {/* Progresso Geral */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                    <span style={{ fontSize: "12px", opacity: 0.7 }}>Progresso Geral</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: getProgressColor(indicador.percentualGeral) }}>
                      {indicador.percentualGeral.toFixed(1)}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "8px",
                      background: "var(--color-progress-track)",
                      borderRadius: 4,
                      overflow: "hidden",
                      border: "1px solid var(--color-border-input)"
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(indicador.percentualGeral, 100)}%`,
                        height: "100%",
                        background: getProgressColor(indicador.percentualGeral),
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Estatísticas */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: "rgb(34, 197, 94)" }}>
                      {indicador.totalMesesBateuMeta}
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.7 }}>Metas Batidas</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: "rgb(59, 130, 246)" }}>
                      {indicador.totalMesesRegistrados}
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.7 }}>Meses Registrados</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "16px", fontWeight: "600", color: "rgb(251, 191, 36)" }}>
                      {indicador.mediaAtingimento.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: "11px", opacity: 0.7 }}>Média Atingimento</div>
                  </div>
                </div>
              </div>

              {/* Últimos Resultados */}
              <div style={{ padding: "20px" }}>
                <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: 12 }}>
                  📈 Últimos Resultados
                </div>
                
                {indicador.ultimosResultados.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px", opacity: 0.7 }}>
                    <div style={{ fontSize: "32px", marginBottom: 8 }}>📊</div>
                    <div style={{ fontSize: "14px" }}>
                      Nenhum resultado registrado
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {indicador.ultimosResultados.slice(0, 6).map((resultado) => (
                      <div
                        key={resultado.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px",
                          background: "var(--color-bg-input)",
                          borderRadius: "6px",
                          border: "1px solid var(--color-border-input)"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: "500", marginBottom: 2 }}>
                            {resultado.nomeMes.charAt(0).toUpperCase() + resultado.nomeMes.slice(1)}
                          </div>
                          <div style={{ fontSize: "12px", opacity: 0.7 }}>
                            {resultado.mesAno}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ 
                            fontSize: "14px", 
                            fontWeight: "600",
                            color: resultado.bateuMeta ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"
                          }}>
                            {formatarValor(resultado.valorResultado, indicador.ehPercentual)}
                          </div>
                          <div style={{ fontSize: "11px", opacity: 0.7 }}>
                            Meta: {formatarValor(resultado.valorMeta, indicador.ehPercentual)}
                          </div>
                          <div style={{ 
                            fontSize: "11px", 
                            fontWeight: "600",
                            color: resultado.bateuMeta ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"
                          }}>
                            {resultado.bateuMeta ? "✓ Batida" : "✗ Não batida"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ações */}
              <div style={{ padding: "20px", borderTop: "1px solid var(--color-border-card)" }}>
                <button
                  className="rn-button primary"
                  onClick={() => openResultModal(indicador)}
                  style={{ width: "100%", padding: "12px" }}
                >
                  📝 Registrar Resultado
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Resultado */}
      {showResultModal && selectedIndicador && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowResultModal(false);
          }}
        >
          <div className="card" style={{ width: "min(500px, 100%)", margin: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div className="card-title">
                  📝 Registrar Resultado
                </div>
                <div style={{ fontSize: "14px", opacity: 0.8, marginTop: 4 }}>
                  {selectedIndicador.nomeMeta}
                </div>
              </div>
              <button className="rn-button" type="button" onClick={() => setShowResultModal(false)}>
                Fechar
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                    Ano
                  </label>
                  <select
                    value={resultadoForm.ano}
                    onChange={(e) => setResultadoForm({ ...resultadoForm, ano: parseInt(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--color-border-input)",
                      background: "var(--color-bg-input)",
                      color: "var(--color-text-main)"
                    }}
                  >
                    {[...Array(5)].map((_, i) => (
                      <option key={i} value={new Date().getFullYear() - 2 + i}>
                        {new Date().getFullYear() - 2 + i}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                    Mês
                  </label>
                  <select
                    value={resultadoForm.mes}
                    onChange={(e) => setResultadoForm({ ...resultadoForm, mes: parseInt(e.target.value) })}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--color-border-input)",
                      background: "var(--color-bg-input)",
                      color: "var(--color-text-main)"
                    }}
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(2024, i, 1).toLocaleDateString("pt-BR", { month: "long" })}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                  Valor do Resultado ({selectedIndicador.ehPercentual ? "%" : "decimal"})
                </label>
                <input
                  type="number"
                  value={resultadoForm.valorResultado}
                  onChange={(e) => setResultadoForm({ ...resultadoForm, valorResultado: e.target.value })}
                  step="0.01"
                  placeholder="0.00"
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)"
                  }}
                />
                <div style={{ fontSize: "12px", opacity: 0.7, marginTop: 4 }}>
                  {selectedIndicador.quantoMaiorMelhor 
                    ? "📈 Quanto maior melhor" 
                    : "📉 Quanto menor melhor"
                  }
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button className="rn-button" type="button" onClick={() => setShowResultModal(false)}>
                  Cancelar
                </button>
                <button className="rn-button primary" type="button" onClick={saveResultado}>
                  Salvar Resultado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
