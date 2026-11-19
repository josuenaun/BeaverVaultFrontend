// src/services/api.js - Instancia centralizada de Axios con interceptores de autenticación y manejo de sesión
import axios from 'axios';

// ==========================================
// Configuración de la URL base de la API
// ==========================================
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// ==========================================
// Creación de la instancia Axios
// ==========================================
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==========================================
// Interceptor de Salida (Peticiones)
// Inyecta el token Bearer desde localStorage en cada solicitud
// ==========================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// Interceptor de Entrada (Respuestas)
// Captura error 401 de expiración de sesión y redirige al Login
// ==========================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
