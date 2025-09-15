import React, { useEffect } from 'react';
import { useAuthStore } from './AuthStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * @component AuthProvider
 * @description React provider for authentication setup
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const logout = useAuthStore((state: any) => state.logout);

  useEffect(() => {
    // Listen for auth logout events from API client
    const handleLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [logout]);

  return <>{children}</>;
};

/**
 * @hook useAuth
 * @description Hook to access authentication store
 * @returns The authentication store state and actions
 */
export const useAuth = () => useAuthStore();