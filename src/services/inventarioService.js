// src/services/inventarioService.js - Servicio HTTP para consulta y supervisión de existencias en kilogramos
import { api } from './api';

// ==========================================
// Métodos para consulta de existencias e inventario
// ==========================================
export const inventarioService = {
  // Consultar el stock total en kilos agrupado por ubicación, variedad y categoría
  async listarInventarioPorEmpresa(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/inventario-kilos`);
    return response.data?.data || response.data || [];
  },

  // Obtener la lista de ubicaciones activas disponibles para la empresa
  async listarUbicaciones(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/ubicaciones`);
    return response.data?.data || response.data || [];
  },
};
