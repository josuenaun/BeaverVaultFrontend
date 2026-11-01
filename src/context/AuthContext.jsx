// src/context/AuthContext.jsx - Estado global de autenticación, empresa activa y roles BeaverVault
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authService } from '../services/authService';
import { api } from '../services/api';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token');
    return stored && stored !== 'undefined' && stored !== 'null' ? stored : null;
  });

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (!savedUser || savedUser === 'undefined' || savedUser === 'null') return null;
      return JSON.parse(savedUser);
    } catch (e) {
      console.error('Error parseando usuario en localStorage', e);
      return null;
    }
  });

  const [empresaId, setEmpresaIdState] = useState(() => {
    return localStorage.getItem('empresaId') || null;
  });

  const [empresas, setEmpresas] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingEmpresa, setLoadingEmpresa] = useState(false);

  // Guardar empresaId en localStorage y estado
  const setEmpresaId = useCallback((id) => {
    if (id) {
      localStorage.setItem('empresaId', id);
      setEmpresaIdState(id);
    } else {
      localStorage.removeItem('empresaId');
      setEmpresaIdState(null);
    }
  }, []);

  // Carga automática de empresas y roles desde el backend
  const resolverEmpresaActiva = useCallback(async (usuarioActual) => {
    if (!usuarioActual) return;

    // 1. Si es usuario regular, asegurar su empresaId
    if (usuarioActual.empresaId) {
      setEmpresaId(usuarioActual.empresaId);
    }

    const guardada = localStorage.getItem('empresaId') || usuarioActual.empresaId;
    if (guardada) {
      setEmpresaIdState(guardada);
    }

    // 2. Consultar empresas y roles disponibles en el backend
    try {
      setLoadingEmpresa(true);
      const [resEmpresas, resRoles] = await Promise.allSettled([
        api.get('/empresas'),
        api.get('/roles'),
      ]);

      if (resEmpresas.status === 'fulfilled') {
        const lista = resEmpresas.value.data?.data || resEmpresas.value.data || [];
        setEmpresas(lista);

        if (lista.length > 0 && !guardada) {
          setEmpresaId(lista[0].empresaId || lista[0].id);
        }
      }

      if (resRoles.status === 'fulfilled') {
        const listaRoles = resRoles.value.data?.data || resRoles.value.data || [];
        setRoles(listaRoles);
      }
    } catch (error) {
      console.warn('Error cargando catálogo de empresas o roles:', error?.message);
    } finally {
      setLoadingEmpresa(false);
    }
  }, [setEmpresaId]);

  useEffect(() => {
    if (token && user) {
      resolverEmpresaActiva(user);
    }
  }, [token, user, resolverEmpresaActiva]);

  // Empresa activa computada a partir del catálogo
  const empresaActiva = useMemo(() => {
    if (!empresaId && empresas.length > 0) return empresas[0];
    return (
      empresas.find((emp) => (emp.empresaId || emp.id) === empresaId) ||
      (user?.empresaNombre ? { nombre: user.empresaNombre, id: empresaId } : null)
    );
  }, [empresas, empresaId, user]);

  // Nombre descriptivo y exacto del rol
  const rolNombre = useMemo(() => {
    if (!user) return '';
    if (user.superAdminId || user.rol === 'SUPER_ADMIN') {
      return 'SUPER ADMINISTRADOR';
    }
    if (user.rolId && roles.length > 0) {
      const rolEncontrado = roles.find((r) => (r.rolId || r.id) === user.rolId);
      if (rolEncontrado?.nombre) {
        return rolEncontrado.nombre;
      }
    }
    return user.rol || 'USUARIO';
  }, [user, roles]);

  const login = async (correo, contrasena) => {
    const rawData = await authService.login(correo, contrasena);

    const payload = rawData?.data || rawData;
    const extractedToken = payload?.token;

    if (!extractedToken) {
      throw new Error('El servidor no retornó un token de autenticación válido.');
    }

    const userData =
      payload?.superAdmin ||
      payload?.usuario ||
      payload?.user ||
      rawData?.superAdmin ||
      rawData?.usuario ||
      { correo };

    setToken(extractedToken);
    setUser(userData);
    localStorage.setItem('token', extractedToken);
    localStorage.setItem('user', JSON.stringify(userData));

    // Asignar empresaId de inmediato si viene en el payload
    if (userData.empresaId) {
      setEmpresaId(userData.empresaId);
    }

    // Resolver catálogo de empresas y roles
    setTimeout(() => resolverEmpresaActiva(userData), 50);

    return payload;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setEmpresaId(null);
    setEmpresas([]);
    setRoles([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('empresaId');
  };

  const isAuthenticated = Boolean(token && token !== 'undefined' && token !== 'null');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        empresaId,
        setEmpresaId,
        empresaActiva,
        empresas,
        roles,
        rolNombre,
        loadingEmpresa,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook de acceso directo
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
