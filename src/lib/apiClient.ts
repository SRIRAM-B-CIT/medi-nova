const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  // Auth endpoints
  async signUp(email: string, password: string, full_name: string, role: string) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name, role }),
    });
  }

  async signIn(email: string, password: string) {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  // Patient details endpoints
  async getPatientDetails() {
    return this.request('/patient-details');
  }

  async getPatientDetailsByUserId(userId: string) {
    return this.request(`/patient-details/${userId}`);
  }

  async createOrUpdatePatientDetails(data: any) {
    return this.request('/patient-details', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkHealthRecord() {
    return this.request('/patient-details/check');
  }

  // Medication reminders endpoints
  async getMedicationReminders() {
    return this.request('/medication-reminders');
  }

  async getMedicationReminder(id: string) {
    return this.request(`/medication-reminders/${id}`);
  }

  async createMedicationReminder(data: any) {
    return this.request('/medication-reminders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMedicationReminder(id: string, data: any) {
    return this.request(`/medication-reminders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMedicationReminder(id: string) {
    return this.request(`/medication-reminders/${id}`, {
      method: 'DELETE',
    });
  }

  // Vital records endpoints
  async getVitalRecords() {
    return this.request('/vital-records');
  }

  async createVitalRecord(data: any) {
    return this.request('/vital-records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteVitalRecord(id: string) {
    return this.request(`/vital-records/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteAllVitalRecords() {
    return this.request('/vital-records', {
      method: 'DELETE',
    });
  }

  // Trend analysis endpoints
  async getTrendAnalysis(limit: number = 10) {
    return this.request(`/trend-analysis?limit=${limit}`);
  }
}

export const apiClient = new ApiClient();
