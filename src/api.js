const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      const text = await response.text().catch(() => '');
      if (!response.ok) {
        throw new Error(text || 'Server error: Invalid response format');
      }
      return text;
    }

    if (!response.ok) {
      throw new Error(data?.error || 'Request failed');
    }

    return data;
  }

  // Auth
  login(email, password) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  }

  register(name, email, password, phone) {
    return this.request('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, phone }) });
  }

  getProfile() {
    return this.request('/auth/me');
  }

  updateProfile(data) {
    return this.request('/auth/me', { method: 'PUT', body: JSON.stringify(data) });
  }

  // Dentists
  getDentists() {
    return this.request('/dentists');
  }

  getDentist(id) {
    return this.request(`/dentists/${id}`);
  }

  getDentistAvailability(id, date) {
    return this.request(`/dentists/${id}/availability?date=${date}`);
  }

  getDentistProfile() {
    return this.request('/dentists/me/profile');
  }

  updateDentistSchedule(schedules) {
    return this.request('/dentists/schedule', { method: 'PUT', body: JSON.stringify({ schedules }) });
  }

  // Services
  getServices() {
    return this.request('/services');
  }

  createService(data) {
    return this.request('/services', { method: 'POST', body: JSON.stringify(data) });
  }

  updateService(id, data) {
    return this.request(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteService(id) {
    return this.request(`/services/${id}`, { method: 'DELETE' });
  }

  // Appointments
  bookAppointment(data) {
    return this.request('/appointments', { method: 'POST', body: JSON.stringify(data) });
  }

  getMyAppointments() {
    return this.request('/appointments/my');
  }

  getDentistAppointments(date, status) {
    let qs = '';
    if (date) qs += `?date=${date}`;
    if (status) qs += `${qs ? '&' : '?'}status=${status}`;
    return this.request(`/appointments/dentist${qs}`);
  }

  getAllAppointments(filters = {}) {
    const params = new URLSearchParams(filters).toString();
    return this.request(`/appointments/all${params ? '?' + params : ''}`);
  }

  updateAppointmentStatus(id, data) {
    return this.request(`/appointments/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  addTreatmentNotes(id, data) {
    return this.request(`/appointments/${id}/notes`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  rescheduleAppointment(id, data) {
    return this.request(`/appointments/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify(data) });
  }

  // Admin
  getStats() {
    return this.request('/admin/stats');
  }

  getPatients() {
    return this.request('/admin/patients');
  }

  getAdminDentists() {
    return this.request('/admin/dentists');
  }

  addDentist(data) {
    return this.request('/admin/dentists', { method: 'POST', body: JSON.stringify(data) });
  }

  updateDentist(id, data) {
    return this.request(`/admin/dentists/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  }

  deleteDentist(id) {
    return this.request(`/admin/dentists/${id}`, { method: 'DELETE' });
  }

  getHolidays() {
    return this.request('/admin/holidays');
  }

  addHoliday(data) {
    return this.request('/admin/holidays', { method: 'POST', body: JSON.stringify(data) });
  }

  deleteHoliday(id) {
    return this.request(`/admin/holidays/${id}`, { method: 'DELETE' });
  }

  // AI Chat
  sendMessage(message) {
    return this.request('/ai/chat', { method: 'POST', body: JSON.stringify({ message }) });
  }

  getChatHistory() {
    return this.request('/ai/history');
  }

  clearChatHistory() {
    return this.request('/ai/history', { method: 'DELETE' });
  }
}

const api = new ApiClient();
export default api;
