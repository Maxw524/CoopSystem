import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

function toId(value) {
  const parsed = Number.parseInt(String(value ?? "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isValidGuid(value) {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(value);
}

export default function SistrawtsMicroAcoes() {
  const navigate = useNavigate();
  const { planoId } = useParams();
  const { user } = useAuth();

  const isAdmin = user?.admin === true || (user?.roles || []).includes("Admin");
  const currentUserId = user?.id;
  const selectedPlanoId = planoId;

  const [microAcoes, setMicroAcoes] = useState([]);
  const [plano, setPlano] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMicroAcao, setEditingMicroAcao] = useState(null);

  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [microAcaoAberta, setMicroAcaoAberta] = useState(null);
  const [arquivoComprovacao, setArquivoComprovacao] = useState(null);

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    dataInicio: "",
    previsaoConclusao: "",
    responsavelId: "",
  });

  const [abrirForm, setAbrirForm] = useState({
    trativa: "",
  });

  const planoResponsavelId = plano?.responsavelId;
  const isPlanoResponsavel = currentUserId && planoResponsavelId && currentUserId === planoResponsavelId;

  const microAcoesSorted = useMemo(() => {
    return [...(microAcoes || [])].sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
  }, [microAcoes]);

  async function loadPlano() {
    if (!selectedPlanoId) return;

    if (!isValidGuid(selectedPlanoId)) {
      console.error("PlanoId inválido:", selectedPlanoId);
      setPlano(null);
      navigate("/sistrawts/planos", { replace: true });
      return;
    }

    try {
      const { data } = await api.get(`/planoacao/${selectedPlanoId}`);
      setPlano(data || null);
    } catch (error) {
      console.error("Erro ao carregar plano:", error);
      setPlano(null);
    }
  }

  async function loadMicroAcoes() {
    if (!selectedPlanoId) {
      setMicroAcoes([]);
      return;
    }

    if (!isValidGuid(selectedPlanoId)) {
      console.error("PlanoId inválido:", selectedPlanoId);
      setMicroAcoes([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.get(`/microacao/plano/${selectedPlanoId}`);
      setMicroAcoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar micro acoes:", error);
      alert("Erro ao carregar micro acoes do plano");
    } finally {
      setLoading(false);
    }
  }

  async function loadUsuarios() {
    try {
      const { data } = await api.get("/usuario");
      setUsuarios(data || []);
    } catch (error) {
      console.error("Erro ao carregar usuarios:", error);
    }
  }

  function resetEditForm() {
    setFormData({
      titulo: "",
      descricao: "",
      dataInicio: "",
      previsaoConclusao: "",
      responsavelId: "",
    });

    setEditingMicroAcao(null);
  }

  function resetAbrirForm() {
    setAbrirForm({ trativa: "" });
    setArquivoComprovacao(null);
    setMicroAcaoAberta(null);
  }

  function getEditAccessState(microAcao) {
    if (isAdmin) {
      return { visible: true, enabled: true, reason: "" };
    }

    if (!isPlanoResponsavel) {
      return { visible: false, enabled: false, reason: "" };
    }

    const microResponsavelId = microAcao?.responsavelId;
    const sameAsPlanoResponsavel = microResponsavelId === planoResponsavelId;

    if (!sameAsPlanoResponsavel) {
      return {
        visible: true,
        enabled: false,
        reason: "Edicao bloqueada: esta micro acao esta com responsavel diferente do responsavel do plano.",
      };
    }

    return { visible: true, enabled: true, reason: "" };
  }

  function canAbrirMicroAcao(microAcao) {
    function isMicroAcaoResponsavel(microAcao) {
      return microAcao?.responsavelId === currentUserId;
    }

    if (isAdmin) return true;
    return isMicroAcaoResponsavel(microAcao);
  }

  function openEditModal(microAcao = null) {
    if (!microAcao && !isAdmin) {
      alert("Apenas administradores podem cadastrar micro acoes");
      return;
    }

    if (microAcao) {
      const access = getEditAccessState(microAcao);

      if (!access.visible) {
        alert("Apenas administradores ou o responsavel do plano podem editar micro acoes");
        return;
      }

      if (!access.enabled) {
        alert(access.reason);
        return;
      }

      setEditingMicroAcao(microAcao);
      setFormData({
        titulo: microAcao.titulo,
        descricao: microAcao.descricao,
        dataInicio: microAcao.dataInicio?.split("T")[0] || "",
        previsaoConclusao: microAcao.previsaoConclusao?.split("T")[0] || "",
        responsavelId: String(microAcao.responsavelId || ""),
      });
    } else {
      resetEditForm();
    }

    setShowEditModal(true);
  }

  function closeEditModal() {
    setShowEditModal(false);
    resetEditForm();
  }

  function openAbrirModal(microAcao) {
    if (!canAbrirMicroAcao(microAcao)) {
      alert("Apenas o responsavel da micro acao ou admin pode abrir esta atividade");
      return;
    }

    setMicroAcaoAberta(microAcao);
    setAbrirForm({ trativa: microAcao.trativa || "" });
    setArquivoComprovacao(null);
    setShowAbrirModal(true);
  }

  function closeAbrirModal() {
    setShowAbrirModal(false);
    resetAbrirForm();
  }

  async function handleEditSubmit(e) {
    e.preventDefault();

    if (!editingMicroAcao && !isAdmin) {
      alert("Apenas administradores podem cadastrar micro acoes");
      return;
    }

    try {
      const payloadBase = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        trativa: editingMicroAcao?.trativa || "",
        dataInicio: formData.dataInicio,
        previsaoConclusao: formData.previsaoConclusao,
        responsavelId: formData.responsavelId,
      };

      if (editingMicroAcao) {
        await api.put(`/microacao/${editingMicroAcao.id}`, {
          ...payloadBase,
          concluida: editingMicroAcao.concluida === true,
        });

        alert("Micro acao atualizada com sucesso");
      } else {
        await api.post("/microacao", {
          ...payloadBase,
          planoAcaoId: selectedPlanoId,
        });

        alert("Micro acao criada com sucesso");
      }

      closeEditModal();
      await loadMicroAcoes();
    } catch (error) {
      console.error("Erro ao salvar micro acao:", error);
      alert("Erro ao salvar micro acao");
    }
  }

  async function handleAbrirSubmit(e) {
    e.preventDefault();

    if (!microAcaoAberta) return;

    const trativa = String(abrirForm.trativa || "").trim();
    if (!trativa) {
      alert("A trativa e obrigatoria. Deixe uma mensagem do procedimento realizado para atingir o resultado desta acao.");
      return;
    }

    try {
      await api.put(`/microacao/${microAcaoAberta.id}`, {
        titulo: microAcaoAberta.titulo,
        descricao: microAcaoAberta.descricao || "",
        trativa,
        dataInicio: microAcaoAberta.dataInicio,
        previsaoConclusao: microAcaoAberta.previsaoConclusao,
        responsavelId: microAcaoAberta.responsavelId,
        concluida: true,
      });

      if (arquivoComprovacao) {
        await handleFileUpload(microAcaoAberta.id, arquivoComprovacao, { silent: true });
      }

      alert("Micro acao registrada com trativa e concluida com sucesso");

      closeAbrirModal();
      await loadMicroAcoes();
    } catch (error) {
      console.error("Erro ao abrir micro acao:", error);
      alert("Erro ao registrar trativa da micro acao");
    }
  }

  async function deleteMicroAcao(id) {
    if (!window.confirm("Tem certeza que deseja excluir esta micro acao?")) return;

    try {
      await api.delete(`/microacao/${id}`);
      alert("Micro acao excluida com sucesso");
      await loadMicroAcoes();
    } catch (error) {
      console.error("Erro ao excluir micro acao:", error);
      alert("Erro ao excluir micro acao");
    }
  }

  async function handleFileUpload(microAcaoId, file, options = {}) {
    if (!file) return;

    const { silent = false } = options;
    const formDataUpload = new FormData();
    formDataUpload.append("file", file);

    try {
      await api.post(`/microacao/${microAcaoId}/upload`, formDataUpload, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!silent) {
        alert("Comprovante enviado com sucesso");
        await loadMicroAcoes();
      }
    } catch (error) {
      console.error("Erro ao enviar arquivo:", error);
      if (!silent) {
        alert("Erro ao enviar comprovante");
      } else {
        throw error;
      }
    }
  }

  useEffect(() => {
    loadPlano();
    loadMicroAcoes();
    loadUsuarios();
  }, [selectedPlanoId]);

  if (!selectedPlanoId) {
    return (
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-title">Plano invalido</div>
          <div style={{ color: "var(--color-text-label)", marginBottom: 14 }}>
            Selecione um plano para visualizar as micro acoes.
          </div>
          <button className="rn-button" type="button" onClick={() => navigate("/sistrawts/planos")}>
            Ir para planos
          </button>
        </div>
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
            🎯 Micro Ações
          </h1>
          <div style={{ 
            marginTop: 8, 
            color: "var(--color-text-label)", 
            opacity: 0.8, 
            fontSize: "16px" 
          }}>
            {plano ? `Gerenciamento de tarefas do plano: ${plano.titulo}` : "Carregando plano..."}
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
            Voltar aos Planos
          </button>
          
          {(isAdmin || isPlanoResponsavel) && (
            <button
              className="rn-button primary"
              onClick={() => setShowEditModal(true)}
              type="button"
              style={{ 
                padding: "12px 24px", 
                fontSize: "14px", 
                fontWeight: "600",
                borderRadius: "8px"
              }}
            >
              ➕ Nova Micro Ação
            </button>
          )}
        </div>
      </div>

      {/* Informações do Plano */}
      {plano && (
        <div className="card" style={{ marginBottom: 24, padding: "20px" }}>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
            gap: 16 
          }}>
            <div>
              <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 4 }}>📋 Plano</div>
              <div style={{ fontSize: "16px", fontWeight: "600" }}>{plano.titulo}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 4 }}>👤 Responsável</div>
              <div style={{ fontSize: "14px" }}>{plano.responsavelNome}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 4 }}>📅 Período</div>
              <div style={{ fontSize: "14px" }}>
                {new Date(plano.dataInicio).toLocaleDateString("pt-BR")} - {new Date(plano.previsaoConclusao).toLocaleDateString("pt-BR")}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "12px", opacity: 0.7, marginBottom: 4 }}>📊 Progresso</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 60,
                    height: 8,
                    background: "var(--color-progress-track)",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${plano.percentualConclusao}%`,
                      height: "100%",
                      background: plano.percentualConclusao >= 80 ? "rgb(34, 197, 94)" : plano.percentualConclusao >= 50 ? "rgb(251, 191, 36)" : "rgb(239, 68, 68)",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
                <span style={{ fontSize: "12px", fontWeight: "600" }}>
                  {plano.percentualConclusao.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas das Micro-ações */}
      {microAcoes && microAcoes.length > 0 && (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: 16, 
          marginBottom: 32 
        }}>
          <div className="card" style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "var(--color-primary)" }}>
              {microAcoes.length}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-label)", marginTop: 4 }}>
              Total de Tarefas
            </div>
          </div>
          <div className="card" style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "rgb(34, 197, 94)" }}>
              {microAcoes.filter(m => m.concluida).length}
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-label)", marginTop: 4 }}>
              Concluídas
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

      {/* Tabela Profissional */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-title" style={{ fontSize: "18px", fontWeight: "600" }}>
          📋 Lista de Micro Ações ({microAcoesSorted.length})
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center", opacity: 0.7 }}>
            <div style={{ fontSize: "16px" }}>Carregando micro ações...</div>
          </div>
        ) : microAcoesSorted.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", opacity: 0.7 }}>
            <div style={{ fontSize: "48px", marginBottom: 16 }}>🎯</div>
            <div style={{ fontSize: "18px", fontWeight: "500", marginBottom: 8 }}>
              Nenhuma micro ação encontrada
            </div>
            <div style={{ fontSize: "14px", opacity: 0.8 }}>
              {(isAdmin || isPlanoResponsavel) 
                ? "Crie a primeira micro ação para começar" 
                : "Este plano ainda não possui micro ações"
              }
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse", 
              fontSize: "14px"
            }}>
              <thead>
                <tr style={{ 
                  background: "var(--color-bg-card)", 
                  borderBottom: "2px solid var(--color-border-card)"
                }}>
                  <th style={{ 
                    padding: "16px 12px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "var(--color-text-main)",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Tarefa
                  </th>
                  <th style={{ 
                    padding: "16px 12px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "var(--color-text-main)",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Responsável
                  </th>
                  <th style={{ 
                    padding: "16px 12px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "var(--color-text-main)",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Início
                  </th>
                  <th style={{ 
                    padding: "16px 12px", 
                    textAlign: "left", 
                    fontWeight: "600", 
                    color: "var(--color-text-main)",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Previsão
                  </th>
                  <th style={{ 
                    padding: "16px 12px", 
                    textAlign: "center", 
                    fontWeight: "600", 
                    color: "var(--color-text-main)",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Status
                  </th>
                  <th style={{ 
                    padding: "16px 12px", 
                    textAlign: "center", 
                    fontWeight: "600", 
                    color: "var(--color-text-main)",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Comprovante
                  </th>
                  <th style={{ 
                    padding: "16px 12px", 
                    textAlign: "right", 
                    fontWeight: "600", 
                    color: "var(--color-text-main)",
                    fontSize: "13px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {microAcoesSorted.map((microAcao) => {
                  const editAccess = getEditAccessState(microAcao);
                  const abrirAllowed = canAbrirMicroAcao(microAcao);

                  return (
                    <tr key={microAcao.id} style={{ borderTop: "1px solid var(--color-border-strong)" }}>
                      <td style={{ padding: 10 }}>
                        <div>
                          <b>{microAcao.titulo}</b>

                          {microAcao.descricao && (
                            <div style={{ fontSize: 12, color: "var(--color-text-label)", marginTop: 3 }}>
                              <b>Descricao:</b> {microAcao.descricao}
                            </div>
                          )}

                          {microAcao.trativa && (
                            <div style={{ fontSize: 12, color: "var(--color-text-main)", marginTop: 4 }}>
                              <b>Trativa:</b> {microAcao.trativa.substring(0, 120)}
                              {microAcao.trativa.length > 120 ? "..." : ""}
                            </div>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: 10 }}>
                        <div>
                          <div>{microAcao.responsavelNome}</div>
                          <div style={{ fontSize: 12, color: "var(--color-text-label)", marginTop: 2 }}>
                            {microAcao.responsavelEmail}
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: 10 }}>{new Date(microAcao.dataInicio).toLocaleDateString("pt-BR")}</td>
                      <td style={{ padding: 10 }}>{new Date(microAcao.previsaoConclusao).toLocaleDateString("pt-BR")}</td>

                      <td style={{ padding: 10 }}>
                        <span
                          style={{
                            padding: "5px 9px",
                            borderRadius: 6,
                            fontSize: 11,
                            background: microAcao.concluida
                              ? "rgba(34, 197, 94, 0.18)"
                              : "rgba(251, 191, 36, 0.18)",
                            color: microAcao.concluida ? "rgb(34, 197, 94)" : "rgb(251, 191, 36)",
                            fontWeight: "bold",
                          }}
                        >
                          {microAcao.concluida ? "Concluida" : "Pendente"}
                        </span>
                      </td>

                      <td style={{ padding: 10, textAlign: "center" }}>
                        {microAcao.arquivoComprovacao ? (
                          <a
                            href={microAcao.arquivoComprovacao}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--color-primary)", textDecoration: "none", fontSize: 12 }}
                          >
                            Ver arquivo
                          </a>
                        ) : (
                          <span style={{ color: "var(--color-text-label)", fontSize: 12 }}>Sem arquivo</span>
                        )}
                      </td>

                      <td style={{ padding: 10, textAlign: "right" }}>
                        <button
                          className={`rn-button ${microAcao.concluida ? "" : "primary"}`}
                          type="button"
                          onClick={() => openAbrirModal(microAcao)}
                          disabled={!abrirAllowed}
                          title={
                            abrirAllowed
                              ? "Abrir micro acao para registrar trativa"
                              : "Somente o responsavel da micro acao ou admin pode abrir"
                          }
                        >
                          Abrir
                        </button>

                        {editAccess.visible && (
                          <>
                            <span style={{ display: "inline-block", width: 4 }} />
                            <button
                              className="rn-button"
                              type="button"
                              onClick={() => openEditModal(microAcao)}
                              disabled={!editAccess.enabled}
                              title={editAccess.enabled ? "Editar micro acao" : editAccess.reason}
                            >
                              Editar
                            </button>
                          </>
                        )}

                        {isAdmin && (
                          <>
                            <span style={{ display: "inline-block", width: 4 }} />
                            <button
                              className="rn-button warn"
                              type="button"
                              onClick={() => deleteMicroAcao(microAcao.id)}
                            >
                              Excluir
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {microAcoesSorted.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: 40, textAlign: "center", color: "var(--color-text-label)" }}>
                      Nenhuma micro acao encontrada neste plano.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEditModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEditModal();
          }}
        >
          <div
            className="card"
            style={{
              width: "min(680px, 100%)",
              margin: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div className="card-title" style={{ marginBottom: 4 }}>
                  {editingMicroAcao ? "Editar Micro Acao" : "Nova Micro Acao"}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-label)" }}>
                  Plano: {plano?.titulo || `#${selectedPlanoId}`}
                </div>
              </div>

              <button className="rn-button" type="button" onClick={closeEditModal}>
                Fechar
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-label)", marginBottom: 6 }}>Titulo *</div>
                <input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Titulo da micro acao"
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                  }}
                />
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-label)", marginBottom: 6 }}>Descricao</div>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descricao detalhada da micro acao"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                    resize: "vertical",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--color-text-label)", marginBottom: 6 }}>Data de inicio *</div>
                  <input
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    required
                    disabled={!isAdmin}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--color-border-input)",
                      background: "var(--color-bg-input)",
                      color: "var(--color-text-main)",
                      opacity: !isAdmin ? 0.75 : 1,
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--color-text-label)", marginBottom: 6 }}>
                    Previsao de conclusao *
                  </div>
                  <input
                    type="date"
                    value={formData.previsaoConclusao}
                    onChange={(e) => setFormData({ ...formData, previsaoConclusao: e.target.value })}
                    required
                    min={formData.dataInicio}
                    disabled={!isAdmin}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--color-border-input)",
                      background: "var(--color-bg-input)",
                      color: "var(--color-text-main)",
                      opacity: !isAdmin ? 0.75 : 1,
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-label)", marginBottom: 6 }}>Responsavel *</div>
                <select
                  value={formData.responsavelId}
                  onChange={(e) => setFormData({ ...formData, responsavelId: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                  }}
                >
                  <option value="">Selecione um responsavel</option>
                  {usuarios.map((responsavel) => (
                    <option key={responsavel.id} value={responsavel.id}>
                      {responsavel.nomeCompleto} - {responsavel.email}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="rn-button" type="button" onClick={closeEditModal}>
                  Cancelar
                </button>
                <button className="rn-button primary" type="submit">
                  {editingMicroAcao ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAbrirModal && microAcaoAberta && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAbrirModal();
          }}
        >
          <div
            className="card"
            style={{
              width: "min(720px, 100%)",
              margin: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div className="card-title" style={{ marginBottom: 4 }}>
                  Abrir Micro Acao: {microAcaoAberta.titulo}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-label)" }}>
                  Responsavel: {microAcaoAberta.responsavelNome}
                </div>
              </div>

              <button className="rn-button" type="button" onClick={closeAbrirModal}>
                Fechar
              </button>
            </div>

            <form onSubmit={handleAbrirSubmit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div
                style={{
                  border: "1px solid var(--color-border-input)",
                  borderRadius: 10,
                  padding: 10,
                  background: "var(--accent-soft)",
                }}
              >
                <div style={{ fontSize: 12, color: "var(--color-text-label)", marginBottom: 6 }}>
                  Descricao cadastrada pelo admin
                </div>
                <div style={{ fontSize: 13, color: "var(--color-text-main)", lineHeight: 1.45 }}>
                  {microAcaoAberta.descricao || "Sem descricao informada."}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-label)", marginBottom: 6 }}>Trativa *</div>
                <textarea
                  value={abrirForm.trativa}
                  onChange={(e) => setAbrirForm({ trativa: e.target.value })}
                  placeholder="Deixe uma mensagem do procedimento realizado para atingir o resultado desta acao"
                  required
                  rows={5}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                    resize: "vertical",
                  }}
                />
                <div style={{ marginTop: 6, fontSize: 12, color: "var(--color-text-label)" }}>
                  Campo obrigatorio: descreva o procedimento realizado para atingir o resultado desta acao.
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "var(--color-text-label)", marginBottom: 6 }}>
                  Upload de comprovacao (opcional)
                </div>
                <input
                  type="file"
                  onChange={(e) => setArquivoComprovacao(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                  }}
                />
                {microAcaoAberta.arquivoComprovacao && (
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    Arquivo atual:{" "}
                    <a
                      href={microAcaoAberta.arquivoComprovacao}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--color-primary)" }}
                    >
                      Ver comprovacao
                    </a>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="rn-button" type="button" onClick={closeAbrirModal}>
                  Cancelar
                </button>
                <button className="rn-button primary" type="submit">
                  Salvar e concluir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
