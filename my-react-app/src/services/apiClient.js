const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const request = async (endpoint, { method = 'GET', body, token, headers = {} } = {}) => {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.error || data.message || 'Request failed';
    throw new Error(errorMessage);
  }

  return data;
};

export const apiClient = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, options) => request(endpoint, { ...options, method: 'POST' }),
  put: (endpoint, options) => request(endpoint, { ...options, method: 'PUT' }),
  patch: (endpoint, options) => request(endpoint, { ...options, method: 'PATCH' }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

export { API_BASE };
