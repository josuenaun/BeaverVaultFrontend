// src/hooks/useAuth.js - Hook personalizado para consumir el contexto global de autenticación
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// ==========================================
// Hook para acceder al usuario, token y métodos de sesión
// ==========================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
