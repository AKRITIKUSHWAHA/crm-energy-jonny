import { apiClient } from './apiClient';

export const bfovService = {
  // Telemetry & Blueprints
  getWorkspaceTelemetry: async () => {
    return apiClient.get('/diagrams/telemetry');
  },

  listTemplates: async (params = {}) => {
    return apiClient.get('/diagrams/templates', { params });
  },

  createFromTemplate: async (templateKey, customTitle) => {
    return apiClient.post('/diagrams/from-template', { templateKey, customTitle });
  },

  saveAsTemplate: async (id, payload) => {
    return apiClient.post(`/diagrams/${id}/save-template`, payload);
  },

  // Diagram CRUD
  listDiagrams: async (params = {}) => {
    return apiClient.get('/diagrams', { params });
  },

  getDiagramById: async (id) => {
    return apiClient.get(`/diagrams/${id}`);
  },

  createDiagram: async (payload) => {
    return apiClient.post('/diagrams', payload);
  },

  updateDiagram: async (id, payload) => {
    return apiClient.put(`/diagrams/${id}`, payload);
  },

  duplicateDiagram: async (id, title) => {
    return apiClient.post(`/diagrams/${id}/duplicate`, { title });
  },

  deleteDiagram: async (id) => {
    return apiClient.delete(`/diagrams/${id}`);
  },

  // Version History
  getVersions: async (id) => {
    return apiClient.get(`/diagrams/${id}/versions`);
  },

  restoreVersion: async (id, version) => {
    return apiClient.post(`/diagrams/${id}/restore`, { version });
  },

  // Geometric Helpers
  computeRoute: async (edge, nodeMap) => {
    return apiClient.post('/diagrams/helpers/route', { edge, nodeMap });
  },

  alignNodes: async (nodes, alignType) => {
    return apiClient.post('/diagrams/helpers/align', { nodes, alignType });
  },

  // Mermaid Import Engine
  parseMermaid: async (mermaidCode) => {
    return apiClient.post('/diagrams/mermaid/parse', { mermaidCode });
  },

  importMermaid: async (payload) => {
    return apiClient.post('/diagrams/mermaid/import', payload);
  },

  // AI Integration
  getAiStatus: async () => {
    return apiClient.get('/diagrams/ai/status');
  },

  generateDiagramFromAi: async (payload) => {
    return apiClient.post('/diagrams/ai/generate', payload);
  },

  editDiagramFromAi: async (payload) => {
    return apiClient.post('/diagrams/ai/edit', payload);
  },

  // Multi-Format Export
  exportSvgUrl: (id) => `/api/diagrams/${id}/export/svg`,
  exportJsonUrl: (id) => `/api/diagrams/${id}/export/json`,
  exportPdfUrl: (id) => `/api/diagrams/${id}/export/pdf`,

  exportSvg: async (id) => {
    return apiClient.get(`/diagrams/${id}/export/svg`, { responseType: 'text' });
  },

  exportJson: async (id) => {
    return apiClient.get(`/diagrams/${id}/export/json`);
  },

  exportPdf: async (id) => {
    return apiClient.get(`/diagrams/${id}/export/pdf`, { responseType: 'blob' });
  },

  importJson: async (jsonData) => {
    return apiClient.post('/diagrams/import/json', { jsonData });
  },

  // Sharing & Permissions
  listShares: async (id) => {
    return apiClient.get(`/diagrams/${id}/shares`);
  },

  addShare: async (id, payload) => {
    return apiClient.post(`/diagrams/${id}/shares`, payload);
  },

  removeShare: async (shareId) => {
    return apiClient.delete(`/diagrams/shares/${shareId}`);
  },

  // Contextual Comments
  listComments: async (id) => {
    return apiClient.get(`/diagrams/${id}/comments`);
  },

  addComment: async (id, payload) => {
    return apiClient.post(`/diagrams/${id}/comments`, payload);
  },

  resolveComment: async (commentId, isResolved) => {
    return apiClient.patch(`/diagrams/comments/${commentId}/resolve`, { isResolved });
  },

  deleteComment: async (commentId) => {
    return apiClient.delete(`/diagrams/comments/${commentId}`);
  }
};
