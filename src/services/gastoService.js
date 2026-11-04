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
   * Registrar un nuevo gasto operativo vinculado obligatoriamente a un acopio.
   * Despacha según el tipo de gasto al endpoint correspondiente de la API:
   * - 'Seleccionador': POST /api/acopios/:acopioId/gastos/seleccionador
   * - 'Transporte': POST /api/acopios/:acopioId/transporte
   * - 'Estibador' | 'Cargador': POST /api/acopios/:acopioId/gastos/descarga
   * @param {Object} data
   */
  async registrarGasto(data) {
    const {
      acopioId,
      tipoGasto,
      nombreReceptor,
      cantidadJabas,
      tarifaPorJaba,
      montoTotal,
      usuarioRegistroId,
      concepto,
    } = data;

    if (!acopioId) {
      throw new Error('El lote de acopio es obligatorio para registrar un gasto operativo.');
    }

    if (tipoGasto === 'Seleccionador') {
      const response = await api.post(`/acopios/${acopioId}/gastos/seleccionador`, {
        nombreReceptor: nombreReceptor.trim(),
        cantidadJabas: Math.round(Number(cantidadJabas)),
        tarifaPorJaba: Number(tarifaPorJaba),
        usuarioRegistroId,
        concepto: concepto?.trim(),
      });
      return response.data?.data || response.data;
    }

    if (tipoGasto === 'Transporte') {
      const response = await api.post(`/acopios/${acopioId}/transporte`, {
        fleteCosto: Number(montoTotal),
        nombreReceptor: nombreReceptor.trim(),
        usuarioRegistroId,
        concepto: concepto?.trim(),
      });
      return response.data?.data || response.data;
    }

    if (tipoGasto === 'Estibador' || tipoGasto === 'Cargador') {
      const response = await api.post(`/acopios/${acopioId}/gastos/descarga`, {
        tipoGasto,
        nombreReceptor: nombreReceptor.trim(),
        cantidadJabas: Math.round(Number(cantidadJabas)),
        tarifaPorJaba: Number(tarifaPorJaba),
        usuarioRegistroId,
        concepto: concepto?.trim(),
      });
      return response.data?.data || response.data;
    }

    throw new Error(`Tipo de gasto no válido: ${tipoGasto}`);
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
