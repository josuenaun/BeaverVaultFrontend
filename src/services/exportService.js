// src/services/exportService.js - Servicio para generación y descarga de reportes contables en Excel (.xlsx) y CSV
import * as XLSX from 'xlsx';
import { formatearFecha } from '../utils/formatters';

// ==========================================
// Métodos de exportación de reportes
// ==========================================
export const exportService = {
  // ----------------------------------------
  // Exportar reporte consolidado a formato Microsoft Excel (.xlsx)
  // Genera un libro estructurado con 4 hojas de trabajo
  // ----------------------------------------
  exportarExcel({ resumen, ventas = [], gastos = [], inventario = [], nombreEmpresa = 'BeaverVault S.A.C.' }) {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Resumen Ejecutivo e Indicadores Principales
    const resumenData = [
      ['SISTEMA MAYORISTA BEAVERVAULT - REPORTE CONSOLIDADO'],
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

    // Hoja 2: Detalle Desglosado de Ventas
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
      { wch: 12 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Detalle de Ventas');

    // Hoja 3: Gastos Operativos Imputados
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
      { wch: 18 },
      { wch: 18 },
      { wch: 26 },
      { wch: 30 },
      { wch: 15 },
      { wch: 20 },
      { wch: 18 },
      { wch: 40 },
    ];
    XLSX.utils.book_append_sheet(wb, wsGastos, 'Gastos Operativos');

    // Hoja 4: Existencias de Inventario Actual
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

    // Generar archivo y activar descarga
    const fechaISO = new Date().toISOString().split('T')[0];
    const nombreLimpio = `Reporte_Financiero_BeaverVault_${fechaISO}.xlsx`;
    XLSX.writeFile(wb, nombreLimpio);
  },

  // ----------------------------------------
  // Exportar datos a archivo plano CSV compatible con UTF-8 BOM
  // Permite abrir directamente en Excel preservando acentos y caracteres
  // ----------------------------------------
  exportarCSV({ tipo = 'resumen', resumen, ventas = [], gastos = [], inventario = [] }) {
    let lineas = [];
    const fechaISO = new Date().toISOString().split('T')[0];
    let nombreArchivo = `Reporte_BeaverVault_${tipo}_${fechaISO}.csv`;

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

    // Construcción del archivo Blob con BOM y forzado de descarga en cliente
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
