// src/pages/dashboard/Dashboard.jsx - Panel de Control Operativo y Comercial BeaverVault
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ventaService } from '../../services/ventaService';
import { inventarioService } from '../../services/inventarioService';
import { acopioService } from '../../services/acopioService';
import { gastoService } from '../../services/gastoService';
import { exportService } from '../../services/exportService';
import { formatearMoneda, formatearKilos, formatearFecha } from '../../utils/formatters';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { Modal } from '../../components/common/Modal';
import { PeriodFilter } from '../../components/common/PeriodFilter';
import { RefreshButton } from '../../components/common/RefreshButton';
import {
  Scale,
  Truck,
  Store,
  Snowflake,
  Building2,
  Boxes,
  Sprout,
  FileSpreadsheet,
  Download,
  Search,
  ArrowRight,
  Plus,
  Wallet,
  Clock,
  ChevronRight,
  Eye,
} from 'lucide-react';

// Paleta sobria y natural para variedades de palta (sin estridencias ni saturaciones)
const VARIEDADES_CONFIG = {
  Fuerte: {
    nombre: 'Palta Fuerte',
    color: '#D97706', // Ámbar cálido
    colorClaro: '#FEF3C7',
    badge: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  Hass: {
    nombre: 'Palta Hass',
    color: '#15803D', // Verde bosque natural
    colorClaro: '#DCFCE7',
    badge: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  },
  Naval: {
    nombre: 'Palta Naval',
    color: '#0284C7', // Azul almacén sobrio
    colorClaro: '#E0F2FE',
    badge: 'bg-sky-50 text-sky-900 border-sky-200',
  },
  Villacampa: {
    nombre: 'Palta Villacampa',
    color: '#78716C', // Piedra neutro
    colorClaro: '#F5F5F4',
    badge: 'bg-stone-100 text-stone-800 border-stone-200',
  },
};

export function Dashboard() {
  const { user, empresaActiva } = useAuth();
  const empresaId = user?.empresaId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportMsg, setExportMsg] = useState('');
  const [exportando, setExportando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

  // Datos sin procesar
  const [ventas, setVentas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [acopios, setAcopios] = useState([]);
  const [gastos, setGastos] = useState([]);

  // Estado del periodo operativo seleccionado
  const [periodoInfo, setPeriodoInfo] = useState({
    preset: 'ESTE_MES',
    fechaInicio: '',
    fechaFin: '',
    label: 'Este Mes',
  });

  // Interacción: Métrica activa en el gráfico (kilos vs soles)
  const [metricaVariedad, setMetricaVariedad] = useState('kilos'); // 'kilos' | 'soles'

  // Interacción: Variedad seleccionada para ver su detalle de calidades
  const [variedadSeleccionada, setVariedadSeleccionada] = useState('TODAS'); // 'TODAS' | 'Fuerte' | 'Hass' | ...

  // Interacción: Búsqueda y filtro en la tabla de últimas ventas
  const [busquedaVenta, setBusquedaVenta] = useState('');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('TODOS');

  // Interacción: Modal de detalle de una venta específica
  const [ventaDetalleModal, setVentaDetalleModal] = useState(null);

  // Carga paralela de entidades
  const cargarMetricas = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      setError('');

      const [resVentas, resInventario, resAcopios, resGastos] = await Promise.all([
        ventaService.listarVentas(empresaId).catch(() => []),
        inventarioService.listarInventarioPorEmpresa(empresaId).catch(() => []),
        acopioService.listarAcopios(empresaId).catch(() => []),
        gastoService.listarGastosPorEmpresa(empresaId).catch(() => []),
      ]);

      setVentas(Array.isArray(resVentas) ? resVentas : []);
      setInventario(Array.isArray(resInventario) ? resInventario : []);
      setAcopios(Array.isArray(resAcopios) ? resAcopios : []);
      setGastos(Array.isArray(resGastos) ? resGastos : []);
      setUltimaActualizacion(new Date());
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al obtener los datos de la empresa.');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  // Filtro por fecha YYYY-MM-DD
  const dentroDePeriodo = useCallback((fechaStr, inicio, fin) => {
    if (!inicio && !fin) return true;
    if (!fechaStr) return true;
    const ymd = typeof fechaStr === 'string' ? fechaStr.slice(0, 10) : '';
    if (!ymd) return true;
    if (inicio && ymd < inicio) return false;
    if (fin && ymd > fin) return false;
    return true;
  }, []);

  // Ventas filtradas por el periodo activo
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      const fecha = v.fechaVenta || v.createdAt || v.fecha;
      return dentroDePeriodo(fecha, periodoInfo.fechaInicio, periodoInfo.fechaFin);
    });
  }, [ventas, periodoInfo, dentroDePeriodo]);

  // Gastos filtrados por el periodo activo
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g) => {
      const fecha = g.fechaCreacion || g.createdAt || g.fecha;
      return dentroDePeriodo(fecha, periodoInfo.fechaInicio, periodoInfo.fechaFin);
    });
  }, [gastos, periodoInfo, dentroDePeriodo]);

  // 1. Cálculos de Indicadores Principales
  const kpis = useMemo(() => {
    let totalKilosVendidos = 0;
    let totalIngresosCobrados = 0; // Dinero real cobrado en caja (Efectivo, Yape, etc.)
    let totalFiadosEnEspera = 0; // Ventas al crédito pendientes de cobro (sin ganancia anticipada)
    let totalFacturado = 0;

    ventasFiltradas.forEach((v) => {
      const monto = Number(v.montoTotal) || 0;
      totalFacturado += monto;

      const esFiado = (v.metodoPago || '').toLowerCase() === 'fiado';
      if (esFiado) {
        totalFiadosEnEspera += monto;
      } else {
        totalIngresosCobrados += monto;
      }

      if (Array.isArray(v.detalles)) {
        v.detalles.forEach((d) => {
          totalKilosVendidos += Number(d.kilosVendidos) || 0;
        });
      }
    });

    const totalStockLima = inventario.reduce((acc, curr) => {
      return acc + (Number(curr.kilosDisponibles) || 0);
    }, 0);

    const totalGastosOperativos = gastosFiltrados.reduce((acc, curr) => {
      return acc + (Number(curr.montoTotal) || 0);
    }, 0);

    // Margen operativo real en caja: Solo ingresos cobrados menos gastos reales
    const margenOperativo = totalIngresosCobrados - totalGastosOperativos;
    const promedioKilosPorVenta =
      ventasFiltradas.length > 0 ? totalKilosVendidos / ventasFiltradas.length : 0;
    const precioPromedioKilo =
      totalKilosVendidos > 0 ? totalFacturado / totalKilosVendidos : 0;

    const lotesLiquidados = acopios.filter((a) => a.estado === 'Liquidado').length;
    const lotesActivos = acopios.length - lotesLiquidados;

    return {
      totalKilosVendidos,
      totalIngresosCobrados,
      totalFiadosEnEspera,
      totalFacturado,
      totalIngresosVentas: totalIngresosCobrados,
      totalStockLima,
      totalGastosOperativos,
      margenOperativo,
      promedioKilosPorVenta,
      precioPromedioKilo,
      lotesLiquidados,
      lotesActivos,
      totalLotes: acopios.length,
      totalVentasRealizadas: ventasFiltradas.length,
      totalGastosRealizados: gastosFiltrados.length,
    };
  }, [ventasFiltradas, inventario, gastosFiltrados, acopios]);

  // 2. Análisis por Variedad de Palta
  const analisisVariedades = useMemo(() => {
    const mapa = {
      Fuerte: { tipo: 'Fuerte', kilos: 0, subtotal: 0, operaciones: 0, calidades: {} },
      Hass: { tipo: 'Hass', kilos: 0, subtotal: 0, operaciones: 0, calidades: {} },
      Naval: { tipo: 'Naval', kilos: 0, subtotal: 0, operaciones: 0, calidades: {} },
      Villacampa: { tipo: 'Villacampa', kilos: 0, subtotal: 0, operaciones: 0, calidades: {} },
    };

    ventasFiltradas.forEach((v) => {
      if (Array.isArray(v.detalles)) {
        v.detalles.forEach((d) => {
          const t = d.tipoPalta || 'Fuerte';
          if (!mapa[t]) {
            mapa[t] = { tipo: t, kilos: 0, subtotal: 0, operaciones: 0, calidades: {} };
          }
          const kg = Number(d.kilosVendidos) || 0;
          const st = Number(d.subtotal) || 0;
          mapa[t].kilos += kg;
          mapa[t].subtotal += st;
          mapa[t].operaciones += 1;

          const cal = d.categoria || 'Sin Clasificar';
          if (!mapa[t].calidades[cal]) {
            mapa[t].calidades[cal] = { categoria: cal, kilos: 0, subtotal: 0, operaciones: 0 };
          }
          mapa[t].calidades[cal].kilos += kg;
          mapa[t].calidades[cal].subtotal += st;
          mapa[t].calidades[cal].operaciones += 1;
        });
      }
    });

    const lista = Object.values(mapa).sort((a, b) => b.kilos - a.kilos);
    const sumaTotalKilos = lista.reduce((acc, curr) => acc + curr.kilos, 0);
    const sumaTotalSoles = lista.reduce((acc, curr) => acc + curr.subtotal, 0);

    const listaConDetalle = lista.map((item) => {
      const config = VARIEDADES_CONFIG[item.tipo] || {
        nombre: `Palta ${item.tipo}`,
        color: '#78716C',
        colorClaro: '#F5F5F4',
        badge: 'bg-stone-100 text-stone-800 border-stone-200',
      };
      const porcentajeKilos = sumaTotalKilos > 0 ? (item.kilos / sumaTotalKilos) * 100 : 0;
      const porcentajeSoles = sumaTotalSoles > 0 ? (item.subtotal / sumaTotalSoles) * 100 : 0;
      const precioPromedio = item.kilos > 0 ? item.subtotal / item.kilos : 0;

      return {
        ...item,
        config,
        porcentajeKilos,
        porcentajeSoles,
        precioPromedio,
        calidadesLista: Object.values(item.calidades).sort((a, b) => b.kilos - a.kilos),
      };
    });

    const variedadLider =
      listaConDetalle.length > 0 && listaConDetalle[0].kilos > 0 ? listaConDetalle[0] : null;

    return {
      lista: listaConDetalle,
      variedadLider,
      sumaTotalKilos,
      sumaTotalSoles,
    };
  }, [ventasFiltradas]);

  // 3. Calidades a mostrar según la variedad activa
  const calidadesActivas = useMemo(() => {
    if (variedadSeleccionada === 'TODAS') {
      const acumulado = {};
      analisisVariedades.lista.forEach((v) => {
        v.calidadesLista.forEach((c) => {
          if (!acumulado[c.categoria]) {
            acumulado[c.categoria] = { categoria: c.categoria, kilos: 0, subtotal: 0, operaciones: 0 };
          }
          acumulado[c.categoria].kilos += c.kilos;
          acumulado[c.categoria].subtotal += c.subtotal;
          acumulado[c.categoria].operaciones += c.operaciones;
        });
      });
      const items = Object.values(acumulado).sort((a, b) => b.kilos - a.kilos);
      const maxKilos = items.length > 0 ? Math.max(...items.map((i) => i.kilos)) : 1;
      return { items, maxKilos: maxKilos > 0 ? maxKilos : 1, titulo: 'Todas las Variedades' };
    }

    const encontrada = analisisVariedades.lista.find((v) => v.tipo === variedadSeleccionada);
    const items = encontrada ? encontrada.calidadesLista : [];
    const maxKilos = items.length > 0 ? Math.max(...items.map((i) => i.kilos)) : 1;
    return {
      items,
      maxKilos: maxKilos > 0 ? maxKilos : 1,
      titulo: encontrada ? encontrada.config.nombre : variedadSeleccionada,
    };
  }, [variedadSeleccionada, analisisVariedades]);

  // 4. Stock Físico por Puesto en Lima
  const stockPorPuesto = useMemo(() => {
    const mapa = {
      'Puesto Principal': {
        nombre: 'Puesto Principal',
        subtitulo: 'Venta directa en balanza',
        kilos: 0,
        icon: Store,
      },
      'Camara Frio': {
        nombre: 'Cámara de Frío',
        subtitulo: 'Conservación y maduración',
        kilos: 0,
        icon: Snowflake,
      },
      'Puesto Contingencia': {
        nombre: 'Puesto Contingencia',
        subtitulo: 'Puesto auxiliar de despacho',
        kilos: 0,
        icon: Building2,
      },
    };

    inventario.forEach((inv) => {
      const uNombre = inv.ubicacionNombre || '';
      const normalizado = Object.keys(mapa).find((k) => uNombre.includes(k) || k.includes(uNombre));
      const target = normalizado ? mapa[normalizado] : mapa['Puesto Principal'];
      target.kilos += Number(inv.kilosDisponibles) || 0;
    });

    const lista = Object.values(mapa);
    const totalStock = lista.reduce((acc, p) => acc + p.kilos, 0);

    return {
      puestos: lista,
      totalStock,
    };
  }, [inventario]);

  // 5. Filtrado reactivo de las últimas ventas
  const ventasProcesadas = useMemo(() => {
    return ventasFiltradas.filter((venta) => {
      // Filtro por método de pago
      if (filtroMetodoPago !== 'TODOS') {
        const met = (venta.metodoPago || 'Efectivo').toLowerCase();
        if (filtroMetodoPago === 'EFECTIVO' && !met.includes('efectivo')) return false;
        if (filtroMetodoPago === 'DIGITAL' && !met.includes('yape') && !met.includes('plin') && !met.includes('digital')) return false;
        if (filtroMetodoPago === 'TRANSFERENCIA' && !met.includes('transf')) return false;
        if (filtroMetodoPago === 'FIADO' && !met.includes('fiado') && !met.includes('credito')) return false;
      }

      // Filtro por texto de búsqueda
      if (!busquedaVenta.trim()) return true;
      const q = busquedaVenta.toLowerCase().trim();
      const ticket = (venta.ventaId || '').toLowerCase();
      const puesto = (venta.ubicacionNombre || '').toLowerCase();
      const tieneVariedad = Array.isArray(venta.detalles) && venta.detalles.some((d) =>
        (d.tipoPalta || '').toLowerCase().includes(q) ||
        (d.categoria || '').toLowerCase().includes(q)
      );

      return ticket.includes(q) || puesto.includes(q) || tieneVariedad;
    });
  }, [ventasFiltradas, busquedaVenta, filtroMetodoPago]);

  const ultimasVentasMostradas = useMemo(() => {
    return ventasProcesadas.slice(0, 8);
  }, [ventasProcesadas]);

  // Manejador de exportación a Excel (.xlsx multi-hoja)
  const handleExportarExcel = () => {
    try {
      setExportando(true);
      exportService.exportarExcel({
        resumen: {
          periodoLabel: periodoInfo.label,
          fechaInicio: periodoInfo.fechaInicio,
          fechaFin: periodoInfo.fechaFin,
          totalIngresos: kpis.totalIngresosVentas,
          totalGastos: kpis.totalGastosOperativos,
          margenOperativo: kpis.margenOperativo,
          totalKilosVendidos: kpis.totalKilosVendidos,
          totalStockLima: kpis.totalStockLima,
        },
        ventas: ventasFiltradas,
        gastos: gastosFiltrados,
        inventario,
        nombreEmpresa: empresaActiva?.nombre || user?.empresaNombre || 'JOSBECORSA S.A.C.',
      });
      setExportMsg('Reporte en Excel descargado correctamente.');
      setTimeout(() => setExportMsg(''), 4000);
    } catch (err) {
      setError('No se pudo generar el reporte en Excel: ' + (err.message || ''));
    } finally {
      setExportando(false);
    }
  };

  // Manejador de exportación a CSV
  const handleExportarCSV = (tipo = 'resumen') => {
    try {
      setExportando(true);
      exportService.exportarCSV({
        tipo,
        resumen: {
          periodoLabel: periodoInfo.label,
          fechaInicio: periodoInfo.fechaInicio,
          fechaFin: periodoInfo.fechaFin,
          totalIngresos: kpis.totalIngresosVentas,
          totalGastos: kpis.totalGastosOperativos,
          margenOperativo: kpis.margenOperativo,
          totalKilosVendidos: kpis.totalKilosVendidos,
          totalStockLima: kpis.totalStockLima,
        },
        ventas: ventasFiltradas,
        gastos: gastosFiltrados,
        inventario,
      });
      setExportMsg(`Archivo CSV (${tipo === 'ventas' ? 'Ventas' : 'Resumen'}) descargado correctamente.`);
      setTimeout(() => setExportMsg(''), 4000);
    } catch (err) {
      setError('No se pudo generar el archivo CSV: ' + (err.message || ''));
    } finally {
      setExportando(false);
    }
  };

  // Gráfico de Anillos SVG (Donut Chart)
  const radio = 50;
  const circunferencia = 2 * Math.PI * radio;
  const valorTotalDonut = metricaVariedad === 'kilos' ? analisisVariedades.sumaTotalKilos : analisisVariedades.sumaTotalSoles;

  const segmentosDonut = useMemo(() => {
    if (valorTotalDonut <= 0) return [];
    let runningOffset = 0;
    return analisisVariedades.lista
      .filter((v) => (metricaVariedad === 'kilos' ? v.kilos > 0 : v.subtotal > 0))
      .map((item) => {
        const val = metricaVariedad === 'kilos' ? item.kilos : item.subtotal;
        const fraccion = val / valorTotalDonut;
        const longitudArco = fraccion * circunferencia;
        const strokeDasharray = `${longitudArco} ${circunferencia - longitudArco}`;
        const strokeDashoffset = -runningOffset;
        runningOffset += longitudArco;

        return {
          ...item,
          valor: val,
          strokeDasharray,
          strokeDashoffset,
        };
      });
  }, [analisisVariedades, metricaVariedad, valorTotalDonut, circunferencia]);

  const nombreEmpresa = empresaActiva?.nombre || user?.empresaNombre || 'JOSBECORSA';

  return (
    <div className="space-y-6">
      {/* 1. Cabecera Limpia del Panel de Control */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {nombreEmpresa}
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-stone-400 font-medium">Sistema Comercial</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2C221E] tracking-tight">
              Panel de Control
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-500 max-w-2xl">
              Resumen operativo de ventas en balanza, stock disponible en puestos y balance comercial.
            </p>
          </div>

          {/* Acciones Rápidas Principales */}
          <div className="flex flex-wrap items-center gap-2.5">
            <RefreshButton
              onRefresh={cargarMetricas}
              loading={loading}
              label="Actualizar"
              title="Actualizar datos ahora"
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 border-transparent shadow-none"
            />

            <Link
              to="/gastos-operativos"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs transition-colors"
            >
              <Wallet className="w-4 h-4 text-stone-600" />
              <span>Registrar Gasto</span>
            </Link>

            <Link
              to="/ventas"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#E65100] hover:bg-[#C54200] text-white font-bold text-xs shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Venta</span>
            </Link>
          </div>
        </div>

        {/* Notificación de última sincronización */}
        {ultimaActualizacion && (
          <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>
                Datos actualizados a las {ultimaActualizacion.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </span>
            <span className="text-stone-500 font-medium">
              Periodo seleccionado: <strong className="text-stone-700">{periodoInfo.label}</strong>
            </span>
          </div>
        )}
      </div>

      {/* 2. Barra de Selección de Periodo y Descargas */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-stone-50/70 border border-stone-200 p-3 rounded-2xl">
        <div className="flex-1">
          <PeriodFilter onPeriodChange={setPeriodoInfo} initialPreset="ESTE_MES" />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end lg:self-center shrink-0">
          <button
            type="button"
            onClick={handleExportarExcel}
            disabled={exportando || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Descargar libro Excel con hojas tabuladas"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Descargar Excel</span>
          </button>

          <button
            type="button"
            onClick={() => handleExportarCSV('ventas')}
            disabled={exportando || loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-semibold text-xs transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
            title="Descargar detalle de ventas en formato CSV"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>CSV Ventas</span>
          </button>
        </div>
      </div>

      {/* Mensajes de Alerta y Notificaciones */}
      {exportMsg && <Alert type="success" message={exportMsg} onClose={() => setExportMsg('')} />}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading && ventas.length === 0 && inventario.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 flex flex-col items-center justify-center text-center shadow-2xs">
          <Spinner size="lg" />
          <p className="mt-4 text-xs font-semibold text-stone-600">
            Cargando información comercial y operativa...
          </p>
        </div>
      ) : (
        <>
          {/* 3. Indicadores Clave del Periodo (KPIs Limpios y Sobrios) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Kilos Vendidos */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Kilos Despachados
                </span>
                <p className="text-2xl font-extrabold text-[#2C221E] mt-1 tracking-tight">
                  {formatearKilos(kpis.totalKilosVendidos)}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>{kpis.totalVentasRealizadas} pesajes</span>
                <span className="text-[11px] font-medium text-stone-400">
                  prom. {formatearKilos(kpis.promedioKilosPorVenta)}
                </span>
              </div>
            </div>

            {/* Ingresos por Ventas Cobradas */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Ingresos Cobrados en Caja
                </span>
                <p className="text-2xl font-extrabold text-emerald-800 mt-1 tracking-tight">
                  {formatearMoneda(kpis.totalIngresosCobrados)}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Efectivo y digital</span>
                {kpis.totalFiadosEnEspera > 0 ? (
                  <span className="text-[11px] font-bold text-amber-700" title="Ventas al fiado pendientes de cobro">
                    +{formatearMoneda(kpis.totalFiadosEnEspera)} en espera
                  </span>
                ) : (
                  <span className="text-[11px] text-stone-400">Sin fiados pendientes</span>
                )}
              </div>
            </div>

            {/* Gastos Operativos */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Gastos Operativos
                </span>
                <p className="text-2xl font-extrabold text-stone-800 mt-1 tracking-tight">
                  {formatearMoneda(kpis.totalGastosOperativos)}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Fletes y cuadrillas</span>
                <span className="text-[11px] font-medium text-stone-400">
                  {kpis.totalGastosRealizados} registros
                </span>
              </div>
            </div>

            {/* Utilidad Operativa Cobrada */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Utilidad Cobrada en Caja
                </span>
                <p
                  className={`text-2xl font-extrabold mt-1 tracking-tight ${
                    kpis.margenOperativo >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {formatearMoneda(kpis.margenOperativo)}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Cobrado - Gastos</span>
                <span
                  className={`text-[11px] font-bold ${
                    kpis.margenOperativo >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}
                >
                  {kpis.margenOperativo >= 0 ? 'Balance positivo' : 'Déficit'}
                </span>
              </div>
            </div>

            {/* Stock Disponible en Lima */}
            <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Stock en Lima
                </span>
                <p className="text-2xl font-extrabold text-[#2C221E] mt-1 tracking-tight">
                  {formatearKilos(kpis.totalStockLima)}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Disponible en puestos</span>
                <Link
                  to="/inventario"
                  className="text-[11px] font-bold text-[#E65100] hover:underline flex items-center gap-0.5"
                >
                  <span>Ver stock</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* 4. SECCIÓN INTERACTIVA: Participación por Variedad y Calidades */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Gráfico y Distribución por Variedad (5 Columnas) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between">
              <div>
                {/* Cabecera con selector interactivo de métrica (Kilos vs Soles) */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4 gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-[#2C221E]">
                      Ventas por Variedad
                    </h2>
                    <p className="text-xs text-stone-400">Distribución de la palta despachada</p>
                  </div>

                  {/* Selector interactivo: Kilos vs Soles */}
                  <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setMetricaVariedad('kilos')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        metricaVariedad === 'kilos'
                          ? 'bg-white text-stone-900 shadow-2xs font-bold'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Kilos (kg)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetricaVariedad('soles')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        metricaVariedad === 'soles'
                          ? 'bg-white text-stone-900 shadow-2xs font-bold'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Soles (S/.)
                    </button>
                  </div>
                </div>

                {/* Gráfico de Anillos + Leyenda */}
                <div className="flex flex-col sm:flex-row items-center gap-5 my-2">
                  {/* SVG Anillo */}
                  <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                    {segmentosDonut.length > 0 ? (
                      <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                        <circle
                          cx="70"
                          cy="70"
                          r={radio}
                          fill="transparent"
                          stroke="#F5F5F4"
                          strokeWidth="16"
                        />
                        {segmentosDonut.map((seg) => (
                          <circle
                            key={seg.tipo}
                            cx="70"
                            cy="70"
                            r={radio}
                            fill="transparent"
                            stroke={seg.config.color}
                            strokeWidth="16"
                            strokeDasharray={seg.strokeDasharray}
                            strokeDashoffset={seg.strokeDashoffset}
                            className="transition-all duration-300"
                          />
                        ))}
                      </svg>
                    ) : (
                      <div className="w-full h-full rounded-full border-4 border-dashed border-stone-200 flex items-center justify-center">
                        <span className="text-[11px] text-stone-400 font-medium">Sin ventas</span>
                      </div>
                    )}

                    {/* Centro del Anillo */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                      <span className="text-[10px] font-bold text-stone-400 uppercase">Total</span>
                      <span className="text-xs font-black text-stone-800 leading-tight">
                        {metricaVariedad === 'kilos'
                          ? formatearKilos(analisisVariedades.sumaTotalKilos)
                          : formatearMoneda(analisisVariedades.sumaTotalSoles)}
                      </span>
                    </div>
                  </div>

                  {/* Lista interactiva de variedades (al hacer clic filtra las calidades) */}
                  <div className="flex-1 w-full space-y-1.5">
                    {analisisVariedades.lista.map((item) => {
                      const seleccionada = variedadSeleccionada === item.tipo;
                      const porcentaje = metricaVariedad === 'kilos' ? item.porcentajeKilos : item.porcentajeSoles;

                      return (
                        <button
                          key={item.tipo}
                          type="button"
                          onClick={() =>
                            setVariedadSeleccionada(seleccionada ? 'TODAS' : item.tipo)
                          }
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all cursor-pointer ${
                            seleccionada
                              ? 'bg-stone-100 ring-1 ring-stone-300'
                              : 'hover:bg-stone-50 border border-stone-100'
                          }`}
                          title="Haga clic para ver el desglose de calidades de esta variedad"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: item.config.color }}
                            />
                            <span className="font-bold text-stone-800 truncate">
                              {item.config.nombre}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-extrabold text-stone-700">
                              {metricaVariedad === 'kilos'
                                ? formatearKilos(item.kilos)
                                : formatearMoneda(item.subtotal)}
                            </span>
                            <span className="text-[11px] text-stone-400 font-bold w-10 text-right">
                              {porcentaje.toFixed(0)}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pie de Variedad Líder (Sobrio y Profesional) */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                {analisisVariedades.variedadLider ? (
                  <span>
                    Mayor rotación:{' '}
                    <strong className="text-stone-800 font-bold">
                      {analisisVariedades.variedadLider.config.nombre}
                    </strong>{' '}
                    ({analisisVariedades.variedadLider.porcentajeKilos.toFixed(1)}% del volumen)
                  </span>
                ) : (
                  <span>Sin datos en el periodo</span>
                )}
                {variedadSeleccionada !== 'TODAS' && (
                  <button
                    type="button"
                    onClick={() => setVariedadSeleccionada('TODAS')}
                    className="text-[#E65100] font-bold hover:underline text-[11px] cursor-pointer"
                  >
                    Ver todas
                  </button>
                )}
              </div>
            </div>

            {/* Desglose de Calidades / Clasificaciones (7 Columnas) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-[#2C221E]">
                      Ventas por Calidad y Clasificación
                    </h2>
                    <p className="text-xs text-stone-400">
                      Mostrando: <strong className="text-stone-700">{calidadesActivas.titulo}</strong>
                    </p>
                  </div>
                  <span className="text-xs text-stone-400 font-medium">
                    {calidadesActivas.items.length} calidades
                  </span>
                </div>

                {calidadesActivas.items.length > 0 ? (
                  <div className="space-y-3 my-1">
                    {calidadesActivas.items.map((item) => {
                      const porcentajeBarra = Math.min(
                        100,
                        (item.kilos / calidadesActivas.maxKilos) * 100
                      );
                      const shareTotal =
                        analisisVariedades.sumaTotalKilos > 0
                          ? (item.kilos / analisisVariedades.sumaTotalKilos) * 100
                          : 0;
                      const precioPromedio = item.kilos > 0 ? item.subtotal / item.kilos : 0;

                      return (
                        <div key={item.categoria} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-800 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[11px]">
                                {item.categoria}
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {item.operaciones} {item.operaciones === 1 ? 'venta' : 'ventas'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {precioPromedio > 0 && (
                                <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">
                                  S/ {precioPromedio.toFixed(2)}/kg
                                </span>
                              )}
                              <span className="font-extrabold text-stone-800">
                                {formatearKilos(item.kilos)}
                              </span>
                              <span className="text-[11px] text-stone-400 font-semibold w-10 text-right">
                                {shareTotal.toFixed(1)}%
                              </span>
                              <span className="text-xs font-bold text-emerald-800 w-22 text-right">
                                {formatearMoneda(item.subtotal)}
                              </span>
                            </div>
                          </div>

                          {/* Barra de progreso sobria */}
                          <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-stone-700 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(3, porcentajeBarra)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                    <Boxes className="w-8 h-8 text-stone-300 mb-2" />
                    <p className="text-xs font-bold text-stone-600">
                      No hay ventas registradas para este periodo
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Las transacciones de la balanza aparecerán automáticamente aquí.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>
                  Calidad con más volumen:{' '}
                  <strong className="text-stone-800 font-bold">
                    {calidadesActivas.items[0]?.categoria || '-'}
                  </strong>
                </span>
                <Link
                  to="/paltas-vendidas"
                  className="text-[#E65100] font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Historial completo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* 5. SECCIÓN INTERMEDIA: Stock Físico en Lima y Estado de Lotes */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Stock por Puesto en Lima (7 Columnas) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-[#2C221E]">
                    Disponibilidad de Stock en Lima
                  </h2>
                  <p className="text-xs text-stone-400">
                    Kilos disponibles listos para despacho en balanza
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block">Total en Lima</span>
                  <span className="text-sm font-black text-stone-900">
                    {formatearKilos(stockPorPuesto.totalStock)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {stockPorPuesto.puestos.map((puesto) => {
                  const Icon = puesto.icon;
                  const porcentaje =
                    stockPorPuesto.totalStock > 0
                      ? (puesto.kilos / stockPorPuesto.totalStock) * 100
                      : 0;

                  return (
                    <div
                      key={puesto.nombre}
                      className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-xs font-bold text-stone-800">
                            {puesto.nombre}
                          </h3>
                          <p className="text-[10px] text-stone-400 leading-tight">
                            {puesto.subtitulo}
                          </p>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-stone-200/60 text-stone-700 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="mt-2">
                        <span className="text-lg font-black text-stone-900 block tracking-tight">
                          {formatearKilos(puesto.kilos)}
                        </span>
                        <div className="mt-1.5 h-1.5 w-full bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-stone-700 rounded-full"
                            style={{ width: `${Math.max(2, porcentaje)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-stone-500 font-medium mt-1 block text-right">
                          {porcentaje.toFixed(0)}% del stock
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Gestión de reubicación de jabas y kilos</span>
                <Link
                  to="/distribucion"
                  className="text-[#E65100] font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Módulo de Distribución</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Resumen de Lotes de Acopio (5 Columnas) */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <div>
                    <h2 className="text-sm font-bold text-[#2C221E]">
                      Trazabilidad de Acopio
                    </h2>
                    <p className="text-xs text-stone-400">Estado de lotes de campo a liquidación</p>
                  </div>
                  <span className="text-xs font-bold text-stone-600 px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200">
                    {kpis.totalLotes} lotes
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="font-semibold text-stone-700">Lotes en Circulación</span>
                    </div>
                    <span className="font-extrabold text-stone-900 text-sm">
                      {kpis.lotesActivos}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-stone-700">Lotes Liquidados (100% Vendidos)</span>
                    </div>
                    <span className="font-extrabold text-emerald-800 text-sm">
                      {kpis.lotesLiquidados}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-stone-400" />
                      <span className="font-semibold text-stone-700">Total Histórico Registrado</span>
                    </div>
                    <span className="font-extrabold text-stone-900 text-sm">
                      {kpis.totalLotes}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                <span>Lotes, seleccionadores y pesaje</span>
                <Link
                  to="/acopio"
                  className="text-[#E65100] font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Administrar Acopios</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* 6. TABLA INTERACTIVA: Últimas Transacciones en Balanza */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-2xs">
            {/* Cabecera y Controles Interactivos de Filtro */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-100 mb-4">
              <div>
                <h2 className="text-sm font-bold text-[#2C221E]">
                  Últimas Ventas en Balanza
                </h2>
                <p className="text-xs text-stone-400">
                  Transacciones comerciales registradas en el periodo
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Buscador reactivo */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={busquedaVenta}
                    onChange={(e) => setBusquedaVenta(e.target.value)}
                    placeholder="Buscar venta, puesto o variedad..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 bg-stone-50 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400 w-48 sm:w-60"
                  />
                  {busquedaVenta && (
                    <button
                      type="button"
                      onClick={() => setBusquedaVenta('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filtro por método de pago */}
                <select
                  value={filtroMetodoPago}
                  onChange={(e) => setFiltroMetodoPago(e.target.value)}
                  className="text-xs font-semibold text-stone-700 bg-stone-50 border border-stone-200 rounded-lg py-1.5 px-2.5 focus:outline-none cursor-pointer"
                >
                  <option value="TODOS">Todos los métodos</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="DIGITAL">Yape / Plin</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="FIADO">Fiado / Crédito</option>
                </select>
              </div>
            </div>

            {/* Tabla de registros */}
            {ultimasVentasMostradas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px] bg-stone-50/60">
                      <th className="py-2.5 px-3">Fecha y Hora</th>
                      <th className="py-2.5 px-3">Puesto</th>
                      <th className="py-2.5 px-3">Variedad y Calidad</th>
                      <th className="py-2.5 px-3 text-right">Kilos</th>
                      <th className="py-2.5 px-3 text-right">Importe</th>
                      <th className="py-2.5 px-3 text-center">Forma de Pago</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {ultimasVentasMostradas.map((venta) => {
                      const primerDetalle = venta.detalles?.[0];
                      const totalKgVenta = Array.isArray(venta.detalles)
                        ? venta.detalles.reduce((acc, d) => acc + (Number(d.kilosVendidos) || 0), 0)
                        : 0;

                      return (
                        <tr
                          key={venta.ventaId}
                          onClick={() => setVentaDetalleModal(venta)}
                          className="hover:bg-stone-50 transition-colors cursor-pointer group"
                        >
                          <td className="py-2.5 px-3 text-stone-700 whitespace-nowrap font-medium">
                            {formatearFecha(venta.fechaVenta)}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-stone-800 whitespace-nowrap">
                            {venta.ubicacionNombre || 'Puesto Principal'}
                          </td>
                          <td className="py-2.5 px-3">
                            {primerDetalle ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-stone-800">
                                  Palta {primerDetalle.tipoPalta}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-600 font-semibold">
                                  {primerDetalle.categoria}
                                </span>
                                {venta.detalles.length > 1 && (
                                  <span className="text-[10px] text-stone-400 font-medium">
                                    +{venta.detalles.length - 1} más
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-stone-400">Venta regular</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-stone-900 whitespace-nowrap">
                            {formatearKilos(totalKgVenta)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-800 whitespace-nowrap">
                            {formatearMoneda(venta.montoTotal)}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                              {venta.metodoPago || 'Efectivo'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setVentaDetalleModal(venta);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-md transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Ver</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-stone-400 text-xs">
                {busquedaVenta || filtroMetodoPago !== 'TODOS'
                  ? 'No se encontraron ventas con los filtros aplicados.'
                  : 'No se registran ventas en este periodo.'}
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>
                Mostrando {ultimasVentasMostradas.length} de {ventasProcesadas.length} transacciones
              </span>
              <Link
                to="/paltas-vendidas"
                className="text-[#E65100] font-bold hover:underline inline-flex items-center gap-1"
              >
                <span>Ver todas las ventas registradas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </>
      )}

      {/* 7. Módulos Operativos de la Empresa (Navegación Rápida) */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-stone-700">
            Etapas Operativas del Negocio
          </h2>
          <span className="text-xs text-stone-400">Flujo de trabajo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              numero: '01',
              titulo: 'Acopio en Provincia',
              descripcion: 'Lotes de campo, pesaje inicial y cuadrillas de selección.',
              to: '/acopio',
              icono: Sprout,
              linkTexto: 'Ir a Acopio',
            },
            {
              numero: '02',
              titulo: 'Gastos y Fletes',
              descripcion: 'Fletes de transporte a Lima, estiba y gastos operativos.',
              to: '/gastos-operativos',
              icono: Truck,
              linkTexto: 'Ver Gastos',
            },
            {
              numero: '03',
              titulo: 'Distribución en Lima',
              descripcion: 'Reubicación en puestos, cámara de frío y control de jabas.',
              to: '/distribucion',
              icono: Building2,
              linkTexto: 'Ver Distribución',
            },
            {
              numero: '04',
              titulo: 'Ventas en Balanza',
              descripcion: 'Pesaje por kilos, emisión de comprobantes y punto de venta.',
              to: '/ventas',
              icono: Scale,
              linkTexto: 'Abrir Balanza',
            },
          ].map((etapa) => {
            const Icon = etapa.icono;
            return (
              <div
                key={etapa.numero}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs hover:border-stone-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">
                      Etapa {etapa.numero}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-stone-900 mb-1">
                    {etapa.titulo}
                  </h3>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    {etapa.descripcion}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-stone-100">
                  <Link
                    to={etapa.to}
                    className="inline-flex items-center justify-between w-full text-xs font-bold text-stone-700 hover:text-[#E65100] transition-colors"
                  >
                    <span>{etapa.linkTexto}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 8. MODAL INTERACTIVO: Detalle de Comprobante / Venta */}
      {ventaDetalleModal && (
        <Modal
          isOpen={!!ventaDetalleModal}
          onClose={() => setVentaDetalleModal(null)}
          title={`Detalle de Venta #${(ventaDetalleModal.ventaId || '').slice(0, 8)}`}
          subtitle="Comprobante registrado en balanza"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            {/* Metadatos de la venta */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Fecha y Hora</span>
                <span className="font-semibold text-stone-800">
                  {formatearFecha(ventaDetalleModal.fechaVenta)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Puesto / Almacén</span>
                <span className="font-semibold text-stone-800">
                  {ventaDetalleModal.ubicacionNombre || 'Puesto Principal'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Forma de Pago</span>
                <span className="font-semibold text-stone-800">
                  {ventaDetalleModal.metodoPago || 'Efectivo'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-stone-400 block">Vendedor</span>
                <span className="font-semibold text-stone-800">
                  {ventaDetalleModal.vendedorNombre || ventaDetalleModal.usuario?.nombre || 'General'}
                </span>
              </div>
            </div>

            {/* Tabla de ítems vendidos */}
            <div>
              <span className="text-xs font-bold text-stone-700 block mb-2">
                Paltas Pesadas en Balanza:
              </span>
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-600 font-bold text-[10px] uppercase">
                    <tr>
                      <th className="py-2 px-3">Variedad</th>
                      <th className="py-2 px-3">Calidad</th>
                      <th className="py-2 px-3 text-right">Kilos</th>
                      <th className="py-2 px-3 text-right">Precio/kg</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {Array.isArray(ventaDetalleModal.detalles) && ventaDetalleModal.detalles.length > 0 ? (
                      ventaDetalleModal.detalles.map((item, idx) => (
                        <tr key={idx} className="hover:bg-stone-50">
                          <td className="py-2 px-3 font-bold text-stone-800">
                            Palta {item.tipoPalta || 'Fuerte'}
                          </td>
                          <td className="py-2 px-3 text-stone-600">
                            {item.categoria || '1era'}
                          </td>
                          <td className="py-2 px-3 text-right font-semibold text-stone-800">
                            {formatearKilos(item.kilosVendidos)}
                          </td>
                          <td className="py-2 px-3 text-right text-stone-600">
                            {formatearMoneda(item.precioUnitario)}
                          </td>
                          <td className="py-2 px-3 text-right font-black text-emerald-800">
                            {formatearMoneda(item.subtotal)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-3 px-3 text-center text-stone-400">
                          Sin desglose de ítems disponible
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total final */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-xs font-bold text-emerald-900">Total Liquidado:</span>
              <span className="text-xl font-black text-emerald-900">
                {formatearMoneda(ventaDetalleModal.montoTotal)}
              </span>
            </div>

            {/* Botón cerrar */}
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setVentaDetalleModal(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
