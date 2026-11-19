// src/services/authService.js - Servicio HTTP para autenticación, inicio de sesión y verificación de credenciales
import { api } from './api';

// ==========================================
// Métodos de autenticación y sesión
// ==========================================
export const authService = {
  // Iniciar sesión enviando correo electrónico y contraseña
  login: async (correo, contrasena) => {
    const { data } = await api.post('/auth/login', { correo, contrasena });
    return data;
  },
};
