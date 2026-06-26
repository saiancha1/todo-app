"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "./api";

interface AuthContextValue {
  email: string | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Rehydrate session from localStorage on first mount.
  useEffect(() => {
    const token = tokenStore.get();
    if (token) setEmail(tokenStore.getEmail());
    setInitializing(false);
  }, []);

  const login = useCallback(async (e: string, password: string) => {
    const res = await api.login(e, password);
    tokenStore.set(res.token, res.email);
    setEmail(res.email);
  }, []);

  const register = useCallback(async (e: string, password: string) => {
    const res = await api.register(e, password);
    tokenStore.set(res.token, res.email);
    setEmail(res.email);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setEmail(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ email, isAuthenticated: !!email, initializing, login, register, logout }),
    [email, initializing, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
