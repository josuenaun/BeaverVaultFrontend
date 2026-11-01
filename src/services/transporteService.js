// src/services/transporteService.js - Servicio HTTP para Etapa 2: Transporte hacia Lima
import { api } from './api';

export const transporteService = {
  /**
   * Contratar flete y despachar lote hacia Lima (POST /api/acopios/:acopioId/transporte)
   * @param {string} acopioId
   * @param {Object} data - { fleteCosto, nombreReceptor, usuarioRegistroId, concepto }
   */
  async contratarFlete(acopioId, data) {
    const response = await api.post(`/acopios/${acopioId}/transporte`, data);
    return response.data?.data || response.data;
  },
};
