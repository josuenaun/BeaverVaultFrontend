// src/services/acopioService.js - Servicio HTTP para gestión de acopio de palta en campo y pesaje de jabas
import { api } from './api';

// ==========================================
// Métodos de operaciones de acopio (Etapa 1)
// ==========================================
export const acopioService = {
  // Obtener listado de lotes de acopio registrados para una empresa
  async listarAcopios(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/acopios`);
    return response.data?.data || response.data || [];
  },

  // Registrar un nuevo lote de acopio con su detalle de jabas y pesos
  async crearAcopio(data) {
    const response = await api.post('/acopios', data);
    return response.data?.data || response.data;
  },

  // Eliminar un lote de acopio existente por su ID
  async eliminarAcopio(acopioId) {
    const response = await api.delete(`/acopios/${acopioId}`);
    return response.data;
  },

  // Registrar pago de mano de obra al seleccionador en zona de acopio
  async registrarGastoSeleccionador(acopioId, data) {
    const response = await api.post(`/acopios/${acopioId}/gastos/seleccionador`, data);
    return response.data?.data || response.data;
  },
};
