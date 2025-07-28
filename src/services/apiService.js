//src/services/apiService.js
import axios from 'axios';

// point at your backend’s “/api/v1” namespace
const api = axios.create({
  baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api/v1',
  // you can enable this if you ever need cookies/auth:
  // withCredentials: true,
});

export default api;
