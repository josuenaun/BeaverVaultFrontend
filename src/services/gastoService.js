// src/services/gastoService.js - Servicio HTTP para registro, actualización y consulta de gastos operativos
import { api } from './api';

// ==========================================
// Métodos de gestión de gastos operativos
// ==========================================
export const gastoService = {
  // Consultar todos los gastos operativos asociados a una empresa
  async listarGastosPorEmpresa(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/gastos`);
    return response.data?.data || response.data || [];
  },

  // Consultar los gastos operativos imputados a un lote de acopio específico
  async listarGastosPorAcopio(acopioId) {
    if (!acopioId) return [];
    const response = await api.get(`/acopios/${acopioId}/gastos`);
    return response.data?.data || response.data || [];
  },

  // Registrar un nuevo gasto operativo despachando según el tipo (Seleccionador, Transporte, Descarga)
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

    // Gasto por mano de obra de seleccionador en campo
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

    // Gasto por flete y transporte de provincia hacia Lima
    if (tipoGasto === 'Transporte') {
      const response = await api.post(`/acopios/${acopioId}/transporte`, {
        fleteCosto: Number(montoTotal),
        nombreReceptor: nombreReceptor.trim(),
        usuarioRegistroId,
        concepto: concepto?.trim(),
      });
      return response.data?.data || response.data;
    }

    // Gasto por estiba y descarga en almacén o mercado de Lima
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

  // Actualizar la información de un gasto operativo previamente registrado
  async actualizarGasto(gastoId, data) {
    const response = await api.put(`/gastos/${gastoId}`, data);
    return response.data?.data || response.data;
  },

  // Eliminar un registro de gasto operativo del sistema
  async eliminarGasto(gastoId) {
    const response = await api.delete(`/gastos/${gastoId}`);
    return response.data;
  },
};
