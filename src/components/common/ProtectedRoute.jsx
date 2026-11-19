// src/components/common/ProtectedRoute.jsx - Guardián de seguridad y control de acceso a rutas protegidas
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// ==========================================
// Componente de Enrutamiento Protegido
// ==========================================
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Si no cuenta con token o sesión válida, redirigir al Login guardando la ruta previa
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si está autenticado, renderizar la vista solicitada
  return children;
}
