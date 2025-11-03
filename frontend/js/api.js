const API_BASE_URL = '/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }
  
  async request(endpoint, method = 'GET', data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    try {
      const response = await fetch(url, config);
      
    }
    catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }
}
