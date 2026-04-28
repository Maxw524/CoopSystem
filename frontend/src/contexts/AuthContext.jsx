import { createContext, useContext, useEffect, useRef, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

const IDLE_LIMIT_MS = 4 * 60 * 60 * 1000; // 4 hours
const LAST_ACTIVITY_KEY = "lastActivityAt";
const LOGOUT_EVENT_KEY = "logoutEvent";

function buildRolesFromPermissions(user) {
  const roles = [];

  if (user?.admin) roles.push("Admin");
  if (user?.permiteJuridico || user?.admin) roles.push("Juridico");
  if (user?.permiteSimuladorTaxa || user?.admin) roles.push("Credito I");
  if (user?.permiteSistrawts || user?.admin) roles.push("Sistrawts");

  if (roles.length === 0) roles.push("User");

  return Array.from(new Set(roles));
}

function normalizeUserShape(rawUser) {
  if (!rawUser) return null;

  const existingRoles = Array.isArray(rawUser.roles) ? rawUser.roles : [];
  const existingPermissions = Array.isArray(rawUser.permissions)
    ? rawUser.permissions
    : Array.isArray(rawUser.permissoes)
      ? rawUser.permissoes
      : [];
  const admin = rawUser.admin === true || existingRoles.includes("Admin");
  const permiteJuridico = rawUser.permiteJuridico === true || admin || existingRoles.includes("Juridico");
  const permiteSistrawts = rawUser.permiteSistrawts === true || admin || existingRoles.includes("Sistrawts");
  const permiteSimuladorTaxa =
    rawUser.permiteSimuladorTaxa === true || admin || existingRoles.includes("Credito I");

  const computedRoles =
    existingRoles.length > 0
      ? Array.from(new Set(existingRoles))
      : buildRolesFromPermissions({ admin, permiteJuridico, permiteSistrawts, permiteSimuladorTaxa });

  const username =
    rawUser.username ||
    rawUser.usuario ||
    rawUser.user ||
    rawUser.login ||
    "";

  const nomeCompleto =
    rawUser.nomeCompleto ||
    rawUser.nome ||
    "";

  const setor =
    rawUser.setor ||
    "";

  return {
    ...rawUser,
    id: rawUser.id ?? null,
    username,
    usuario: username,
    nomeCompleto,
    nome: nomeCompleto,
    email: rawUser.email || "",
    setor,
    admin,
    permiteJuridico,
    permiteSistrawts,
    permiteSimuladorTaxa,
    roles: computedRoles,
    permissions: Array.from(new Set(existingPermissions)),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const idleTimerRef = useRef(null);

  function clearIdleTimer() {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  }

  function scheduleIdleLogout() {
    clearIdleTimer();

    idleTimerRef.current = setTimeout(() => {
      logout(true);
    }, IDLE_LIMIT_MS);
  }

  function markActivity() {
    const token = localStorage.getItem("token");
    if (!token) return;

    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    scheduleIdleLogout();
  }

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const userStr = localStorage.getItem("user");

      if (token && userStr) {
        api.defaults.headers.common.Authorization = `Bearer ${token}`;

        try {
          const parsed = JSON.parse(userStr);
          const normalized = normalizeUserShape(parsed);
          setUser(normalized);

          if (normalized) {
            localStorage.setItem("user", JSON.stringify(normalized));
          }
        } catch {
          setUser(null);
          localStorage.removeItem("user");
        }
      } else {
        setUser(null);
      }
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      clearIdleTimer();
      return;
    }

    const last = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || "0");
    const now = Date.now();

    if (last > 0 && now - last >= IDLE_LIMIT_MS) {
      logout(true);
      return;
    }

    scheduleIdleLogout();

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    const handler = () => markActivity();

    events.forEach((evt) => window.addEventListener(evt, handler, { passive: true }));

    const onStorage = (e) => {
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        scheduleIdleLogout();
      }

      if (e.key === LOGOUT_EVENT_KEY && e.newValue) {
        logout(false);
      }
    };

    window.addEventListener("storage", onStorage);
    markActivity();

    return () => {
      clearIdleTimer();
      events.forEach((evt) => window.removeEventListener(evt, handler));
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function login({ usuario, senha }) {
    const { data } = await api.post("/auth/login", {
      username: usuario,
      password: senha,
    });

    if (!data?.token) {
      throw new Error("Token ausente na resposta de login");
    }

    localStorage.setItem("token", data.token);

    const apiUser = data?.usuario ?? null;
    const fallbackUsername = data?.user ?? usuario;

    const baseUser = {
      id: apiUser?.id ?? null,
      username: apiUser?.username ?? fallbackUsername,
      usuario: apiUser?.username ?? fallbackUsername,
      nomeCompleto: apiUser?.nomeCompleto ?? "",
      nome: apiUser?.nomeCompleto ?? "",
      email: apiUser?.email ?? "",
      setor: apiUser?.setor ?? "",
      admin: apiUser?.admin === true,
      permiteJuridico: apiUser?.permiteJuridico === true,
      permiteSistrawts: apiUser?.permiteSistrawts === true,
      permiteSimuladorTaxa: apiUser?.permiteSimuladorTaxa === true,
      roles: Array.isArray(data?.roles) ? data.roles : [],
      permissions: Array.isArray(apiUser?.permissions)
        ? apiUser.permissions
        : Array.isArray(apiUser?.permissoes)
          ? apiUser.permissoes
          : Array.isArray(data?.permissions)
            ? data.permissions
            : Array.isArray(data?.permissoes)
              ? data.permissoes
              : [],
    };

    const normalizedUser = normalizeUserShape(baseUser);

    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

    api.defaults.headers.common.Authorization = `Bearer ${data.token}`;
    setUser(normalizedUser);

    return normalizedUser;
  }

  function logout(broadcast = true) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem(LAST_ACTIVITY_KEY);

    if (broadcast) {
      localStorage.setItem(LOGOUT_EVENT_KEY, String(Date.now()));
    }

    delete api.defaults.headers.common.Authorization;
    clearIdleTimer();
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        checking,
        login,
        logout,
        markActivity,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
