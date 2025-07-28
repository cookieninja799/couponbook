//src/services/apiService.js
import axios from 'axios';

const remote = process.env.VUE_APP_API_URL;
if (!remote && process.env.NODE_ENV === 'production') {
  throw new Error('VUE_APP_API_URL is not defined in production');
}

const api = axios.create({
  baseURL: '/api/v1',
});

export default api;
