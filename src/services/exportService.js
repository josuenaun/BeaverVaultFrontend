// src/services/exportService.js - Servicio de exportación de reportes a Excel (.xlsx) y CSV
import * as XLSX from 'xlsx';
import { formatearMoneda, formatearKilos, formatearFecha } from '../utils/formatters';

export const exportService = {
  /**
   * Genera y descarga un libro de trabajo Excel (.xlsx) con 4 hojas tabuladas:
   * 1. Resumen Ejecutivo
   * 2. Detalle de Ventas
   * 3. Gastos Operativos
   * 4. Inventario por Puesto
   * 
   * @param {Object} params
   * @param {Object} params.resumen - { periodoLabel, fechaInicio, fechaFin, totalIngresos, totalGastos, margenOperativo, totalKilosVendidos, totalStockLima }
   * @param {Array} params.ventas - Array de objetos venta
   * @param {Array} params.gastos - Array de objetos gasto
   * @param {Array} params.inventario - Array de objetos inventario
   * @param {string} params.nombreEmpresa - Nombre de la empresa
   */
  exportarExcel({ resumen, ventas = [], gastos = [], inventario = [], nombreEmpresa = 'JOSBECORSA S.A.C.' }) {
    const wb = XLSX.utils.book_new();

    // -------------------------------------------------------------
    // HOJA 1: RESUMEN EJECUTIVO
    // -------------------------------------------------------------
    const resumenData = [
      ['SISTEMA MAYORISTA JOSBECORSA - REPORTE CONSOLIDADO'],
      ['Empresa:', nombreEmpresa],
      ['Periodo:', resumen.periodoLabel || 'Histórico Completo'],
      ['Rango de Fechas:', `${resumen.fechaInicio || 'Inicio'} hasta ${resumen.fechaFin || 'Hoy'}`],
      ['Fecha de Emisión:', new Date().toLocaleString('es-PE')],
      [],
      ['INDICADOR FINANCIERO / OPERATIVO', 'VALOR'],
      ['Ingresos Totales por Ventas (S/.)', Number((resumen.totalIngresos || 0).toFixed(2))],
      ['Gastos Operativos Totales (S/.)', Number((resumen.totalGastos || 0).toFixed(2))],
      ['Margen Operativo Neto (S/.)', Number((resumen.margenOperativo || 0).toFixed(2))],
      ['Kilos Totales de Palta Vendidos (kg)', Number((resumen.totalKilosVendidos || 0).toFixed(2))],
      ['Stock Actual Disponible en Lima (kg)', Number((resumen.totalStockLima || 0).toFixed(2))],
      ['Número de Transacciones de Venta', ventas.length],
      ['Número de Gastos Operativos Registrados', gastos.length],
    ];

    const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
    wsResumen['!cols'] = [{ wch: 40 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen Ejecutivo');

    // -------------------------------------------------------------
    // HOJA 2: DETALLE DE VENTAS
    // -------------------------------------------------------------
    const ventasFilas = [];
    ventas.forEach((v) => {
      const fecha = formatearFecha(v.fechaVenta || v.createdAt || v.fecha);
      const vendedor = v.vendedorNombre || v.vendedor?.nombre || v.usuario?.nombre || 'Vendedor General';
      const ubicacion = v.ubicacionNombre || v.ubicacion?.nombre || v.ubicacion?.tipo || 'Puesto Principal';
      const metodoPago = v.metodoPago || 'Efectivo';
      const ventaIdCorto = (v.ventaId || '').slice(0, 8);

      const detalles = v.detalles || v._detalles || [];
      if (detalles.length > 0) {
        detalles.forEach((d) => {
          ventasFilas.push({
            'ID Ticket': ventaIdCorto ? `#${ventaIdCorto}` : 'S/N',
            'Fecha / Hora': fecha,
            'Puesto / Ubicación': ubicacion,
            'Vendedor': vendedor,
            'Variedad de Palta': d.tipoPalta || 'Fuerte',
            'Categoría / Calidad': d.categoria || '1era',
            'Kilos Vendidos (kg)': Number(Number(d.kilosVendidos || 0).toFixed(2)),
            'Precio Unitario (S/.)': Number(Number(d.precioUnitario || 0).toFixed(2)),
            'Subtotal (S/.)': Number(Number(d.subtotal || 0).toFixed(2)),
            'Método de Pago': metodoPago,
          });
        });
      } else {
        ventasFilas.push({
          'ID Ticket': ventaIdCorto ? `#${ventaIdCorto}` : 'S/N',
          'Fecha / Hora': fecha,
          'Puesto / Ubicación': ubicacion,
          'Vendedor': vendedor,
          'Variedad de Palta': 'General',
          'Categoría / Calidad': '-',
          'Kilos Vendidos (kg)': 0,
          'Precio Unitario (S/.)': 0,
          'Subtotal (S/.)': Number(Number(v.montoTotal || 0).toFixed(2)),
          'Método de Pago': metodoPago,
        });
      }
    });

    const wsVentas = XLSX.utils.json_to_sheet(
      ventasFilas.length > 0
        ? ventasFilas
        : [{ Mensaje: 'No se registraron ventas en el periodo seleccionado' }]
    );
    wsVentas['!cols'] = [
      { wch: 12 }, // ID Ticket
      { wch: 18 }, // Fecha / Hora
      { wch: 22 }, // Puesto / Ubicación
      { wch: 22 }, // Vendedor
      { wch: 18 }, // Variedad
      { wch: 18 }, // Categoría
      { wch: 18 }, // Kilos
      { wch: 18 }, // Precio
      { wch: 16 }, // Subtotal
      { wch: 16 }, // Método
    ];
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Detalle de Ventas');

    // -------------------------------------------------------------
    // HOJA 3: GASTOS OPERATIVOS
    // -------------------------------------------------------------
    const gastosFilas = gastos.map((g) => {
      const fecha = formatearFecha(g.fechaCreacion || g.createdAt || g.fecha);
      const lote = g.acopio?.encargadoLote
        ? `${g.acopio.encargadoLote} (${g.acopio.origen || ''})`
        : (g.acopioId ? `Lote #${g.acopioId.slice(0, 8)}` : 'General');

      return {
        'Fecha': fecha,
        'Tipo de Gasto': g.tipoGasto || 'General',
        'Beneficiario / Receptor': g.nombreReceptor || '-',
        'Lote Acopio Vinculado': lote,
        'Cantidad Jabas': g.cantidadJabas ? Number(g.cantidadJabas) : '-',
        'Tarifa por Jaba (S/.)': g.tarifaPorJaba ? Number(Number(g.tarifaPorJaba).toFixed(2)) : '-',
        'Monto Total (S/.)': Number(Number(g.montoTotal || 0).toFixed(2)),
        'Concepto': g.concepto || '-',
      };
    });

    const wsGastos = XLSX.utils.json_to_sheet(
      gastosFilas.length > 0
        ? gastosFilas
        : [{ Mensaje: 'No se registraron gastos operativos en el periodo seleccionado' }]
    );
    wsGastos['!cols'] = [
      { wch: 18 }, // Fecha
      { wch: 18 }, // Tipo de Gasto
      { wch: 26 }, // Beneficiario
      { wch: 30 }, // Lote Acopio
      { wch: 15 }, // Cantidad Jabas
      { wch: 20 }, // Tarifa
      { wch: 18 }, // Monto Total
      { wch: 40 }, // Concepto
    ];
    XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos Operativos');

    // -------------------------------------------------------------
    // HOJA 4: INVENTARIO ACTUAL
    // -------------------------------------------------------------
    const inventarioFilas = inventario.map((item) => ({
      'Puesto / Ubicación': item.ubicacionNombre || item.ubicacion?.nombre || item.ubicacion?.tipo || 'Puesto General',
      'Tipo de Ubicación': item.ubicacion?.tipo || 'Almacén',
      'Variedad de Palta': item.tipoPalta || 'Fuerte',
      'Categoría / Calidad': item.categoria || '1era',
      'Stock Disponible (kg)': Number(Number(item.kilosDisponibles || 0).toFixed(2)),
    }));

    const wsInventario = XLSX.utils.json_to_sheet(
      inventarioFilas.length > 0
        ? inventarioFilas
        : [{ Mensaje: 'No hay stock registrado en el sistema' }]
    );
    wsInventario['!cols'] = [
      { wch: 24 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
    ];
    XLSX.utils.book_append_sheet(wb, wsInventario, 'Inventario Actual');

    // Generar archivo y forzar descarga en navegador
    const fechaISO = new Date().toISOString().split('T')[0];
    const nombreLimpio = `Reporte_Financiero_JOSBECORSA_${fechaISO}.xlsx`;
    XLSX.writeFile(wb, nombreLimpio);
  },

  /**
   * Exporta a archivo plano CSV con codificación UTF-8 con BOM (\uFEFF)
   * para compatibilidad nativa instantánea en Excel sin problemas de tildes o caracteres especiales.
   * 
   * @param {Object} params
   * @param {string} params.tipo - 'resumen' | 'ventas' | 'gastos' | 'inventario'
   * @param {Object} params.data - datos correspondientes
   */
  exportarCSV({ tipo = 'resumen', resumen, ventas = [], gastos = [], inventario = [] }) {
    let lineas = [];
    const fechaISO = new Date().toISOString().split('T')[0];
    let nombreArchivo = `Reporte_JOSBECORSA_${tipo}_${fechaISO}.csv`;

    if (tipo === 'resumen') {
      lineas = [
        'Indicador;Valor',
        `Periodo;${resumen?.periodoLabel || 'Histórico Completo'}`,
        `Rango de Fechas;${resumen?.fechaInicio || 'Inicio'} a ${resumen?.fechaFin || 'Hoy'}`,
        `Ingresos Totales (S/.);${(resumen?.totalIngresos || 0).toFixed(2)}`,
        `Gastos Operativos (S/.);${(resumen?.totalGastos || 0).toFixed(2)}`,
        `Margen Operativo Neto (S/.);${(resumen?.margenOperativo || 0).toFixed(2)}`,
        `Kilos Vendidos (kg);${(resumen?.totalKilosVendidos || 0).toFixed(2)}`,
        `Stock en Lima (kg);${(resumen?.totalStockLima || 0).toFixed(2)}`,
        `Total de Ventas;${ventas.length}`,
        `Total de Gastos;${gastos.length}`,
      ];
    } else if (tipo === 'ventas') {
      lineas = [
        'Ticket;Fecha;Ubicacion;Vendedor;Variedad;Categoria;Kilos;PrecioUnitario;Subtotal;MetodoPago',
      ];
      ventas.forEach((v) => {
        const fecha = formatearFecha(v.fechaVenta || v.createdAt || v.fecha);
        const vendedor = v.vendedorNombre || v.vendedor?.nombre || v.usuario?.nombre || 'General';
        const ubicacion = v.ubicacionNombre || v.ubicacion?.nombre || v.ubicacion?.tipo || 'Puesto Principal';
        const metodo = v.metodoPago || 'Efectivo';
        const ticket = (v.ventaId || '').slice(0, 8);
        const detalles = v.detalles || v._detalles || [];

        detalles.forEach((d) => {
          lineas.push(
            `#${ticket};"${fecha}";"${ubicacion}";"${vendedor}";"${d.tipoPalta || 'Fuerte'}";"${d.categoria || '1era'}";${d.kilosVendidos || 0};${d.precioUnitario || 0};${d.subtotal || 0};"${metodo}"`
          );
        });
      });
    } else if (tipo === 'gastos') {
      lineas = [
        'Fecha;TipoGasto;Beneficiario;LoteAcopio;CantidadJabas;TarifaJaba;MontoTotal;Concepto',
      ];
      gastos.forEach((g) => {
        const fecha = formatearFecha(g.fechaCreacion || g.createdAt || g.fecha);
        const lote = g.acopio?.encargadoLote ? `"${g.acopio.encargadoLote}"` : `Lote #${(g.acopioId || '').slice(0, 8)}`;
        lineas.push(
          `"${fecha}";"${g.tipoGasto || 'General'}";"${g.nombreReceptor || '-'}";${lote};${g.cantidadJabas || ''};${g.tarifaPorJaba || ''};${g.montoTotal || 0};"${g.concepto || '-'}"`
        );
      });
    } else if (tipo === 'inventario') {
      lineas = [
        'Ubicacion;TipoUbicacion;Variedad;Categoria;KilosDisponibles',
      ];
      inventario.forEach((it) => {
        const u = it.ubicacionNombre || it.ubicacion?.nombre || it.ubicacion?.tipo || 'Puesto General';
        const tipoU = it.ubicacion?.tipo || 'Almacen';
        lineas.push(
          `"${u}";"${tipoU}";"${it.tipoPalta}";"${it.categoria}";${it.kilosDisponibles || 0}`
        );
      });
    }

    const contenidoCSV = '\uFEFF' + lineas.join('\n');
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
