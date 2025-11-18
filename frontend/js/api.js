class ApiService {
    baseURL = '/api';

    async request(endpoint, method = 'GET', data = null, includeAuth = true) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(error.message || 'Une erreur est survenue');
            }
            
        return await response.json();
        } catch (error) {
            throw error;
        }
    }

    async get(endpoint, includeAuth = true) {
        return this.request(endpoint, 'GET', null, includeAuth);
    }

    async post(endpoint, data, includeAuth = true) {
        return this.request(endpoint, 'POST', data, includeAuth);
    }

    async put(endpoint, data, includeAuth = true) {
        return this.request(endpoint, 'PUT', data, includeAuth);
    }

    async delete(endpoint, includeAuth = true) {
        return this.request(endpoint, 'DELETE', null, includeAuth);
    }


    // Méthodes d'authentification
    async login(email, password) {
        return this.post('/auth/login', { email, password }, false);
    }

    async register(name, email, password) {
        return this.post('/auth/register', { name, email, password }, false);
    }

    async logout() {
        try {
            await this.post('/auth/logout', null, true);
        } finally {
            window.dispatchEvent(new CustomEvent('user-logout'));
        }
    }

    async getCurrentUser() {
        return this.get('/auth/me', true);
    }

    // Méthodes pour les tournois
    async getTournaments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/tournaments${queryString ? `?${queryString}` : ''}`;
    const response = await this.request(endpoint);
    return response.data;
  }
  async getWeeklyTournaments() {
    const response = await this.request('/tournaments/weekly');
    return response.data.tournaments;
  }
  async getMonthlyTournaments() {
    const response = await this.request('/tournaments/monthly');
    return response.data.tournaments;
  }
  async getCalendarTournaments(year, month) {
    const response = await this.request(`/tournaments/calendar/${year}/${month}`);
    return response.data.tournaments;
  }
  async getTournament(id) {
    const response = await this.request(`/tournaments/${id}`);
    return response.data;
  }
  async createTournament(tournamentData) {
    const response = await this.request('/tournaments', 'POST', tournamentData);
    return response.data;
  }
  async updateTournament(id, tournamentData) {
    const response = await this.request(`/tournaments/${id}`, 'PUT', tournamentData);
    return response.data;
  }
  async deleteTournament(id) {
    const response = await this.request(`/tournaments/${id}`, 'DELETE');
    return response;
  }
  async registerForTournament(tournamentId) {
    const response = await this.request(`/tournaments/${tournamentId}/register`, 'POST');
    return response;
  }
  async unregisterFromTournament(tournamentId) {
    const response = await this.request(`/tournaments/${tournamentId}/register`, 'DELETE');
    return response;
  }
  async getMyRegistrations() {
    const response = await this.request('/users/me/registrations');
    return response.data.registrations;
  }
  async getMyStats() {
    const response = await this.request('/users/me/stats');
    return response.data.stats;
  }

  // Méthodes pour les utilisateurs
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/users${queryString ? `?${queryString}` : ''}`;
    const response = await this.request(endpoint);
    return response.data;
  }
  async getGeneralStats() {
    const response = await this.request('/users/stats/general');
    return response.data;
  }
  async updateUserStatus(userId, isActive) {
    const response = await this.request(`/users/${userId}/status`, 'PUT', { isActive });
    return response;
  }
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }


  async getStats() {
    const response = await this.request('/stats');
    return response.data;
  }
}