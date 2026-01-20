/**
 * RBAC Utilities
 * Helper functions for permission checking
 */

import { useAuthStore } from '../store/authStore';

/**
 * Hook to check if user has a specific permission
 * @param {string} permission - Permission flag to check
 * @returns {boolean}
 */
export const useHasPermission = (permission) => {
  const hasPermission = useAuthStore((state) => state.hasPermission(permission));
  return hasPermission;
};

/**
 * Hook to check if user has any of the permissions
 * @param {string[]} permissions - Array of permission flags
 * @returns {boolean}
 */
export const useHasAnyPermission = (permissions) => {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission(permissions));
  return hasAnyPermission;
};

/**
 * Hook to check if user has all permissions
 * @param {string[]} permissions - Array of permission flags
 * @returns {boolean}
 */
export const useHasAllPermissions = (permissions) => {
  const hasAllPermissions = useAuthStore((state) => state.hasAllPermissions(permissions));
  return hasAllPermissions;
};

/**
 * Component wrapper for permission-based rendering
 * @param {Object} props
 * @param {string|string[]} props.permission - Permission(s) to check
 * @param {boolean} props.requireAll - If true, requires all permissions; if false, requires any
 * @param {React.ReactNode} props.children - Content to render if permission check passes
 * @param {React.ReactNode} props.fallback - Content to render if permission check fails
 */
export const PermissionGuard = ({ permission, requireAll = false, children, fallback = null }) => {
  const permissions = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll
    ? useHasAllPermissions(permissions)
    : useHasAnyPermission(permissions);

  return hasAccess ? children : fallback;
};

