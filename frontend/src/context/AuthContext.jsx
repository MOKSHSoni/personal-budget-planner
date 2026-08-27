import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import authService from "../services/authService";

export const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem("bp_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("bp_token"));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("bp_token")));

  const persist = useCallback((nextUser, nextToken) => {
    if (nextToken) {
      localStorage.setItem("bp_token", nextToken);
      setToken(nextToken);
    }
    if (nextUser) {
      localStorage.setItem("bp_user", JSON.stringify(nextUser));
      setUser(nextUser);
    }
  }, []);

  // Revalidate the stored token against the API on first load.
  useEffect(() => {
    let active = true;
    if (!localStorage.getItem("bp_token")) {
      setLoading(false);
      return () => {};
    }
    authService
      .getProfile()
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        localStorage.setItem("bp_user", JSON.stringify(data.user));
      })
      .catch(() => {
        if (!active) return;
        localStorage.removeItem("bp_token");
        localStorage.removeItem("bp_user");
        setUser(null);
        setToken(null);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Apply the user's saved theme preference.
  useEffect(() => {
    const dark = user?.theme === "dark";
    document.documentElement.classList.toggle("dark", dark);
  }, [user?.theme]);

  const login = useCallback(
    async (credentials) => {
      const data = await authService.login(credentials);
      persist(data.user, data.token);
      return data.user;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const data = await authService.register(payload);
      persist(data.user, data.token);
      return data.user;
    },
    [persist]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // stateless JWT — clearing the client session is enough
    }
    localStorage.removeItem("bp_token");
    localStorage.removeItem("bp_user");
    setUser(null);
    setToken(null);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    localStorage.setItem("bp_user", JSON.stringify(nextUser));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token && user),
      currency: user?.currency || "INR",
      login,
      register,
      logout,
      updateUser,
    }),
    [user, token, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
