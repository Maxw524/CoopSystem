import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function TrocarSenha() {
  const navigate = useNavigate();
  const { user, markActivity } = useAuth();

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Nome do usuario vindo do seu AuthContext:
  // voce salva u = { user: data.user, roles: [...] }
  const nomeUsuario =
    typeof user === "string"
      ? user
      : user?.nome ||
        user?.usuario ||
        user?.user ||
        user?.login ||
        "Usuario";

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setSucesso("");

    if (!senhaAtual || !novaSenha || !confirmacaoSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (novaSenha.length < 6) {
      setErro("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmacaoSenha) {
      setErro("A nova senha e a confirmacao nao conferem.");
      return;
    }

    try {
      setCarregando(true);

      if (markActivity) markActivity();

      const { data } = await api.post("/Conta/alterar-senha", {
        senhaAtual,
        novaSenha,
      });

      setSucesso(data?.mensagem || "Senha alterada com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacaoSenha("");
    } catch (err) {
      console.error(err);

      const status = err?.response?.status;
      const mensagemApi = err?.response?.data?.mensagem;

      if (status === 401) {
        setErro(mensagemApi || "Sua sessao expirou. Faca login novamente.");
        return;
      }

      setErro(mensagemApi || "Erro inesperado ao alterar a senha. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(1200px 600px at 20% -5%, var(--bg-grad-1), transparent 50%), var(--bg)",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-card)",
          borderRadius: 12,
          boxShadow: "var(--shadow)",
          padding: 24,
          width: "100%",
          maxWidth: 420,
          color: "var(--color-text-main)",
          fontFamily:
            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
        }}
      >
        <h2
          style={{
            margin: 0,
            marginBottom: 4,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          Trocar senha
        </h2>

        <p
          style={{
            margin: 0,
            marginBottom: 16,
            fontSize: 13,
            color: "var(--color-text-label)",
          }}
        >
          Altere a sua senha de acesso ao sistema.
        </p>

        <div
          style={{
            marginBottom: 16,
            padding: 10,
            borderRadius: 8,
            background: "var(--color-bg-input)",
            border: "1px solid var(--color-border-input)",
            fontSize: 13,
          }}
        >
          <div style={{ color: "var(--color-text-label)", marginBottom: 4 }}>Usuario</div>
          <div style={{ fontWeight: 600 }}>{nomeUsuario}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                marginBottom: 4,
                fontSize: 13,
                color: "var(--color-text-label)",
              }}
            >
              Senha atual
            </label>
            <input
              type="password"
              value={senhaAtual}
              onChange={(e) => setSenhaAtual(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid var(--color-border-input)",
                background: "var(--color-bg-input)",
                color: "var(--color-text-main)",
                outline: "none",
              }}
              autoComplete="current-password"
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label
              style={{
                display: "block",
                marginBottom: 4,
                fontSize: 13,
                color: "var(--color-text-label)",
              }}
            >
              Nova senha
            </label>
            <input
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid var(--color-border-input)",
                background: "var(--color-bg-input)",
                color: "var(--color-text-main)",
                outline: "none",
              }}
              autoComplete="new-password"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 4,
                fontSize: 13,
                color: "var(--color-text-label)",
              }}
            >
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmacaoSenha}
              onChange={(e) => setConfirmacaoSenha(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 10,
                border: "1px solid var(--color-border-input)",
                background: "var(--color-bg-input)",
                color: "var(--color-text-main)",
                outline: "none",
              }}
              autoComplete="new-password"
            />
          </div>

          {erro && (
            <div
              style={{
                marginBottom: 12,
                padding: 8,
                borderRadius: 8,
                background: "#451a1a",
                border: "1px solid #b91c1c",
                color: "#fecaca",
                fontSize: 13,
              }}
            >
              {erro}
            </div>
          )}

          {sucesso && (
            <div
              style={{
                marginBottom: 12,
                padding: 8,
                borderRadius: 8,
                background: "#022c22",
                border: "1px solid #16a34a",
                color: "#bbf7d0",
                fontSize: 13,
              }}
            >
              {sucesso}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                borderRadius: 10,
                border: "1px solid var(--color-border-input)",
                background: "var(--color-bg-input)",
                color: "var(--color-text-main)",
                padding: "8px 12px",
                cursor: "pointer",
              }}
            >
              Voltar
            </button>

            <button
              type="submit"
              disabled={carregando}
              style={{
                borderRadius: 10,
                border: "1px solid var(--color-primary-2)",
                background: carregando
                  ? "linear-gradient(180deg, var(--color-primary-2), var(--color-primary-2))"
                  : "linear-gradient(180deg, var(--color-primary), var(--color-primary-2))",
                color: "#ffffff",
                padding: "8px 16px",
                cursor: carregando ? "default" : "pointer",
                fontWeight: 600,
              }}
            >
              {carregando ? "Salvando..." : "Salvar nova senha"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
