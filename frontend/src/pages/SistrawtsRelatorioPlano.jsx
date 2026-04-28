import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

function isValidGuid(value) {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(value);
}

export default function SistrawtsRelatorioPlano() {
  const { planoId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [plano, setPlano] = useState(null);
  const [microAcoes, setMicroAcoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (!planoId) return;
    loadRelatorioData();
  }, [planoId]);

  async function loadRelatorioData() {
    if (!isValidGuid(planoId)) {
      console.error("PlanoId inválido:", planoId);
      setPlano(null);
      setMicroAcoes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Carregar dados do plano
      const { data: planoData } = await api.get(`/planoacao/${planoId}`);
      setPlano(planoData);

      // Carregar micro-ações do plano
      const { data: microAcoesData } = await api.get(`/microacao/plano/${planoId}`);
      setMicroAcoes(microAcoesData || []);
    } catch (error) {
      console.error("Erro ao carregar dados do relatório:", error);
      alert("Erro ao carregar dados do relatório");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePdf() {
    setGeneratingPdf(true);
    try {
      const response = await api.get(`/planoacao/${planoId}/relatorio/pdf`, {
        responseType: 'blob'
      });
      
      // Criar URL para download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-plano-${plano?.titulo || planoId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF do relatório");
    } finally {
      setGeneratingPdf(false);
    }
  }

  function getPercentualColor(percentual) {
    if (percentual >= 80) return "rgb(34, 197, 94)";
    if (percentual >= 50) return "rgb(251, 191, 36)";
    return "rgb(239, 68, 68)";
  }

  function getStatusColor(concluida) {
    return concluida ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)";
  }

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", opacity: 0.7 }}>
        Carregando dados do relatório...
      </div>
    );
  }

  if (!plano) {
    return (
      <div style={{ padding: 40, textAlign: "center", opacity: 0.7 }}>
        Plano não encontrado.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
      {/* Cabeçalho Profissional */}
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
            📊 Relatório Detalhado do Plano de Ação
          </h1>
          <div style={{ 
            marginTop: 8, 
            color: "var(--color-text-label)", 
            opacity: 0.8, 
            fontSize: "16px" 
          }}>
            Análise completa do progresso e andamento das atividades
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            className="rn-button primary"
            onClick={handleGeneratePdf}
            disabled={generatingPdf}
            type="button"
            style={{ 
              padding: "12px 24px", 
              fontSize: "14px", 
              fontWeight: "600",
              borderRadius: "8px"
            }}
          >
            {generatingPdf ? "Gerando PDF..." : "📥 Baixar PDF"}
          </button>

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

      {/* Estatísticas Rápidas */}
      {plano && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", 
          gap: 16, 
          marginBottom: 32 
        }}>
          <div className="card" style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--color-primary)" }}>
              {plano.percentualConclusao.toFixed(1)}%
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-label)", marginTop: 4 }}>
              Progresso Geral
            </div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "rgb(34, 197, 94)" }}>
              {microAcoes.filter(m => m.concluida).length}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-label)", marginTop: 4 }}>
              Tarefas Concluídas
            </div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "rgb(251, 191, 36)" }}>
              {microAcoes.filter(m => !m.concluida).length}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-label)", marginTop: 4 }}>
              Em Andamento
            </div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "rgb(59, 130, 246)" }}>
              {microAcoes.filter(m => m.arquivoComprovante).length}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-label)", marginTop: 4 }}>
              Com Comprovante
            </div>
          </div>
        </div>
      )}

      {/* Informações do Plano */}
      <div style={{ marginBottom: 24 }} className="card">
        <div className="card-title" style={{ fontSize: "18px", fontWeight: "600" }}>
          📋 Dados Gerais do Plano
        </div>
        
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: 20,
          padding: "20px"
        }}>
          <div>
            <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              📝 Título do Plano
            </div>
            <div style={{ fontSize: "16px", fontWeight: "600", color: "var(--color-text-main)" }}>
              {plano.titulo}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              👤 Responsável
            </div>
            <div style={{ fontSize: "16px", fontWeight: "500" }}>
              {plano.responsavelNome}
            </div>
            <div style={{ fontSize: "13px", opacity: 0.6, marginTop: 2 }}>
              {plano.responsavelEmail}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              📅 Período de Execução
            </div>
            <div style={{ fontSize: "16px", fontWeight: "500" }}>
              {new Date(plano.dataInicio).toLocaleDateString("pt-BR")} até{" "}
              {new Date(plano.previsaoConclusao).toLocaleDateString("pt-BR")}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              📊 Progresso de Conclusão
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
              <div
                style={{
                  width: 120,
                  height: 10,
                  background: "var(--color-progress-track)",
                  borderRadius: 5,
                  overflow: "hidden",
                  border: "1px solid var(--color-border-input)"
                }}
              >
                <div
                  style={{
                    width: `${plano.percentualConclusao}%`,
                    height: "100%",
                    background: getPercentualColor(plano.percentualConclusao),
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: "14px",
                  color: getPercentualColor(plano.percentualConclusao),
                  fontWeight: "600",
                  minWidth: "45px"
                }}
              >
                {plano.percentualConclusao.toFixed(1)}%
              </span>
            </div>
          </div>

          {plano.descricao && (
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                📄 Descrição Detalhada
              </div>
              <div style={{ 
                fontSize: "14px", 
                lineHeight: 1.6,
                padding: "12px",
                background: "var(--color-bg-input)",
                borderRadius: "8px",
                border: "1px solid var(--color-border-input)"
              }}>
                {plano.descricao}
              </div>
            </div>
          )}

          {plano.relatorio && (
            <div style={{ gridColumn: "1 / -1" }}>
              <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                📈 Relatório Geral
              </div>
              <div style={{ 
                fontSize: "14px", 
                lineHeight: 1.6,
                padding: "16px",
                background: "var(--color-bg-input)",
                borderRadius: "8px",
                border: "1px solid var(--color-border-input)",
                whiteSpace: "pre-wrap"
              }}>
                {plano.relatorio}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Micro-ações */}
      <div className="card">
        <div className="card-title">
          🎯 Atividades e Tarefas ({microAcoes.length})
        </div>

        {microAcoes.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", opacity: 0.7 }}>
            Nenhuma micro-ação encontrada para este plano.
          </div>
        ) : (
          <div style={{ maxHeight: "60vh", overflow: "auto" }}>
            {microAcoes.map((microAcao) => (
              <div
                key={microAcao.id}
                style={{
                  padding: 16,
                  border: "1px solid var(--color-border-card)",
                  borderRadius: 8,
                  marginBottom: 12,
                  background: "var(--color-bg-card)"
                }}
              >
                {/* Cabeçalho da Micro-ação */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "baseline", 
                  justifyContent: "space-between",
                  marginBottom: 12
                }}>
                  <div>
                    <h3 style={{ margin: 0, color: "var(--color-text-main)" }}>
                      {microAcao.titulo}
                    </h3>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
                      Responsável: {microAcao.responsavelNome}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: "bold",
                        background: getStatusColor(microAcao.concluida) + "20",
                        color: getStatusColor(microAcao.concluida)
                      }}
                    >
                      {microAcao.concluida ? "Concluída" : "Em Andamento"}
                    </span>

                    {microAcao.dataConclusao && (
                      <span style={{ fontSize: 11, opacity: 0.7 }}>
                        Concluída em: {new Date(microAcao.dataConclusao).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Descrição */}
                {microAcao.descricao && (
                  <div style={{ marginBottom: 12 }}>
                    <strong style={{ fontSize: 12, color: "var(--color-text-main)" }}>Descrição:</strong>
                    <div style={{ marginTop: 4, fontSize: 13 }}>{microAcao.descricao}</div>
                  </div>
                )}

                {/* Trativa */}
                {microAcao.trativa && (
                  <div style={{ marginBottom: 12 }}>
                    <strong style={{ fontSize: 12, color: "var(--color-text-main)" }}>Trativa:</strong>
                    <div style={{ 
                      marginTop: 4, 
                      padding: 8, 
                      background: "var(--color-bg-input)",
                      borderRadius: 4,
                      fontSize: 13,
                      whiteSpace: "pre-wrap"
                    }}>
                      {microAcao.trativa}
                    </div>
                  </div>
                )}

                {/* Período */}
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  Período: {new Date(microAcao.dataInicio).toLocaleDateString("pt-BR")} até{" "}
                  {new Date(microAcao.previsaoConclusao).toLocaleDateString("pt-BR")}
                </div>

                {/* Comprovante */}
                {microAcao.arquivoComprovacao && (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={microAcao.arquivoComprovacao}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12,
                        color: "var(--color-primary)",
                        textDecoration: "none"
                      }}
                    >
                      📎 Ver Comprovante
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
