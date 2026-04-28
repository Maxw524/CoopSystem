import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/inicio";

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErro("");
    setLoading(true);

    try {
      await login({ usuario, senha });
      navigate(from, { replace: true });
    } catch (error) {
      console.error("[LOGIN ERROR]", error);
      
      // Mostrar erro detalhado no console para debug
      if (error.response) {
        console.error("[LOGIN ERROR DETAILS]", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          url: error.config?.url
        });
      }
      
      // Mensagem amigável para o usuário
      if (error.response?.status === 401) {
        setErro("Usuário ou senha incorretos.");
      } else if (error.response?.status === 400) {
        setErro("Dados inválidos. Verifique usuário e senha.");
      } else if (error.code === "ECONNABORTED") {
        setErro("Timeout. Tente novamente.");
      } else if (!navigator.onLine) {
        setErro("Sem conexão com a internet.");
      } else {
        setErro("Erro ao fazer login. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0f1b",
        padding: "20px",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "340px",
          padding: "24px 20px",
          background: "#111827",
          borderRadius: 12,
          border: "1px solid #1f2937",
          color: "#e5e7eb",
          boxShadow: "0 4px 25px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <img src="/logo_recoopera.png" alt="Recoopera" style={{ width: "130px", height: "auto" }} />
        </div>

        <label style={{ fontSize: 18, fontWeight: 600 }}>Usuario</label>
        <input
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username"
          style={{
            width: "100%",
            padding: 12,
            margin: "6px 0 14px",
            borderRadius: 6,
            background: "#1f2937",
            border: "1px solid #374151",
            color: "#fff",
            fontSize: 15,
            boxSizing: "border-box",
          }}
          placeholder="Digite seu usuario"
        />

        <label style={{ fontSize: 18, fontWeight: 600 }}>Senha</label>
        <input
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          style={{
            width: "100%",
            padding: 12,
            margin: "6px 0 14px",
            borderRadius: 6,
            background: "#1f2937",
            border: "1px solid #374151",
            color: "#fff",
            fontSize: 15,
            boxSizing: "border-box",
          }}
          placeholder="Digite sua senha"
        />

        {erro && (
          <div
            style={{
              background: "#7f1d1d",
              padding: 12,
              borderRadius: 6,
              color: "#fecaca",
              marginBottom: 12,
              fontSize: 14,
              textAlign: "center",
            }}
          >
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 6,
            background: "#059669",
            border: "none",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 16,
            boxSizing: "border-box",
          }}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <div style={{ textAlign: "center", marginTop: 40 }}>
          <img src="/logo.png" alt="Sicoob Credipinho" style={{ width: "110px", height: "auto" }} />
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          v1.1.0
        </div>
      </form>
    </div>
  );
}
