import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function AdminSetores() {
  const [setores, setSetores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingSetor, setEditingSetor] = useState(null);
  const [formData, setFormData] = useState({ nome: "", descricao: "", ativo: true });

  useEffect(() => {
    loadSetores();
  }, []);

  async function loadSetores() {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/setor");
      setSetores(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Nao foi possivel carregar os setores.");
      setSetores([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingSetor) {
        await api.put(`/setor/${editingSetor.id}`, formData);
      } else {
        await api.post("/setor", formData);
      }
      setShowModal(false);
      setEditingSetor(null);
      setFormData({ nome: "", descricao: "", ativo: true });
      loadSetores();
    } catch (err) {
      setError(editingSetor ? "Erro ao atualizar setor." : "Erro ao criar setor.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Tem certeza que deseja excluir este setor?")) return;
    try {
      await api.delete(`/setor/${id}`);
      loadSetores();
    } catch (err) {
      setError("Erro ao excluir setor.");
    }
  }

  function openModal(setor = null) {
    if (setor) {
      setEditingSetor(setor);
      setFormData({
        nome: setor.nome,
        descricao: setor.descricao || "",
        ativo: setor.ativo
      });
    } else {
      setEditingSetor(null);
      setFormData({ nome: "", descricao: "", ativo: true });
    }
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingSetor(null);
    setFormData({ nome: "", descricao: "", ativo: true });
  }

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--color-text-main)" }}>Gerenciar Setores</h1>
          <div style={{ marginTop: 6, color: "var(--color-text-label)", opacity: 0.9 }}>
            Cadastre e gerencie os setores disponiveis para atribuicao aos usuarios.
          </div>
        </div>
        <button
          className="rn-button primary"
          onClick={() => openModal()}
          style={{ padding: "8px 16px", fontSize: "14px" }}
        >
          Novo Setor
        </button>
      </div>

      {loading && (
        <div className="card" style={{ marginTop: 16 }}>
          Carregando setores...
        </div>
      )}

      {!loading && error && (
        <div className="card" style={{ marginTop: 16, color: "#b91c1c" }}>
          {error}
        </div>
      )}

      {!loading && !error && setores.length === 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          Nenhum setor cadastrado.
        </div>
      )}

      {!loading && !error && setores.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e5e7eb", textAlign: "left" }}>
                <th style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: "var(--color-text-label)" }}>
                  Nome
                </th>
                <th style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: "var(--color-text-label)" }}>
                  Descricao
                </th>
                <th style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: "var(--color-text-label)" }}>
                  Status
                </th>
                <th style={{ padding: "12px", fontSize: "13px", fontWeight: "600", color: "var(--color-text-label)" }}>
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody>
              {setores.map((setor) => (
                <tr key={setor.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px", fontSize: "14px", color: "var(--color-text-main)" }}>
                    {setor.nome}
                  </td>
                  <td style={{ padding: "12px", fontSize: "14px", color: "var(--color-text-label)" }}>
                    {setor.descricao || "-"}
                  </td>
                  <td style={{ padding: "12px", fontSize: "14px" }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        fontWeight: "500",
                        backgroundColor: setor.ativo ? "#dcfce7" : "#fee2e2",
                        color: setor.ativo ? "#166534" : "#991b1b"
                      }}
                    >
                      {setor.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ padding: "12px", fontSize: "14px" }}>
                    <button
                      className="rn-button"
                      onClick={() => openModal(setor)}
                      style={{ padding: "6px 12px", fontSize: "13px", marginRight: "8px" }}
                    >
                      Editar
                    </button>
                    <button
                      className="rn-button"
                      onClick={() => handleDelete(setor.id)}
                      style={{
                        padding: "6px 12px",
                        fontSize: "13px",
                        backgroundColor: "#fee2e2",
                        color: "#991b1b"
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <h2 style={{ margin: "0 0 16px 0", color: "var(--color-text-main)" }}>
              {editingSetor ? "Editar Setor" : "Novo Setor"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--color-text-label)" }}>
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  required
                  maxLength={100}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    boxSizing: "border-box"
                  }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "13px", color: "var(--color-text-label)" }}>
                  Descricao
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  maxLength={500}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    fontSize: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                    resize: "vertical"
                  }}
                />
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", fontSize: "14px", color: "var(--color-text-main)" }}>
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    style={{ marginRight: "8px" }}
                  />
                  Ativo
                </label>
              </div>
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="rn-button"
                  onClick={closeModal}
                  style={{ padding: "8px 16px", fontSize: "14px" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rn-button primary"
                  style={{ padding: "8px 16px", fontSize: "14px" }}
                >
                  {editingSetor ? "Salvar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
