import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function SistrawtsPlanosAcao() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.admin === true || (user?.roles || []).includes("Admin");

  const [planos, setPlanos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlano, setEditingPlano] = useState(null);
  const [showTrativaModal, setShowTrativaModal] = useState(false);
  const [trativaPlano, setTrativaPlano] = useState(null);

  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    dataInicio: "",
    previsaoConclusao: "",
    responsavelId: "",
  });

  const [trativaForm, setTrativaForm] = useState({
    trativa: "",
  });

  const planosSorted = useMemo(() => {
    return [...(planos || [])].sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
  }, [planos]);

  async function loadPlanos() {
    setLoading(true);
    try {
      const { data } = await api.get("/planoacao");
      setPlanos(data || []);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      alert("Erro ao carregar planos de acao");
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

  function resetForm() {
    setFormData({
      titulo: "",
      descricao: "",
      dataInicio: "",
      previsaoConclusao: "",
      responsavelId: "",
    });

    setEditingPlano(null);
  }

  function openModal(plano = null) {
    if (!plano && !isAdmin) {
      alert("Apenas administradores podem criar novos planos");
      return;
    }

    if (plano) {
      setEditingPlano(plano);
      setFormData({
        titulo: plano.titulo,
        descricao: plano.descricao,
        dataInicio: plano.dataInicio?.split("T")[0] || "",
        previsaoConclusao: plano.previsaoConclusao?.split("T")[0] || "",
        responsavelId: plano.responsavelId?.toString() || "",
      });
    } else {
      resetForm();
    }

    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    resetForm();
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!editingPlano && !isAdmin) {
      alert("Apenas administradores podem criar planos");
      return;
    }

    try {
      const payload = {
        ...formData,
        responsavelId: formData.responsavelId,
      };

      if (editingPlano) {
        await api.put(`/planoacao/${editingPlano.id}`, payload);
        alert("Plano atualizado com sucesso");
      } else {
        await api.post("/planoacao", payload);
        alert("Plano criado com sucesso");
      }

      closeModal();
      await loadPlanos();
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      alert("Erro ao salvar plano de acao");
    }
  }

  async function deletePlano(id) {
    if (!isAdmin) {
      alert("Apenas administradores podem excluir planos");
      return;
    }

    if (!window.confirm("Tem certeza que deseja excluir este plano?")) return;

    try {
      await api.delete(`/planoacao/${id}`);
      alert("Plano excluido com sucesso");
      await loadPlanos();
    } catch (error) {
      console.error("Erro ao excluir plano:", error);
      alert("Erro ao excluir plano de acao");
    }
  }

  function openTrativaModal(plano) {
    setTrativaPlano(plano);
    setTrativaForm({ trativa: plano.trativa || "" });
    setShowTrativaModal(true);
  }

  function closeTrativaModal() {
    setShowTrativaModal(false);
    setTrativaPlano(null);
    setTrativaForm({ trativa: "" });
  }

  async function saveTrativa() {
    try {
      await api.put(`/planoacao/${trativaPlano.id}/trativa`, trativaForm.trativa);
      alert("Trativa atualizada com sucesso");
      closeTrativaModal();
      await loadPlanos();
    } catch (error) {
      console.error("Erro ao salvar trativa:", error);
      alert("Erro ao salvar trativa");
    }
  }

  function getPercentualColor(percentual) {
    if (percentual >= 80) return "rgb(34, 197, 94)";
    if (percentual >= 50) return "rgb(251, 191, 36)";
    return "rgb(239, 68, 68)";
  }

  useEffect(() => {
    loadPlanos();
    loadUsuarios();
  }, []);

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
            📋 Planos de Ação
          </h1>
          <div style={{ 
            marginTop: 8, 
            color: "var(--color-text-label)", 
            opacity: 0.8, 
            fontSize: "16px" 
          }}>
            Gerenciamento de planos estratégicos e acompanhamento de metas
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          {isAdmin && (
            <button
              className="rn-button primary"
              onClick={() => openModal()}
              type="button"
              style={{ 
                padding: "12px 24px", 
                fontSize: "14px", 
                fontWeight: "600",
                borderRadius: "8px"
              }}
            >
              ➕ Novo Plano
            </button>
          )}
        </div>
      </div>

      {/* Tabela Profissional */}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="card-title" style={{ fontSize: "18px", fontWeight: "600" }}>
          📊 Lista de Planos de Ação
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: "center", opacity: 0.7 }}>
            <div style={{ fontSize: "16px" }}>Carregando planos...</div>
          </div>
        ) : planosSorted.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", opacity: 0.7 }}>
            <div style={{ fontSize: "48px", marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: "18px", fontWeight: "500", marginBottom: 8 }}>
              Nenhum plano encontrado
            </div>
            <div style={{ fontSize: "14px", opacity: 0.8 }}>
              {isAdmin 
                ? "Crie seu primeiro plano de ação para começar" 
                : "Você ainda não possui planos atribuídos"
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
                    Plano
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
                    Período
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
                    Progresso
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
                {planosSorted.map((plano) => (
                  <tr 
                    key={plano.id} 
                    style={{ 
                      borderTop: "1px solid var(--color-border-card)",
                      transition: "background-color 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "var(--color-bg-card)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <td style={{ padding: "16px 12px", verticalAlign: "top" }}>
                      <div>
                        <div style={{ 
                          fontSize: "15px", 
                          fontWeight: "600", 
                          color: "var(--color-text-main)",
                          marginBottom: 4
                        }}>
                          {plano.titulo}
                        </div>
                        {plano.descricao && (
                          <div style={{ 
                            fontSize: "12px", 
                            opacity: 0.7, 
                            lineHeight: 1.4,
                            maxWidth: "300px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical"
                          }}>
                            {plano.descricao}
                          </div>
                        )}
                      </div>
                    </td>

                    <td style={{ padding: "16px 12px", verticalAlign: "top" }}>
                      <div>
                        <div style={{ 
                          fontSize: "14px", 
                          fontWeight: "500", 
                          color: "var(--color-text-main)",
                          marginBottom: 2
                        }}>
                          {plano.responsavelNome}
                        </div>
                        <div style={{ 
                          fontSize: "12px", 
                          opacity: 0.6 
                        }}>
                          {plano.responsavelEmail}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "16px 12px", verticalAlign: "top" }}>
                      <div style={{ fontSize: "13px" }}>
                        <div style={{ marginBottom: 2 }}>
                          {new Date(plano.dataInicio).toLocaleDateString("pt-BR")}
                        </div>
                        <div style={{ opacity: 0.7 }}>
                          até {new Date(plano.previsaoConclusao).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: "16px 12px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                        <div
                          style={{
                            width: 80,
                            height: 8,
                            background: "var(--color-progress-track)",
                            borderRadius: 4,
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
                            fontSize: "12px",
                            color: getPercentualColor(plano.percentualConclusao),
                            fontWeight: "600",
                            minWidth: "35px",
                            textAlign: "right"
                          }}
                        >
                          {plano.percentualConclusao.toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: "16px 12px", verticalAlign: "top", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button
                          className="rn-button"
                          type="button"
                          onClick={() => navigate(`/sistrawts/planos/${plano.id}/microacoes`)}
                          title="Abrir micro ações deste plano"
                          style={{ 
                            padding: "6px 12px", 
                            fontSize: "12px",
                            borderRadius: "6px"
                          }}
                        >
                          📋 Micro Ações
                        </button>

                        <button
                          className="rn-button"
                          type="button"
                          onClick={() => navigate(`/sistrawts/planos/${plano.id}/relatorio`)}
                          title="Ver relatório completo"
                          style={{ 
                            padding: "6px 12px", 
                            fontSize: "12px",
                            borderRadius: "6px"
                          }}
                        >
                          📄 Relatório
                        </button>

                        <button 
                          className="rn-button" 
                          type="button" 
                          onClick={() => openModal(plano)}
                          style={{ 
                            padding: "6px 12px", 
                            fontSize: "12px",
                            borderRadius: "6px"
                          }}
                        >
                          ✏️ Editar
                        </button>

                        {isAdmin && (
                          <button
                            className="rn-button warn"
                            type="button"
                            onClick={() => deletePlano(plano.id)}
                            style={{ 
                              padding: "6px 12px", 
                              fontSize: "12px",
                              borderRadius: "6px"
                            }}
                          >
                            🗑️ Excluir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
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
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className="card"
            style={{
              width: "min(600px, 100%)",
              margin: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div className="card-title" style={{ marginBottom: 4 }}>
                  {editingPlano ? "Editar Plano" : "Novo Plano de Acao"}
                </div>
              </div>

              <button className="rn-button" type="button" onClick={closeModal}>
                Fechar
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Titulo *</div>
                <input
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Titulo do plano"
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
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Descricao</div>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descricao detalhada do plano"
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
                  <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Data de inicio *</div>
                  <input
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    required
                    disabled={editingPlano && !isAdmin}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--color-border-input)",
                      background: "var(--color-bg-input)",
                      color: "var(--color-text-main)",
                      opacity: editingPlano && !isAdmin ? 0.65 : 1,
                    }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Previsao de conclusao *</div>
                  <input
                    type="date"
                    value={formData.previsaoConclusao}
                    onChange={(e) => setFormData({ ...formData, previsaoConclusao: e.target.value })}
                    required
                    min={formData.dataInicio}
                    disabled={editingPlano && !isAdmin}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--color-border-input)",
                      background: "var(--color-bg-input)",
                      color: "var(--color-text-main)",
                      opacity: editingPlano && !isAdmin ? 0.65 : 1,
                    }}
                  />
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Responsavel *</div>
                <select
                  value={formData.responsavelId}
                  onChange={(e) => setFormData({ ...formData, responsavelId: e.target.value })}
                  required
                  disabled={editingPlano && !isAdmin}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                    opacity: editingPlano && !isAdmin ? 0.65 : 1,
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
                <button className="rn-button" type="button" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="rn-button primary" type="submit">
                  {editingPlano ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTrativaModal && trativaPlano && (
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
            if (e.target === e.currentTarget) closeTrativaModal();
          }}
        >
          <div
            className="card"
            style={{
              width: "min(600px, 100%)",
              margin: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div className="card-title" style={{ marginBottom: 4 }}>Trativa do Plano: {trativaPlano.titulo}</div>
                <div style={{ opacity: 0.85, fontSize: 12 }}>Responsavel: {trativaPlano.responsavelNome}</div>
              </div>

              <button className="rn-button" type="button" onClick={closeTrativaModal}>
                Fechar
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Trativa</div>
                <textarea
                  value={trativaForm.trativa}
                  onChange={(e) => setTrativaForm({ trativa: e.target.value })}
                  placeholder="Descreva as acoes e o andamento do plano"
                  rows={6}
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

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="rn-button" type="button" onClick={closeTrativaModal}>
                  Cancelar
                </button>
                <button className="rn-button primary" type="button" onClick={saveTrativa}>
                  Salvar Trativa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
