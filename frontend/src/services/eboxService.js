import apiClient from './apiClient';

class EboxService {
  getEboxHeaders() {
    const headers = {};
    if (typeof localStorage !== 'undefined') {
      try {
        const savedUserStr = localStorage.getItem('crm_user');
        if (savedUserStr) {
          const u = JSON.parse(savedUserStr);
          if (u?.id) headers['x-user-role-id'] = u.id;
          if (u?.role) headers['x-user-role'] = u.role;
          if (u?.userId || u?.id) headers['x-user-id'] = u.userId || u.id;
          if (u?.name) headers['x-user-name'] = u.name;
          if (u?.tenantId) headers['x-tenant-id'] = u.tenantId;
        }
      } catch (e) {
        // Safe json parse ignore
      }
    }
    return headers;
  }

  async getMessages() {
    const response = await apiClient.get('/ebox', { headers: this.getEboxHeaders() });
    return response.data || [];
  }

  async sendMessage(data) {
    const response = await apiClient.post('/ebox', data, { headers: this.getEboxHeaders() });
    return response.data;
  }
}

export default new EboxService();
