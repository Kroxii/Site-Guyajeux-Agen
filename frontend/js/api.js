// URL relative pour la production
const API_BASE_URL = '/api';
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }
    
    console.log('Requête API:', { url, method: config.method || 'GET', headers: config.headers });
    
    try {
      const response = await fetch(url, config);
      
      console.log('Statut réponse:', response.status, response.statusText);
      
      // Vérifier si la réponse contient du contenu
      const contentType = response.headers.get('content-type');
      const hasJsonContent = contentType && contentType.includes('application/json');
      
      let data;
      if (hasJsonContent) {
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (parseError) {
            console.error('Erreur parsing JSON:', parseError, 'Texte reçu:', text);
            throw new Error('Réponse serveur invalide');
          }
        } else {
          data = {};
        }
      } else {
        // Si ce n'est pas du JSON, récupérer comme texte
        data = { message: await response.text() || 'Erreur inconnue' };
      }
      
      console.log('Données reçues:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `Erreur HTTP: ${response.status}`);
      }
      return data;
    } catch (error) {
      console.error(`Erreur API (${endpoint}):`, error);
      
      // Gestion spécifique des erreurs d'authentification
      if (error.message.includes('401') || error.message.includes('Token') || error.message.includes('Unauthorized')) {
        console.warn('Session expirée, déconnexion automatique');
        this.logout();
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }
      
      // Gestion des erreurs de connectivité
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Erreur de connexion. Vérifiez votre connexion internet.');
      }
      
      // Gestion des erreurs serveur
      if (error.message.includes('500')) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      }
      
      throw error;
    }
  }
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (response.success) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    }
    return response;
  }
  async register(name, email, password) {
    console.log('API register appelé avec:', { name, email, password: '***' });
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    console.log('Réponse API register:', response);
    if (response.success) {
      this.token = response.data.token;
      localStorage.setItem('authToken', this.token);
      localStorage.setItem('currentUser', JSON.stringify(response.data.user));
    }
    return response;
  }
  async logout() {
    try {
      if (this.token) {
        await this.request('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
      currentUser = null;
      updateAuthUI();
    }
  }
  async getCurrentUser() {
    const response = await this.request('/auth/me');
    return response.data.user;
  }
  async updateProfile(data) {
    const response = await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response;
  }

  // Tournois fichier API Tournaments.js
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
    const response = await this.request('/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournamentData)
    });
    return response.data;
  }
  async updateTournament(id, tournamentData) {
    const response = await this.request(`/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tournamentData)
    });
    return response.data;
  }
  async deleteTournament(id) {
    const response = await this.request(`/tournaments/${id}`, {
      method: 'DELETE'
    });
    return response;
  }
  async registerForTournament(tournamentId) {
    const response = await this.request(`/tournaments/${tournamentId}/register`, {
      method: 'POST'
    });
    return response;
  }
  async unregisterFromTournament(tournamentId) {
    const response = await this.request(`/tournaments/${tournamentId}/register`, {
      method: 'DELETE'
    });
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
    const response = await this.request(`/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    });
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
  
  // Statistiques
  async getStats() {
    const response = await this.request('/stats');
    return response.data;
  }
}

