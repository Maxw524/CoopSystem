import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

function resolveModules(user) {
  const modulos = [];

  if (user?.admin || user?.permiteJuridico) modulos.push("Juridico");
  if (user?.admin || user?.permiteSistrawts) modulos.push("Sistrawts");
  if (user?.admin || user?.permiteSimuladorTaxa) modulos.push("Simulador de Taxa");

  return modulos;
}


export default function AdminUsuarios() {
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState("");
  const [setores, setSetores] = useState([]);
  const [uUsername, setUUsername] = useState("");
  const [uNomeCompleto, setUNomeCompleto] = useState("");
  const [uEmail, setUEmail] = useState("");
  const [uPassword, setUPassword] = useState("");
  const [uAdmin, setUAdmin] = useState(false);
  const [uPermiteJuridico, setUPermiteJuridico] = useState(false);
  const [uPermiteSistrawts, setUPermiteSistrawts] = useState(false);
  const [uPermiteSimuladorTaxa, setUPermiteSimuladorTaxa] = useState(false);
  const [uSetorId, setUSetorId] = useState("");
  const [showNewUserModal, setShowNewUserModal] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [editingUser, setEditingUser] = useState(null);
  const [editNomeCompleto, setEditNomeCompleto] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAdmin, setEditAdmin] = useState(false);
  const [editPermiteJuridico, setEditPermiteJuridico] = useState(false);
  const [editPermiteSistrawts, setEditPermiteSistrawts] = useState(false);
  const [editPermiteSimuladorTaxa, setEditPermiteSimuladorTaxa] = useState(false);
  const [editSetorId, setEditSetorId] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const usersSorted = useMemo(() => {
    return [...(users || [])].sort((a, b) => String(a.username).localeCompare(String(b.username)));
  }, [users]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      setUsersError("");
      const { data } = await api.get("/usuario");
      setUsers(data || []);
    } catch (error) {
      console.error("[Usuarios] Falha ao carregar lista de usuarios.", error);
      setUsers([]);
      setUsersError("Falha ao carregar a lista de usuarios da API.");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function loadSetores() {
    try {
      const { data } = await api.get("/setor");
      setSetores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("[Setores] Falha ao carregar lista de setores.", error);
      setSetores([]);
    }
  }

  
  async function createUser(e) {
    e.preventDefault();

    await api.post("/usuario", {
      username: uUsername,
      nomeCompleto: uNomeCompleto,
      email: uEmail,
      senha: uPassword,
      setorId: uSetorId || null,
      admin: uAdmin,
      permiteJuridico: uAdmin || uPermiteJuridico,
      permiteSistrawts: uAdmin || uPermiteSistrawts,
      permiteSimuladorTaxa: uAdmin || uPermiteSimuladorTaxa,
    });

    setUUsername("");
    setUNomeCompleto("");
    setUEmail("");
    setUPassword("");
    setUSetorId("");
    setUAdmin(false);
    setUPermiteJuridico(false);
    setUPermiteSistrawts(false);
    setUPermiteSimuladorTaxa(false);
    setShowNewUserModal(false);

    await loadUsers();
    alert("Usuario criado com sucesso");
  }

  function openEdit(user) {
    setEditingUser(user);
    setEditNomeCompleto(user.nomeCompleto || "");
    setEditEmail(user.email || "");
    setEditSetorId(user.setorId || "");
    setEditAdmin(user.admin || false);
    setEditPermiteJuridico(user.permiteJuridico || false);
    setEditPermiteSistrawts(user.permiteSistrawts || false);
    setEditPermiteSimuladorTaxa(user.permiteSimuladorTaxa || false);
  }

  function closeEdit() {
    setEditingUser(null);
    setEditNomeCompleto("");
    setEditEmail("");
    setEditSetorId("");
    setEditAdmin(false);
    setEditPermiteJuridico(false);
    setEditPermiteSistrawts(false);
    setEditPermiteSimuladorTaxa(false);
    setSavingEdit(false);
  }

  async function saveEdit() {
    if (!editingUser?.id) return;

    setSavingEdit(true);

    try {
      await api.put(`/usuario/${editingUser.id}`, {
        nomeCompleto: editNomeCompleto,
        email: editEmail,
        setorId: editSetorId || null,
        admin: editAdmin,
        ativo: editingUser.ativo ?? true,
        permiteJuridico: editAdmin || editPermiteJuridico,
        permiteSistrawts: editAdmin || editPermiteSistrawts,
        permiteSimuladorTaxa: editAdmin || editPermiteSimuladorTaxa,
      });

      await loadUsers();
      closeEdit();
      alert("Usuario atualizado com sucesso");
    } finally {
      setSavingEdit(false);
    }
  }

  async function resetPassword(userId) {
    if (!window.confirm("Tem certeza que deseja resetar a senha deste usuario para 123456?")) return;
    try {
      await api.put(`/usuario/${userId}/senha`, { novaSenha: "123456" });
      alert("Senha resetada para 123456 com sucesso");
    } catch (error) {
      alert("Erro ao resetar senha");
    }
  }

  async function deleteUser(id) {
    if (!window.confirm("Remover usuario?")) return;
    await api.delete(`/usuario/${id}`);
    await loadUsers();
  }

  useEffect(() => {
    (async () => {
      await loadUsers();
      await loadSetores();
    })();
  }, []);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, color: "var(--color-text-main)" }}>Usuarios</h1>
          <div style={{ marginTop: 6, color: "var(--color-text-label)", opacity: 0.9 }}>
            Adicionar, editar, remover e definir acesso por modulo e por dashboard
          </div>
        </div>

        <div style={{ color: "var(--color-text-label)", opacity: 0.85, fontSize: 12 }}>
          Total: <b style={{ color: "var(--color-text-main)" }}>{users.length}</b>
        </div>
      </div>

      <div style={{ marginTop: 14 }} className="card">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div className="card-title">Usuarios</div>
          <button 
            className="rn-button primary" 
            type="button" 
            onClick={() => setShowNewUserModal(true)}
          >
            ➕ Novo Usuario
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Lista de usuarios</div>

        {usersError && (
          <div style={{ marginBottom: 12, fontSize: 12, color: "#b91c1c" }}>
            {usersError}
          </div>
        )}

        <div
          style={{
            maxHeight: "55vh",
            overflow: "auto",
            borderRadius: 12,
            border: "1px solid var(--color-border-card)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 10 }}>Username</th>
                <th style={{ textAlign: "left", padding: 10 }}>Nome</th>
                <th style={{ textAlign: "left", padding: 10 }}>E-mail</th>
                <th style={{ textAlign: "left", padding: 10 }}>Setor</th>
                <th style={{ textAlign: "left", padding: 10 }}>Tipo</th>
                <th style={{ textAlign: "left", padding: 10 }}>Modulos</th>
                <th style={{ textAlign: "right", padding: 10 }}>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {usersSorted.map((user) => {
                const modulos = resolveModules(user);

                return (
                  <tr key={user.id} style={{ borderTop: "1px solid var(--color-border-strong)" }}>
                    <td style={{ padding: 10 }}>
                      <b>{user.username}</b>
                    </td>
                    <td style={{ padding: 10 }}>{user.nomeCompleto || "-"}</td>
                    <td style={{ padding: 10, opacity: 0.9 }}>{user.email || "-"}</td>
                    <td style={{ padding: 10, fontSize: 12, color: "var(--color-text-label)" }}>
                      {user.setor || "-"}
                    </td>
                    <td style={{ padding: 10 }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          background: user.admin
                            ? "rgba(34, 197, 94, 0.2)"
                            : "rgba(14, 165, 233, 0.2)",
                          color: user.admin ? "#16a34a" : "#0284c7",
                          fontWeight: "bold",
                        }}
                      >
                        {user.admin ? "Admin" : "Usuario"}
                      </span>
                    </td>
                    <td style={{ padding: 10, fontSize: 12, color: "var(--color-text-label)" }}>
                      {modulos.length ? modulos.join(" | ") : "Sem modulo"}
                    </td>
                    <td style={{ padding: 10, textAlign: "right" }}>
                      <button className="rn-button" type="button" onClick={() => openEdit(user)}>
                        Editar
                      </button>
                      <span style={{ display: "inline-block", width: 8 }} />
                      <button className="rn-button warn" type="button" onClick={() => deleteUser(user.id)}>
                        Remover
                      </button>
                    </td>
                  </tr>
                );
              })}

              {users.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: 16, opacity: 0.85 }}>
                    Nenhum usuario encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showNewUserModal && (
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
            if (e.target === e.currentTarget) setShowNewUserModal(false);
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
                  Novo Usuario
                </div>
                <div style={{ opacity: 0.85, fontSize: 12 }}>Preencha as informações do novo usuario</div>
              </div>

              <button className="rn-button" type="button" onClick={() => setShowNewUserModal(false)}>
                Fechar
              </button>
            </div>

            <form onSubmit={createUser} style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Username</div>
                <input
                  value={uUsername}
                  onChange={(e) => setUUsername(e.target.value)}
                  placeholder="Username"
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
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Nome completo</div>
                <input
                  value={uNomeCompleto}
                  onChange={(e) => setUNomeCompleto(e.target.value)}
                  placeholder="Nome completo"
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
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>E-mail</div>
                <input
                  type="email"
                  value={uEmail}
                  onChange={(e) => setUEmail(e.target.value)}
                  placeholder="E-mail"
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
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Senha</div>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={uPassword}
                  onChange={(e) => setUPassword(e.target.value)}
                  placeholder="Senha"
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
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Setor</div>
                <select
                  value={uSetorId}
                  onChange={(e) => setUSetorId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                  }}
                >
                  <option value="">Selecione um setor (opcional)</option>
                  {setores.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Permissoes</div>

                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={uAdmin} onChange={(e) => setUAdmin(e.target.checked)} />
                    <span>Administrador</span>
                  </label>

                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={uAdmin || uPermiteJuridico}
                      disabled={uAdmin}
                      onChange={(e) => setUPermiteJuridico(e.target.checked)}
                    />
                    <span>Modulo Juridico</span>
                  </label>

                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={uAdmin || uPermiteSistrawts}
                      disabled={uAdmin}
                      onChange={(e) => setUPermiteSistrawts(e.target.checked)}
                    />
                    <span>Modulo Sistrawts</span>
                  </label>

                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={uAdmin || uPermiteSimuladorTaxa}
                      disabled={uAdmin}
                      onChange={(e) => setUPermiteSimuladorTaxa(e.target.checked)}
                    />
                    <span>Modulo Simulador de Taxa</span>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="rn-button" type="button" onClick={() => setShowNewUserModal(false)}>
                  Cancelar
                </button>
                <button
                  className="rn-button primary"
                  type="submit"
                  disabled={!uUsername || !uNomeCompleto || !uEmail || !uPassword}
                >
                  Criar usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
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
            if (e.target === e.currentTarget) closeEdit();
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
                  Editar usuario
                </div>
                <div style={{ opacity: 0.85, fontSize: 12 }}>{editingUser.username}</div>
              </div>

              <button className="rn-button" type="button" onClick={closeEdit}>
                Fechar
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Nome completo</div>
                <input
                  value={editNomeCompleto}
                  onChange={(e) => setEditNomeCompleto(e.target.value)}
                  placeholder="Nome completo"
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
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>E-mail</div>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="E-mail"
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
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Setor</div>
                <select
                  value={editSetorId}
                  onChange={(e) => setEditSetorId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                  }}
                >
                  <option value="">Selecione um setor (opcional)</option>
                  {setores.map((setor) => (
                    <option key={setor.id} value={setor.id}>
                      {setor.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Permissoes</div>

                <div style={{ display: "grid", gap: 8 }}>
                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input type="checkbox" checked={editAdmin} onChange={(e) => setEditAdmin(e.target.checked)} />
                    <span>Administrador</span>
                  </label>

                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={editAdmin || editPermiteJuridico}
                      disabled={editAdmin}
                      onChange={(e) => setEditPermiteJuridico(e.target.checked)}
                    />
                    <span>Modulo Juridico</span>
                  </label>

                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={editAdmin || editPermiteSistrawts}
                      disabled={editAdmin}
                      onChange={(e) => setEditPermiteSistrawts(e.target.checked)}
                    />
                    <span>Modulo Sistrawts</span>
                  </label>

                  <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={editAdmin || editPermiteSimuladorTaxa}
                      disabled={editAdmin}
                      onChange={(e) => setEditPermiteSimuladorTaxa(e.target.checked)}
                    />
                    <span>Modulo Simulador de Taxa</span>
                  </label>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 6 }}>Senha</div>
                <button
                  type="button"
                  className="rn-button warn"
                  onClick={() => resetPassword(editingUser.id)}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                  }}
                >
                  Resetar senha para 123456
                </button>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="rn-button" type="button" onClick={closeEdit} disabled={savingEdit}>
                  Cancelar
                </button>
                <button className="rn-button primary" type="button" onClick={saveEdit} disabled={savingEdit}>
                  {savingEdit ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
