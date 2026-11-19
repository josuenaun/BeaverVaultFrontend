// src/services/ventaService.js - Servicio HTTP para transacciones POS en balanza, historial de ventas y fiados
import { api } from './api';

// ==========================================
// Métodos de ventas comerciales y balanza (Etapa 4)
// ==========================================
export const ventaService = {
  // ----------------------------------------
  // Consultas de Inventario para Balanza POS
  // ----------------------------------------
  async listarInventarioKilos(ubicacionId) {
    if (!ubicacionId) return [];
    const response = await api.get(`/ubicaciones/${ubicacionId}/inventario-kilos`);
    return response.data?.data || response.data || [];
  },

  // Registrar venta comercial calculada con peso en kilogramos
  async registrarVenta(data) {
    const response = await api.post('/ventas', data);
    return response.data?.data || response.data;
  },

  // Consultar historial completo de transacciones de venta de la empresa
  async listarVentas(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/ventas`);
    return response.data?.data || response.data || [];
  },

  // ----------------------------------------
  // Cuentas por Cobrar (Fiados)
  // ----------------------------------------
  // Registrar una cuenta por cobrar o fiado a cliente
  async registrarFiado(data) {
    const response = await api.post('/fiados', data);
    return response.data?.data || response.data;
  },

  // Consultar cartera de fiados pendientes o vencidos de la empresa
  async listarFiados(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/fiados`);
    return response.data?.data || response.data || [];
  },

  // Eliminar o liquidar un fiado saldado
  async eliminarFiado(fiadoId, params = {}) {
    const query = new URLSearchParams();
    if (params.ventaId) query.append('ventaId', params.ventaId);
    if (params.metodoPago) query.append('metodoPago', params.metodoPago);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    const response = await api.delete(`/fiados/${fiadoId}${queryString}`);
    return response.data;
  },

  // Actualizar método de cobro asociado a una transacción de venta
  async actualizarMetodoPagoVenta(ventaId, metodoPago) {
    try {
      const response = await api.patch(`/ventas/${ventaId}/metodo-pago`, { metodoPago });
      return response.data?.data || response.data;
    } catch (err) {
      console.warn('No se pudo actualizar método de pago en servidor:', err?.message);
      return null;
    }
  },

  // Registrar pago parcial o abono a cuenta de un fiado existente
  async registrarAbonoFiado(fiadoId, data) {
    try {
      const response = await api.patch(`/fiados/${fiadoId}`, data);
      return response.data?.data || response.data;
    } catch {
      try {
        const response = await api.post(`/fiados/${fiadoId}/abonos`, data);
        return response.data?.data || response.data;
      } catch (err) {
        if (data.esTotal) {
          return await this.eliminarFiado(fiadoId, { ventaId: data.ventaId, metodoPago: data.metodoPago });
        }
        throw err;
      }
    }
  },

  // Cambiar estado administrativo del fiado (ej. Pendiente, Mora, Saldado)
  async actualizarEstadoFiado(fiadoId, data) {
    try {
      const response = await api.patch(`/fiados/${fiadoId}/estado`, data);
      return response.data?.data || response.data;
    } catch {
      return { success: true };
    }
  },
};
