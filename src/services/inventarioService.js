// src/services/inventarioService.js - Servicio HTTP para Gestión y Monitoreo de Inventario en Kilos
import { api } from './api';

export const inventarioService = {
  /**
   * Obtener todo el inventario en kilos de una empresa agrupado con los nombres de puesto
   * (GET /api/empresas/:empresaId/inventario-kilos)
   * @param {string} empresaId
   */
  async listarInventarioPorEmpresa(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/inventario-kilos`);
    return response.data?.data || response.data || [];
  },

  /**
   * Obtener inventario en kilos específico de una ubicación física
   * (GET /api/ubicaciones/:ubicacionId/inventario-kilos)
   * @param {string} ubicacionId
   */
  async listarInventarioPorUbicacion(ubicacionId) {
    if (!ubicacionId) return [];
    const response = await api.get(`/ubicaciones/${ubicacionId}/inventario-kilos`);
    return response.data?.data || response.data || [];
  },

  /**
   * Obtener lista de ubicaciones activas de la empresa (Cámara Frío, Puesto Principal, Contingencia)
   * (GET /api/empresas/:empresaId/ubicaciones)
   * @param {string} empresaId
   */
  async listarUbicaciones(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/ubicaciones`);
    return response.data?.data || response.data || [];
  },
};
