// src/services/api.js
import axios from "axios";
import { audit } from "./clientLogger";

// ===============================
// Base URL
// ===============================
const configuredBaseURL = String(import.meta.env.VITE_API_BASE_URL || "").trim();
const baseURL = configuredBaseURL || "/api";

export const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 60000, // Aumentado para 60 segundos
});

// ===============================
// CorrelationId
// ===============================
const CORR_KEY = "correlationId";

function ensureCorrelationId() {
  let cid = sessionStorage.getItem(CORR_KEY);
  if (!cid) {
    cid =
      crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem(CORR_KEY, cid);
  }
  return cid;
}

// ===============================
// Aplica token salvo ao iniciar (1x)
// ===============================
(function applyAuthTokenAtStartup() {
  const token = localStorage.getItem("token");
  if (token) {
    // Verificar se o token está malformado (JWT deve ter 2 pontos separando 3 partes)
    const dotCount = (token.match(/\./g) || []).length;
    if (dotCount !== 2) {
      console.warn("[AUTH] Token malformado detectado no startup. Limpando...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return;
    }
    if (!api.defaults.headers.common.Authorization) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    }
  }
})();

// ===============================
// Request interceptor
// ===============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["X-Correlation-Id"] = ensureCorrelationId();

    // Auditoria automática CPF
    try {
      const url = String(config.url || "");
      if (url.includes("/renegociacoes/")) {
        const parte = url.split("/renegociacoes/")[1] || "";
        const cpf = parte.split("?")[0].trim();

        if (cpf) {
          sessionStorage.setItem("cpfAtual", cpf);
          audit("CPF_PESQUISADO", { cpf });
        }
      }
    } catch {
      // não quebra
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===============================
// Response interceptor
// ===============================
let isRedirectingToLogin = false;

api.interceptors.response.use(
  (res) => {
    try {
      const cid = res?.headers?.["x-correlation-id"];
      if (cid) sessionStorage.setItem(CORR_KEY, cid);
    } catch {}
    return res;
  },
  (err) => {
    // Só redirecionar se não for na rota de login e se for 401
    if (err?.response?.status === 401 && !isRedirectingToLogin && !window.location.pathname.includes('/login')) {
      isRedirectingToLogin = true;

      console.warn("[AUTH] Token inválido ou expirado. Redirecionando...");

      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete api.defaults.headers.common.Authorization;

      // 🔴 fora do React Router propositalmente
      window.location.replace("/login");
    }

    // Log detalhado do erro para debug
    console.error("[API ERROR]", {
      status: err?.response?.status,
      statusText: err?.response?.statusText,
      data: err?.response?.data,
      baseURL: err?.config?.baseURL,
      url: err?.config?.url,
      method: err?.config?.method
    });

    // Se o token estiver malformado (não tem pontos), também redirecionar
    const token = localStorage.getItem("token");
    if (token && !token.includes('.') && !isRedirectingToLogin && !window.location.pathname.includes('/login')) {
      isRedirectingToLogin = true;
      console.warn("[AUTH] Token malformado detectado. Redirecionando para login...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      delete api.defaults.headers.common.Authorization;
      window.location.replace("/login");
    }

    return Promise.reject(err);
  }
);

// ===============================
// Helper opcional
// ===============================
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem("token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem("token");
    delete api.defaults.headers.common.Authorization;
  }
}
