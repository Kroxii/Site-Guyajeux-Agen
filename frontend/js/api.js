const API_BASE_URL = '/api';
 
  export async function apiGET(endpoint, method = 'GET', data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    try {
      const response = await fetch(url, config);
      return response;
    }
    catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Ajouter bearer token
