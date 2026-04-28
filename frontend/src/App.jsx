import { useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import RequireAuth from "./components/RequireAuth";
import RedirectIfAuthenticated from "./components/RedirectIfAuthenticated";

import AuditTracker from "./components/AuditTracker";
import AppShell from "./components/AppShell";
import RequireRole from "./components/RequireRole";
import RequireModuleAccess from "./components/RequireModuleAccess";

import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import Renegociacao from "./pages/Renegociacao";
import AdminUsuarios from "./pages/AdminUsuarios";
import AdminRecooperaTaxas from "./pages/AdminRecooperaTaxas";
import SimulacaoNegociacao from "./pages/SimulacaoNegociacao";
import TrocarSenha from "./pages/TrocarSenha"; // IMPORTA A PÁGINA
import Juridico from "./pages/Juridico";
import CreditoSimuladorTaxa from "./pages/CreditoSimuladorTaxa";
import CreditoChecklistCadastro from "./pages/CreditoChecklistCadastro";
import DashboardViewer from "./pages/DashboardViewer";
import AdminSetores from "./pages/AdminSetores";
import SistrawtsPlanosAcao from "./pages/SistrawtsPlanosAcao";
import SistrawtsMicroAcoes from "./pages/SistrawtsMicroAcoes";
import SistrawtsRelatorioPlano from "./pages/SistrawtsRelatorioPlano";
import SistrawtsIndicadores from "./pages/SistrawtsIndicadores";
import SistrawtsDashboardIndicadores from "./pages/SistrawtsDashboardIndicadores";

import { api } from "./services/api";
import { setMatrizTaxasCampanha } from "./utils/taxasCampanha";

// Importar estilos do layout
import "./styles/layout.css";

export default function App() {
  // Evita dupla execução no modo dev
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    (async () => {
      try {
        const { data } = await api.get("/config/taxas-campanha");
        setMatrizTaxasCampanha(data);
        console.log("[Taxas] Matriz carregada do backend");
      } catch (err) {
        console.warn("[Taxas] Falha ao carregar do backend. Usando fallback.", err);
      }
    })();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* auditoria global */}
        <AuditTracker />

        <Routes>
          {/* ✅ Ao entrar só no IP "/" -> /login */}
          <Route index element={<Navigate to="/login" replace />} />

          {/* LOGIN — protegido contra usuário já autenticado */}
          <Route
            path="/login"
            element={
              <RedirectIfAuthenticated>
                <Login />
              </RedirectIfAuthenticated>
            }
          />

          {/* ROTAS PROTEGIDAS */}
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route path="/inicio" element={<Inicio />} />
              <Route path="/renegociacao" element={<Renegociacao />} />
              
              {/* Rotas do Sistrawts */}
              <Route
                path="/sistrawts"
                element={
                  <RequireModuleAccess moduleKey="sistrawts">
                    <Navigate to="/sistrawts/planos" replace />
                  </RequireModuleAccess>
                }
              />
              <Route
                path="/sistrawts/planos"
                element={
                  <RequireModuleAccess moduleKey="sistrawts">
                    <SistrawtsPlanosAcao />
                  </RequireModuleAccess>
                }
              />
              <Route
                path="/sistrawts/planos/:planoId/microacoes"
                element={
                  <RequireModuleAccess moduleKey="sistrawts">
                    <SistrawtsMicroAcoes />
                  </RequireModuleAccess>
                }
              />
              <Route
                path="/sistrawts/planos/:planoId/relatorio"
                element={
                  <RequireModuleAccess moduleKey="sistrawts">
                    <SistrawtsRelatorioPlano />
                  </RequireModuleAccess>
                }
              />
              <Route path="/sistrawts/microacoes" element={<Navigate to="/sistrawts/planos" replace />} />

              {/* Rotas de Indicadores */}
              <Route
                path="/sistrawts/indicadores"
                element={
                  <RequireModuleAccess moduleKey="sistrawts">
                    <SistrawtsIndicadores />
                  </RequireModuleAccess>
                }
              />
              <Route
                path="/sistrawts/dashboard-indicadores"
                element={
                  <RequireModuleAccess moduleKey="sistrawts">
                    <SistrawtsDashboardIndicadores />
                  </RequireModuleAccess>
                }
              />

              <Route
                path="/credito-simulador-taxa"
                element={
                  <RequireModuleAccess moduleKey="simuladorTaxa">
                    <CreditoSimuladorTaxa />
                  </RequireModuleAccess>
                }
              />

              <Route path="/credito-checklist-cadastro" element={<CreditoChecklistCadastro />} />

              <Route
                path="/simulacao-negociacao"
                element={<SimulacaoNegociacao />}
              />

              <Route path="/dashboards/:slug" element={<DashboardViewer />} />

              <Route
                path="/admin"
                element={<Navigate to="/admin-usuarios" replace />}
              />

              <Route
                path="/admin-usuarios"
                element={
                  <RequireRole allowedRoles={["Admin"]}>
                    <AdminUsuarios />
                  </RequireRole>
                }
              />

              <Route
                path="/admin-setores"
                element={
                  <RequireRole allowedRoles={["Admin"]}>
                    <AdminSetores />
                  </RequireRole>
                }
              />

              <Route
                path="/admin-recoopera-taxas"
                element={
                  <RequireRole allowedRoles={["Admin"]}>
                    <AdminRecooperaTaxas />
                  </RequireRole>
                }
              />

              <Route
                path="/juridico"
                element={
                  <RequireModuleAccess moduleKey="juridico">
                    <Juridico />
                  </RequireModuleAccess>
                }
              />

              {/* ✅ AQUI entra o TrocarSenha */}
              <Route path="/trocar-senha" element={<TrocarSenha />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
