/**
 * EgoLytics Enterprise Governance & Quality Service
 * Master Prompt 16: IP Management, SOPs, Audit Logs, API Keys, and Universal Portability
 */

import { apiClient } from './apiClient';

export const rdEnterpriseService = {
  // ==========================================
  // INTELLECTUAL PROPERTY & PATENTS
  // ==========================================
  listIpAssets: async (params = {}) => {
    return apiClient.get('/rd/enterprise/ip', { params });
  },

  getIpAssetById: async (id) => {
    return apiClient.get(`/rd/enterprise/ip/${id}`);
  },

  createIpAsset: async (payload) => {
    return apiClient.post('/rd/enterprise/ip', payload);
  },

  updateIpAsset: async (id, payload) => {
    return apiClient.put(`/rd/enterprise/ip/${id}`, payload);
  },

  deleteIpAsset: async (id) => {
    return apiClient.delete(`/rd/enterprise/ip/${id}`);
  },

  getIpMetrics: async () => {
    return apiClient.get('/rd/enterprise/ip/metrics');
  },

  // ==========================================
  // REGULATORY COMPLIANCE & SOPS
  // ==========================================
  listSops: async (params = {}) => {
    return apiClient.get('/rd/enterprise/compliance/sops', { params });
  },

  getSopById: async (id) => {
    return apiClient.get(`/rd/enterprise/compliance/sops/${id}`);
  },

  createSop: async (payload) => {
    return apiClient.post('/rd/enterprise/compliance/sops', payload);
  },

  updateSop: async (id, payload) => {
    return apiClient.put(`/rd/enterprise/compliance/sops/${id}`, payload);
  },

  approveSop: async (id, payload) => {
    return apiClient.post(`/rd/enterprise/compliance/sops/${id}/approve`, payload);
  },

  addChecklistItem: async (id, payload) => {
    return apiClient.post(`/rd/enterprise/compliance/sops/${id}/checklists`, payload);
  },

  recordIncident: async (id, payload) => {
    return apiClient.post(`/rd/enterprise/compliance/sops/${id}/incidents`, payload);
  },

  getComplianceMetrics: async () => {
    return apiClient.get('/rd/enterprise/compliance/metrics');
  },

  // ==========================================
  // ENTERPRISE AUDIT TRAIL
  // ==========================================
  listAuditLogs: async (params = {}) => {
    return apiClient.get('/rd/enterprise/audit/logs', { params });
  },

  getAuditMetrics: async () => {
    return apiClient.get('/rd/enterprise/audit/metrics');
  },

  // ==========================================
  // SCOPED API KEYS
  // ==========================================
  listApiKeys: async () => {
    return apiClient.get('/rd/enterprise/apikeys');
  },

  generateApiKey: async (payload) => {
    return apiClient.post('/rd/enterprise/apikeys', payload);
  },

  revokeApiKey: async (id) => {
    return apiClient.delete(`/rd/enterprise/apikeys/${id}`);
  },

  // ==========================================
  // UNIVERSAL DATA EXPORT
  // ==========================================
  exportDataUrl: (entityType, format = 'csv') => {
    const baseUrl = apiClient.defaults.baseURL || '/api';
    return `${baseUrl}/rd/enterprise/export?entityType=${entityType}&format=${format}`;
  },

  downloadExport: async (entityType, format = 'csv') => {
    const res = await apiClient.get('/rd/enterprise/export', {
      params: { entityType, format },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([res]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `egolytics_${entityType}_${Date.now()}.${format === 'csv' ? 'csv' : 'json'}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  }
};

