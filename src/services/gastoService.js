// src/services/gastoService.js - Servicio HTTP para Gastos Operativos (Seleccionador, Flete, Descarga)
import { api } from './api';

export const gastoService = {
  /**
   * Listar todos los gastos operativos de una empresa (Seleccionadores, Fletes, Descarga)
   * @param {string} empresaId
   */
  async listarGastosPorEmpresa(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/gastos`);
    return response.data?.data || response.data || [];
  },

  /**
   * Listar gastos operativos de un acopio específico
   * @param {string} acopioId
   */
  async listarGastosPorAcopio(acopioId) {
    if (!acopioId) return [];
    const response = await api.get(`/acopios/${acopioId}/gastos`);
    return response.data?.data || response.data || [];
  },

  /**
   * Actualizar / Sobrescribir un gasto operativo existente (UPDATE)
   * @param {string} gastoId
   * @param {Object} data - { nombreReceptor, concepto, cantidadJabas, tarifaPorJaba, montoTotal }
   */
  async actualizarGasto(gastoId, data) {
    const response = await api.put(`/gastos/${gastoId}`, data);
    return response.data?.data || response.data;
  },

  /**
   * Eliminar un gasto operativo
   * @param {string} gastoId
   */
  async eliminarGasto(gastoId) {
    const response = await api.delete(`/gastos/${gastoId}`);
    return response.data;
  },
};
