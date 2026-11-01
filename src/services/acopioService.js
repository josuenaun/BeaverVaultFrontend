// src/services/acopioService.js - Servicio HTTP para Etapa 1: Acopio y Jabas
import { api } from './api';

export const acopioService = {
  /**
   * Listar todos los lotes de acopio de una empresa
   * @param {string} empresaId
   */
  async listarAcopios(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/acopios`);
    return response.data?.data || response.data || [];
  },

  /**
   * Registrar un nuevo lote de acopio con su detalle de jabas en provincia
   * @param {Object} data
   */
  async crearAcopio(data) {
    const response = await api.post('/acopios', data);
    return response.data?.data || response.data;
  },

  /**
   * Eliminar un lote de acopio
   * @param {string} acopioId
   */
  async eliminarAcopio(acopioId) {
    const response = await api.delete(`/acopios/${acopioId}`);
    return response.data;
  },

  /**
   * Registrar pago de mano de obra a seleccionador en campo
   * @param {string} acopioId
   * @param {Object} data - { nombreReceptor, cantidadJabas, tarifaPorJaba, usuarioRegistroId, concepto }
   */
  async registrarGastoSeleccionador(acopioId, data) {
    const response = await api.post(`/acopios/${acopioId}/gastos/seleccionador`, data);
    return response.data?.data || response.data;
  },
};
