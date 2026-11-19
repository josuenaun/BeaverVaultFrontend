// src/services/distribucionService.js - Servicio HTTP para distribución en Lima, descarga de camiones y traslados
import { api } from './api';

// ==========================================
// Métodos para distribución física y traslados
// ==========================================
export const distribucionService = {
  // Consultar ubicaciones físicas registradas para la empresa
  async listarUbicaciones(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/ubicaciones`);
    return response.data?.data || response.data || [];
  },

  // Registrar pago de descarga a estibadores o cargadores al arribar el camión
  async registrarDescarga(acopioId, data) {
    const response = await api.post(`/acopios/${acopioId}/gastos/descarga`, data);
    return response.data?.data || response.data;
  },

  // Mover una jaba completa hacia otra ubicación de destino en Lima
  async trasladarJaba(jabaId, ubicacionId) {
    const response = await api.patch(`/jabas/${jabaId}/ubicacion`, { ubicacionId });
    return response.data;
  },

  // Dividir y fraccionar un grupo de jabas para enviar parte del stock a otro puesto
  async dividirJaba(jabaId, data) {
    const response = await api.post(`/jabas/${jabaId}/dividir`, data);
    return response.data?.data || response.data;
  },
};
