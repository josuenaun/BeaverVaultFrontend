// src/services/distribucionService.js - Servicio HTTP para Etapa 3: Lima (Descarga y Ubicaciones)
import { api } from './api';

export const distribucionService = {
  /**
   * Obtener ubicaciones físicas oficiales de una empresa
   * @param {string} empresaId
   */
  async listarUbicaciones(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/ubicaciones`);
    return response.data?.data || response.data || [];
  },

  /**
   * Registrar liquidación de descarga en Lima a estibadores o cargadores
   * (POST /api/acopios/:acopioId/gastos/descarga)
   * @param {string} acopioId
   * @param {Object} data - { tipoGasto: 'Estibador'|'Cargador', nombreReceptor, cantidadJabas, tarifaPorJaba, usuarioRegistroId, concepto }
   */
  async registrarDescarga(acopioId, data) {
    const response = await api.post(`/acopios/${acopioId}/gastos/descarga`, data);
    return response.data?.data || response.data;
  },

  /**
   * Trasladar una jaba o grupo de jabas a otra ubicación física en Lima
   * (PATCH /api/jabas/:jabaId/ubicacion)
   * @param {string} jabaId
   * @param {string} ubicacionId
   */
  async trasladarJaba(jabaId, ubicacionId) {
    const response = await api.patch(`/jabas/${jabaId}/ubicacion`, { ubicacionId });
    return response.data;
  },

  /**
   * Fraccionar / Dividir un grupo de jabas y enviar una parte a otra ubicación
   * (POST /api/jabas/:jabaId/dividir)
   * @param {string} jabaId
   * @param {Object} data - { cantidadSeparar, pesoSeparado, ubicacionId }
   */
  async dividirJaba(jabaId, data) {
    const response = await api.post(`/jabas/${jabaId}/dividir`, data);
    return response.data?.data || response.data;
  },
};
