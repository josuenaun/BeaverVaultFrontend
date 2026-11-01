// src/services/authService.js - Servicio para autenticación y sesión
import { api } from './api';

export const authService = {
  // Iniciar sesión con correo y contraseña
  login: async (correo, contrasena) => {
    const { data } = await api.post('/auth/login', { correo, contrasena });
    return data;
  },
};
