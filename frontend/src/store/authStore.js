/**
 * Authentication Store (Zustand)
 * Manages authentication state and user information
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      permissions: [],

      setAuth: (user, token, permissions) => {
        set({
          user,
          token,
          permissions: permissions || [],
          isAuthenticated: true,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          permissions: [],
          isAuthenticated: false,
        });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      hasPermission: (permission) => {
        const state = useAuthStore.getState();
        return state.permissions.includes(permission);
      },

      hasAnyPermission: (permissions) => {
        const state = useAuthStore.getState();
        return permissions.some((perm) => state.permissions.includes(perm));
      },

      hasAllPermissions: (permissions) => {
        const state = useAuthStore.getState();
        return permissions.every((perm) => state.permissions.includes(perm));
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export { useAuthStore };

