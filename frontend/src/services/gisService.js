import { apiClient } from './apiClient';

class GisService {
  async getWorkspaceTelemetry() {
    const res = await apiClient.get('/gis/workspace/telemetry');
    return res.data?.data;
  }

  async executeSearch(searchMode, params = {}) {
    const res = await apiClient.post('/gis/search', {
      searchMode,
      params,
    });
    return res.data?.data;
  }

  async uploadGisFile(filename, rawContent, fileType = 'GEOJSON') {
    const res = await apiClient.post('/gis/files/upload', {
      filename,
      rawContent,
      fileType,
    });
    return res.data?.data;
  }

  async getUploadedFiles() {
    const res = await apiClient.get('/gis/files');
    return res.data?.data;
  }

  async getRegions(query = {}) {
    const params = new URLSearchParams(query);
    const res = await apiClient.get(`/gis/regions?${params.toString()}`);
    return res.data?.data;
  }

  async createRegion(data) {
    const res = await apiClient.post('/gis/regions', data);
    return res.data?.data;
  }

  async updateRegion(id, data) {
    const res = await apiClient.put(`/gis/regions/${id}`, data);
    return res.data?.data;
  }

  async deleteRegion(id) {
    const res = await apiClient.delete(`/gis/regions/${id}`);
    return res.data;
  }

  async getTerritories(query = {}) {
    const params = new URLSearchParams(query);
    const res = await apiClient.get(`/gis/territories?${params.toString()}`);
    return res.data?.data;
  }

  async getTerritoryById(id) {
    const res = await apiClient.get(`/gis/territories/${id}`);
    return res.data?.data;
  }

  async createTerritory(data) {
    const res = await apiClient.post('/gis/territories', data);
    return res.data?.data;
  }

  async updateTerritory(id, data) {
    const res = await apiClient.put(`/gis/territories/${id}`, data);
    return res.data?.data;
  }

  async deleteTerritory(id) {
    const res = await apiClient.delete(`/gis/territories/${id}`);
    return res.data;
  }

  async getLayers() {
    const res = await apiClient.get('/gis/layers');
    return res.data?.data;
  }

  async updateLayer(id, data) {
    const res = await apiClient.put(`/gis/layers/${id}`, data);
    return res.data?.data;
  }

  async getFeatures(query = {}) {
    const params = new URLSearchParams(query);
    const res = await apiClient.get(`/gis/features?${params.toString()}`);
    return res.data?.data;
  }

  async createFeature(data) {
    const res = await apiClient.post('/gis/features', data);
    return res.data?.data;
  }

  async deleteFeature(id) {
    const res = await apiClient.delete(`/gis/features/${id}`);
    return res.data;
  }

  async getRealignments(query = {}) {
    const params = new URLSearchParams(query);
    const res = await apiClient.get(`/gis/realignments?${params.toString()}`);
    return res.data?.data;
  }

  async createRealignment(data) {
    const res = await apiClient.post('/gis/realignments', data);
    return res.data?.data;
  }

  async submitRealignment(id) {
    const res = await apiClient.post(`/gis/realignments/${id}/submit`);
    return res.data?.data;
  }

  async approveRealignment(id) {
    const res = await apiClient.post(`/gis/realignments/${id}/approve`);
    return res.data;
  }

  async rejectRealignment(id, justification) {
    const res = await apiClient.post(`/gis/realignments/${id}/reject`, { justification });
    return res.data?.data;
  }

  async getArcgisConfig() {
    const res = await apiClient.get('/gis/arcgis/config');
    return res.data?.data;
  }

  async saveArcgisConfig(data) {
    const res = await apiClient.post('/gis/arcgis/config', data);
    return res.data?.data;
  }

  async testArcgisConnection(serviceName) {
    const res = await apiClient.post('/gis/arcgis/test', { serviceName });
    return res.data?.data;
  }

  async getAuditLogs(query = {}) {
    const params = new URLSearchParams(query);
    const res = await apiClient.get(`/gis/audit-logs?${params.toString()}`);
    return res.data?.data;
  }
}

export const gisService = new GisService();
export default gisService;

