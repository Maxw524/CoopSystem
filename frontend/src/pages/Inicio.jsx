import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function Inicio() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dataAtual, setDataAtual] = useState("");
  const [horaAtual, setHoraAtual] = useState("");
  const [estatisticas, setEstatisticas] = useState({
    operacoesHoje: 0,
    totalAprovado: 0
  });
  const [carregando, setCarregando] = useState(false);

  // Estatísticas simuladas para página inicial
  const buscarEstatisticas = async () => {
    try {
      setCarregando(true);
      
      // Valores simulados para página inicial (não busca da API)
      const operacoesHoje = 0;
      const totalAprovado = 0;
      
      setEstatisticas({
        operacoesHoje,
        totalAprovado
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      // Manter valores fixos em caso de erro
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    const atualizarDataHora = () => {
      const agora = new Date();
      setDataAtual(agora.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }));
      setHoraAtual(agora.toLocaleTimeString('pt-BR'));
    };

    atualizarDataHora();
    const interval = setInterval(atualizarDataHora, 1000);
    return () => clearInterval(interval);
  }, []);

  // Buscar estatísticas ao carregar a página
  useEffect(() => {
    buscarEstatisticas();
    
    // Atualizar a cada 30 segundos
    const intervalEstatisticas = setInterval(buscarEstatisticas, 30000);
    return () => clearInterval(intervalEstatisticas);
  }, []);

  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px" }}>
      {/* Header Principal */}
      <div style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "16px",
        padding: "32px",
        marginBottom: "32px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
        color: "white"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "700", marginBottom: "8px" }}>
              Sicoob Credipinho
            </h1>
            <p style={{ margin: 0, fontSize: "16px", opacity: 0.9 }}>
              Sistema Cooperativo de Crédito
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "14px", opacity: 0.8 }}>{dataAtual}</div>
            <div style={{ fontSize: "24px", fontWeight: "600" }}>{horaAtual}</div>
          </div>
        </div>
      </div>

      
      {/* Grid de Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "24px",
        marginBottom: "32px"
      }}>
        
        {/* Card de Acesso Rápido */}
        <div style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-card)",
          borderRadius: "12px",
          padding: "24px",
          transition: "all 0.3s ease",
          cursor: "pointer"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "20px",
              marginRight: "16px"
            }}>
              🚀
            </div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
              Acesso Rápido
            </h3>
          </div>
          <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
            Acesse rapidamente as principais funcionalidades do sistema
          </p>
        </div>

        {/* Card de Estatísticas */}
        <div style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-card)",
          borderRadius: "12px",
          padding: "24px",
          transition: "all 0.3s ease"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "20px",
              marginRight: "16px"
            }}>
              📊
            </div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
              Estatísticas do Sistema
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ textAlign: "center", padding: "12px", background: "rgba(102, 126, 234, 0.1)", borderRadius: "8px" }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#667eea" }}>
                {carregando ? "..." : estatisticas.operacoesHoje}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Operações Realizadas Hoje</div>
            </div>
            <div style={{ textAlign: "center", padding: "12px", background: "rgba(245, 87, 108, 0.1)", borderRadius: "8px" }}>
              <div style={{ fontSize: "24px", fontWeight: "700", color: "#f5576c" }}>
                {carregando ? "..." : formatarMoeda(estatisticas.totalAprovado)}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Total Aprovado</div>
            </div>
          </div>
        </div>

        {/* Card de Atividades */}
        <div style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-card)",
          borderRadius: "12px",
          padding: "24px",
          transition: "all 0.3s ease"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "20px",
              marginRight: "16px"
            }}>
              📋
            </div>
            <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600" }}>
              Atividades Recentes
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ 
              padding: "8px 12px", 
              background: "rgba(79, 172, 254, 0.1)", 
              borderRadius: "6px",
              fontSize: "12px",
              color: "var(--color-text-main)"
            }}>
              ✅ Nenhuma atividade recente
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Informações */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr",
        gap: "24px"
      }}>
        
        {/* Quadro de Avisos Modernizado */}
        <div style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-card)",
          borderRadius: "12px",
          padding: "24px"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "18px",
              marginRight: "12px"
            }}>
              📢
            </div>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
              Central de Avisos
            </h3>
          </div>
          
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid rgba(250, 112, 154, 0.3)",
              background: "rgba(250, 112, 154, 0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "16px", marginRight: "8px" }}>🔔</span>
                <div style={{ fontWeight: "600", color: "#fa709a" }}>Manutenção Programada</div>
              </div>
              <div style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                Sistema passará por manutenção constante
              </div>
            </div>
            
            <div style={{
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid rgba(79, 172, 254, 0.3)",
              background: "rgba(79, 172, 254, 0.05)"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "16px", marginRight: "8px" }}>🎉</span>
                <div style={{ fontWeight: "600", color: "#4facfe" }}>Nova Funcionalidade</div>
              </div>
              <div style={{ fontSize: "13px", color: "var(--color-text-muted)", lineHeight: 1.5 }}>
                Sistema de checklist agora disponível com geração de PDF
              </div>
            </div>
          </div>
        </div>

        {/* Atalhos e Links Úteis */}
        <div style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-card)",
          borderRadius: "12px",
          padding: "24px"
        }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "18px",
              marginRight: "12px"
            }}>
              ⚡
            </div>
            <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>
              Atalhos
            </h3>
          </div>
          
          <div style={{ display: "grid", gap: "12px" }}>
            <div style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border-input)",
              background: "var(--color-bg-input)",
              fontSize: "13px",
              color: "var(--color-text-main)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}>
              📑 Simulador de Taxa
            </div>
            <div style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border-input)",
              background: "var(--color-bg-input)",
              fontSize: "13px",
              color: "var(--color-text-main)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}>
              📋 Checklist de Cadastro
            </div>
            <div style={{
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border-input)",
              background: "var(--color-bg-input)",
              fontSize: "13px",
              color: "var(--color-text-main)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }} onClick={() => navigate("/renegociacao")}>
              🔄 Renegociação
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div style={{
        textAlign: "center",
        padding: "24px",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-card)",
        borderRadius: "12px",
        color: "var(--color-text-muted)",
        fontSize: "14px"
      }}>
        <p style={{ margin: 0, marginBottom: "8px" }}>
          🏦 <strong>Sicoob Credipinho</strong> 
        </p>
        <p style={{ margin: 0 }}>
          Desenvolvido por Max Willian  •  Versão 2.0 
        </p>
      </div>
    </div>
  );
}
