// src/services/ventaService.js - Servicio HTTP para Etapa 4: Ventas, Balanza e Inventario en Kilos
import { api } from './api';

export const ventaService = {
  /**
   * Obtener inventario disponible en kilos por ubicación física
   * (GET /api/ubicaciones/:ubicacionId/inventario-kilos)
   * @param {string} ubicacionId
   */
  async listarInventarioKilos(ubicacionId) {
    if (!ubicacionId) return [];
    const response = await api.get(`/ubicaciones/${ubicacionId}/inventario-kilos`);
    return response.data?.data || response.data || [];
  },

  /**
   * Registrar venta mayorista por kilogramos en balanza
   * (POST /api/ventas)
   * @param {Object} data - { empresaId, vendedorUsuarioId, ubicacionId, detalles }
   */
  async registrarVenta(data) {
    const response = await api.post('/ventas', data);
    return response.data?.data || response.data;
  },

  /**
   * Listar historial de ventas de una empresa
   * (GET /api/empresas/:empresaId/ventas)
   * @param {string} empresaId
   */
  async listarVentas(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/ventas`);
    return response.data?.data || response.data || [];
  },

  /**
   * Registrar cuenta por cobrar / fiado
   * (POST /api/fiados)
   * @param {Object} data - { empresaId, nombreDeudor, motivoDeuda, montoDeuda, fechaAdvertencia, creadoPorUsuarioId }
   */
  async registrarFiado(data) {
    const response = await api.post('/fiados', data);
    return response.data?.data || response.data;
  },

  /**
   * Listar cuentas por cobrar / fiados de una empresa
   * (GET /api/empresas/:empresaId/fiados)
   * @param {string} empresaId
   */
  async listarFiados(empresaId) {
    if (!empresaId) return [];
    const response = await api.get(`/empresas/${empresaId}/fiados`);
    return response.data?.data || response.data || [];
  },

  /**
   * Eliminar o saldar fiado
   * (DELETE /api/fiados/:fiadoId)
   * @param {string} fiadoId
   * @param {Object} [params] - { ventaId, metodoPago }
   */
  async eliminarFiado(fiadoId, params = {}) {
    const query = new URLSearchParams();
    if (params.ventaId) query.append('ventaId', params.ventaId);
    if (params.metodoPago) query.append('metodoPago', params.metodoPago);
    const queryString = query.toString() ? `?${query.toString()}` : '';

    const response = await api.delete(`/fiados/${fiadoId}${queryString}`);
    return response.data;
  },

  /**
   * Actualizar método de pago de una venta
   * (PATCH /api/ventas/:ventaId/metodo-pago)
   * @param {string} ventaId
   * @param {string} metodoPago
   */
  async actualizarMetodoPagoVenta(ventaId, metodoPago) {
    try {
      const response = await api.patch(`/ventas/${ventaId}/metodo-pago`, { metodoPago });
      return response.data?.data || response.data;
    } catch (err) {
      console.warn('No se pudo actualizar método de pago en servidor:', err?.message);
      return null;
    }
  },

  /**
   * Registrar abono parcial de un fiado
   * (POST /api/fiados/:fiadoId/abonos o PATCH /api/fiados/:fiadoId)
   * @param {string} fiadoId
   * @param {Object} data - { montoAbono, metodoPago, nota, esTotal, ventaId }
   */
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

  /**
   * Actualizar estado del fiado (ej. 'Mora', 'Saldado')
   * (PATCH /api/fiados/:fiadoId/estado)
   * @param {string} fiadoId
   * @param {Object} data - { estado: 'Mora' | 'Saldado' | 'Pendiente' }
   */
  async actualizarEstadoFiado(fiadoId, data) {
    try {
      const response = await api.patch(`/fiados/${fiadoId}/estado`, data);
      return response.data?.data || response.data;
    } catch {
      return { success: true };
    }
  },
};
