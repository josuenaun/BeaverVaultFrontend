// src/services/configService.js - Servicio HTTP para Configuración y Administración SuperAdmin
import { api } from './api';

export const configService = {
  // Empresas (Tenants)
  async listarEmpresas() {
    const res = await api.get('/empresas');
    return res.data?.data || res.data || [];
  },
  async crearEmpresa(data) {
    const res = await api.post('/empresas', data);
    return res.data?.data || res.data;
  },
  async eliminarEmpresa(empresaId) {
    const res = await api.delete(`/empresas/${empresaId}`);
    return res.data;
  },

  // Ubicaciones
  async listarUbicaciones(empresaId) {
    if (!empresaId) return [];
    const res = await api.get(`/empresas/${empresaId}/ubicaciones`);
    return res.data?.data || res.data || [];
  },
  async crearUbicacion(data) {
    const res = await api.post('/ubicaciones', data);
    return res.data?.data || res.data;
  },
  async eliminarUbicacion(ubicacionId) {
    const res = await api.delete(`/ubicaciones/${ubicacionId}`);
    return res.data;
  },

  // Roles
  async listarRoles() {
    const res = await api.get('/roles');
    return res.data?.data || res.data || [];
  },
  async crearRol(data) {
    const res = await api.post('/roles', data);
    return res.data?.data || res.data;
  },
  async eliminarRol(rolId) {
    const res = await api.delete(`/roles/${rolId}`);
    return res.data;
  },

  // Usuarios
  async listarUsuarios(empresaId) {
    if (!empresaId) return [];
    const res = await api.get(`/empresas/${empresaId}/usuarios`);
    return res.data?.data || res.data || [];
  },
  async crearUsuario(data) {
    const res = await api.post('/usuarios', data);
    return res.data?.data || res.data;
  },
  async eliminarUsuario(usuarioId) {
    const res = await api.delete(`/usuarios/${usuarioId}`);
    return res.data;
  },

  // Super Administradores
  async listarSuperAdmins() {
    const res = await api.get('/super-admins');
    return res.data?.data || res.data || [];
  },
  async crearSuperAdmin(data) {
    const res = await api.post('/super-admins', data);
    return res.data?.data || res.data;
  },
  async eliminarSuperAdmin(superAdminId) {
    const res = await api.delete(`/super-admins/${superAdminId}`);
    return res.data;
  },
};
