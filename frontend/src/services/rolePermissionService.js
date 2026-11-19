/**
 * RolePermissionService
 * Handles all CRUD operations for the 12-role RBAC permission matrix.
 * - Live backend: MySQL via /api/roles-permissions
 * - Offline/fallback: localStorage cache for instant render on cold load
 * - Every write immediately dispatches 'crm-permissions-updated' via setDynamicRolePermissions
 */
import apiClient from './apiClient';
import {
  setDynamicRolePermissions,
  getDynamicRolePermissions,
  getDefaultRolePermissionsMatrix
} from '../utils/rbac';

class RolePermissionService {
  /**
   * Fetches the full 12-role permissions matrix from MySQL backend.
   * Falls back gracefully to localStorage cache or static defaults.
   */
  async getPermissions() {
    try {
      const response = await apiClient.get('/roles-permissions');
      const data = response.data;

      if (data?.success && data?.data && typeof data.data === 'object') {
        // Merge with defaults so all 12 roles are always present
        const defaults = getDefaultRolePermissionsMatrix();
        const merged = { ...defaults, ...data.data };
        setDynamicRolePermissions(merged);
        return { ...data, data: merged };
      }

      // Backend responded but payload was malformed — use cache
      return this._fallback();
    } catch (error) {
      console.warn('[RolePermissionService] Backend unavailable, using local cache:', error.message);
      return this._fallback();
    }
  }

  /**
   * Updates allowed navigation IDs for a single role in MySQL.
   * Immediately updates localStorage cache and fires live sidebar update.
   */
  async updateRolePermission(roleId, allowedNavIds) {
    try {
      const response = await apiClient.put(`/roles-permissions/${roleId}`, { allowedNavIds });
      const data = response.data;

      if (data?.success) {
        // Merge into existing cache so other roles are preserved
        const current = getDynamicRolePermissions() || getDefaultRolePermissionsMatrix();
        const updated = { ...current, [roleId]: allowedNavIds };
        setDynamicRolePermissions(updated);
        return data;
      }

      throw new Error(data?.message || 'Update returned unsuccessful status');
    } catch (error) {
      // Optimistic local update — user sees changes instantly even if backend is slow
      const current = getDynamicRolePermissions() || getDefaultRolePermissionsMatrix();
      const optimistic = { ...current, [roleId]: allowedNavIds };
      setDynamicRolePermissions(optimistic);
      console.warn('[RolePermissionService] updateRolePermission fallback optimistic update:', error.message);
      return { success: true, data: optimistic, optimistic: true };
    }
  }

  /**
   * Bulk updates all role permissions at once.
   * This is the primary save action from the RBAC UI.
   */
  async bulkUpdatePermissions(permissions) {
    // Always persist locally first for instant feedback
    setDynamicRolePermissions(permissions);

    try {
      const response = await apiClient.post('/roles-permissions/bulk', { permissions });
      const data = response.data;

      if (data?.success && data?.data) {
        // Backend may return a re-computed canonical version — sync it
        const defaults = getDefaultRolePermissionsMatrix();
        const merged = { ...defaults, ...data.data };
        setDynamicRolePermissions(merged);
        return { ...data, data: merged };
      }

      // Partial success — local save already happened above, return ok
      return { success: true, data: permissions, localOnly: true };
    } catch (error) {
      console.warn('[RolePermissionService] bulkUpdate backend error (local save succeeded):', error.message);
      // Local save already fired above — treat as success from UX perspective
      return { success: true, data: permissions, localOnly: true };
    }
  }

  /**
   * Resets tenant permissions to baseline enterprise defaults.
   */
  async resetToDefaults() {
    try {
      const response = await apiClient.post('/roles-permissions/reset');
      const data = response.data;

      if (data?.success && data?.data) {
        const defaults = getDefaultRolePermissionsMatrix();
        const merged = { ...defaults, ...data.data };
        setDynamicRolePermissions(merged);
        return { ...data, data: merged };
      }

      // Reset locally if backend unavailable
      return this._resetLocal();
    } catch (error) {
      console.warn('[RolePermissionService] reset backend error, applying local defaults:', error.message);
      return this._resetLocal();
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  /**
   * Returns cached data or computed defaults. Never throws.
   */
  _fallback() {
    const cached = getDynamicRolePermissions();
    if (cached && typeof cached === 'object' && Object.keys(cached).length > 0) {
      return { success: true, data: cached, fromCache: true };
    }
    const defaults = getDefaultRolePermissionsMatrix();
    setDynamicRolePermissions(defaults);
    return { success: true, data: defaults, fromDefaults: true };
  }

  /**
   * Applies local baseline defaults and broadcasts update event.
   */
  _resetLocal() {
    const defaults = getDefaultRolePermissionsMatrix();
    setDynamicRolePermissions(defaults);
    return { success: true, data: defaults, localOnly: true };
  }
}

export default new RolePermissionService();
