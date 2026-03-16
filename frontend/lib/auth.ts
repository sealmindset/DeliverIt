"use client";

import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { apiGet, apiPost, BASE_URL } from "./api";
import type { AuthMe } from "./types";
import React from "react";

interface AuthContextValue {
  authMe: AuthMe | null;
  loading: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  authMe: null,
  loading: true,
  hasPermission: () => false,
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authMe, setAuthMe] = useState<AuthMe | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const data = await apiGet<AuthMe>("/auth/me");
      setAuthMe(data);
    } catch {
      setAuthMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      if (!authMe) return false;
      const perm = `${resource}.${action}`;
      return authMe.permissions.includes(perm);
    },
    [authMe]
  );

  const logout = useCallback(async () => {
    try {
      await apiPost("/auth/logout");
    } catch {
      // ignore errors on logout
    }
    setAuthMe(null);
    window.location.href = "/";
  }, []);

  const value: AuthContextValue = {
    authMe,
    loading,
    hasPermission,
    logout,
    refresh: fetchMe,
  };

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function getLoginUrl(): string {
  return `${BASE_URL}/auth/login`;
}
