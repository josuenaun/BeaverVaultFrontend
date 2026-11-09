// src/pages/dashboard/Dashboard.jsx - Panel de control corporativo y analítico JOSBECORSA
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ventaService } from '../../services/ventaService';
import { inventarioService } from '../../services/inventarioService';
import { acopioService } from '../../services/acopioService';
import { gastoService } from '../../services/gastoService';
import { formatearMoneda, formatearKilos, formatearFecha } from '../../utils/formatters';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { Badge } from '../../components/common/Badge';
import {
  Sprout,
  Truck,
  Building2,
  Scale,
  ArrowRight,
  TrendingUp,
  Award,
  Trophy,
  RefreshCw,
  Store,
  Snowflake,
  PieChart,
  BarChart3,
  CheckCircle2,
  Boxes,
  Percent,
} from 'lucide-react';

// Paleta institucional JOSBECORSA para variedades de palta
const COLORES_PALTA = {
  Fuerte: {
    nombre: 'Palta Fuerte',
    color: '#E65100', // Naranja Cosecha Institucional
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-950',
    badge: 'bg-orange-100 text-orange-800 border-orange-300',
    dot: '#E65100',
  },
  Hass: {
    nombre: 'Palta Hass',
    color: '#15803D', // Verde Palta / Esmeralda
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-950',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: '#15803D',
  },
  Naval: {
    nombre: 'Palta Naval',
    color: '#0288D1', // Azul Frío Almacén
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-950',
    badge: 'bg-sky-100 text-sky-800 border-sky-300',
    dot: '#0288D1',
  },
  Villacampa: {
    nombre: 'Palta Villacampa',
    color: '#CA8A04', // Dorado Ámbar
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-950',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    dot: '#CA8A04',
  },
};

const ETAPAS_ACCIONES = [
  {
    etapa: 'Etapa 1',
    titulo: 'Acopio en Provincia',
    descripcion: 'Lotes de campo, selección y pesaje.',
    to: '/acopio',
    accionTexto: 'Gestionar Acopio',
    icon: Sprout,
    iconoBg: 'bg-[#E65100] text-white',
  },
  {
    etapa: 'Etapa 2',
    titulo: 'Transporte a Lima',
    descripcion: 'Fletes, control de chofer y pesaje en ruta.',
    to: '/transporte',
    accionTexto: 'Ver Fletes',
    icon: Truck,
    iconoBg: 'bg-[#6D4C41] text-white',
  },
  {
    etapa: 'Etapa 3',
    titulo: 'Distribución en Lima',
    descripcion: 'Reubicación en puestos, cámaras y stock.',
    to: '/distribucion',
    accionTexto: 'Tablero Distribución',
    icon: Building2,
    iconoBg: 'bg-[#2C221E] text-white',
  },
  {
    etapa: 'Etapa 4',
    titulo: 'Ventas y Balanza (POS)',
    descripcion: 'Venta por kilogramos y emisión de tickets.',
    to: '/ventas',
    accionTexto: 'Abrir Balanza POS',
    icon: Scale,
    iconoBg: 'bg-[#E65100] text-white',
  },
];

export function Dashboard() {
  const { user } = useAuth();
  const empresaId = user?.empresaId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ventas, setVentas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [acopios, setAcopios] = useState([]);
  const [gastos, setGastos] = useState([]);

  // Carga paralela de todas las entidades del negocio
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
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al compilar métricas analíticas.');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarMetricas();
  }, [cargarMetricas]);

  // 1. Cálculos de KPIs Clave
  const kpis = useMemo(() => {
    let totalKilosVendidos = 0;
    let totalIngresosVentas = 0;

    ventas.forEach((v) => {
      totalIngresosVentas += Number(v.montoTotal) || 0;
      if (Array.isArray(v.detalles)) {
        v.detalles.forEach((d) => {
          totalKilosVendidos += Number(d.kilosVendidos) || 0;
        });
      }
    });

    const totalStockLima = inventario.reduce((acc, curr) => {
      return acc + (Number(curr.kilosDisponibles) || 0);
    }, 0);

    const totalGastosOperativos = gastos.reduce((acc, curr) => {
      return acc + (Number(curr.montoTotal) || 0);
    }, 0);

    const margenOperativo = totalIngresosVentas - totalGastosOperativos;

    const lotesLiquidados = acopios.filter((a) => a.estado === 'Liquidado').length;
    const lotesActivos = acopios.length - lotesLiquidados;

    return {
      totalKilosVendidos,
      totalIngresosVentas,
      totalStockLima,
      totalGastosOperativos,
      margenOperativo,
      lotesLiquidados,
      lotesActivos,
      totalLotes: acopios.length,
      totalVentasRealizadas: ventas.length,
    };
  }, [ventas, inventario, gastos, acopios]);

  // 2. Análisis por Variedad de Palta (Palta Más Vendida y Gráfico de Anillos)
  const analisisVariedades = useMemo(() => {
    const mapa = {
      Fuerte: { tipo: 'Fuerte', kilos: 0, subtotal: 0, conteo: 0 },
      Hass: { tipo: 'Hass', kilos: 0, subtotal: 0, conteo: 0 },
      Naval: { tipo: 'Naval', kilos: 0, subtotal: 0, conteo: 0 },
      Villacampa: { tipo: 'Villacampa', kilos: 0, subtotal: 0, conteo: 0 },
    };

    ventas.forEach((v) => {
      if (Array.isArray(v.detalles)) {
        v.detalles.forEach((d) => {
          const t = d.tipoPalta || 'Fuerte';
          if (!mapa[t]) {
            mapa[t] = { tipo: t, kilos: 0, subtotal: 0, conteo: 0 };
          }
          mapa[t].kilos += Number(d.kilosVendidos) || 0;
          mapa[t].subtotal += Number(d.subtotal) || 0;
          mapa[t].conteo += 1;
        });
      }
    });

    const lista = Object.values(mapa).sort((a, b) => b.kilos - a.kilos);
    const sumaTotalKilos = lista.reduce((acc, curr) => acc + curr.kilos, 0);

    // Calcular porcentajes
    const listaConPorcentaje = lista.map((item) => ({
      ...item,
      porcentaje: sumaTotalKilos > 0 ? (item.kilos / sumaTotalKilos) * 100 : 0,
      config: COLORES_PALTA[item.tipo] || {
        color: '#6D4C41',
        dot: '#6D4C41',
        nombre: `Palta ${item.tipo}`,
        badge: 'bg-stone-100 text-stone-800 border-stone-200',
      },
    }));

    const paltaMasVendida = listaConPorcentaje.length > 0 && listaConPorcentaje[0].kilos > 0
      ? listaConPorcentaje[0]
      : null;

    return {
      lista: listaConPorcentaje,
      paltaMasVendida,
      sumaTotalKilos,
    };
  }, [ventas]);

  // 3. Ventas por Categoría / Calidad (Gráfico de Barras Horizontal)
  const analisisCalidades = useMemo(() => {
    const mapa = {};
    ventas.forEach((v) => {
      if (Array.isArray(v.detalles)) {
        v.detalles.forEach((d) => {
          const c = d.categoria || 'Sin Categoría';
          if (!mapa[c]) {
            mapa[c] = { categoria: c, kilos: 0, subtotal: 0, pedidos: 0 };
          }
          mapa[c].kilos += Number(d.kilosVendidos) || 0;
          mapa[c].subtotal += Number(d.subtotal) || 0;
          mapa[c].pedidos += 1;
        });
      }
    });

    const items = Object.values(mapa).sort((a, b) => b.kilos - a.kilos);
    const maxKilos = items.length > 0 ? Math.max(...items.map((i) => i.kilos)) : 1;

    return {
      items,
      maxKilos: maxKilos > 0 ? maxKilos : 1,
    };
  }, [ventas]);

  // 4. Stock Físico por Puesto en Lima
  const stockPorPuesto = useMemo(() => {
    const mapa = {
      'Camara Frio': { nombre: 'Cámara de Frío', kilos: 0, icon: Snowflake, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-200' },
      'Puesto Principal': { nombre: 'Puesto Principal', kilos: 0, icon: Store, color: 'text-[#E65100]', bg: 'bg-orange-50', border: 'border-orange-200' },
      'Puesto Contingencia': { nombre: 'Puesto Contingencia', kilos: 0, icon: Building2, color: 'text-[#6D4C41]', bg: 'bg-[#6D4C41]/10', border: 'border-[#6D4C41]/20' },
    };

    inventario.forEach((inv) => {
      const uNombre = inv.ubicacionNombre || '';
      const normalizado = Object.keys(mapa).find((k) => uNombre.includes(k) || k.includes(uNombre));
      const target = normalizado ? mapa[normalizado] : mapa['Puesto Principal'];
      target.kilos += Number(inv.kilosDisponibles) || 0;
    });

    const totalStock = Object.values(mapa).reduce((acc, p) => acc + p.kilos, 0);

    return {
      puestos: Object.values(mapa),
      totalStock,
    };
  }, [inventario]);

  // 5. Últimas ventas en Balanza
  const ultimasVentas = useMemo(() => {
    return [...ventas].slice(0, 6);
  }, [ventas]);

  // Construcción del Gráfico de Anillos SVG (Donut Chart)
  // Perímetro = 2 * PI * radio (r = 50 -> C = ~314.159)
  const radio = 50;
  const circunferencia = 2 * Math.PI * radio;

  const segmentosDonut = useMemo(() => {
    if (analisisVariedades.sumaTotalKilos <= 0) {
      return [];
    }

    let runningOffset = 0;
    return analisisVariedades.lista
      .filter((v) => v.kilos > 0)
      .map((item) => {
        const fraccion = item.kilos / analisisVariedades.sumaTotalKilos;
        const longitudArco = fraccion * circunferencia;
        const strokeDasharray = `${longitudArco} ${circunferencia - longitudArco}`;
        const strokeDashoffset = -runningOffset;
        runningOffset += longitudArco;

        return {
          ...item,
          strokeDasharray,
          strokeDashoffset,
        };
      });
  }, [analisisVariedades, circunferencia]);

  return (
    <div className="space-y-6">
      {/* 1. Header Corporativo Principal JOSBECORSA S.A.C. */}
      <div className="bg-[#6D4C41] text-white rounded-2xl p-6 sm:p-7 shadow-md relative overflow-hidden border border-[#5D3F35]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-[#E65100] text-white">
                EMPRESA MATRIZ
              </span>
              <span className="text-xs text-[#E8D8C8] font-bold">
                JOSBECORSA S.A.C.
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Dashboard de Control Mayorista
            </h1>
            <p className="mt-1 text-[#E8D8C8] text-xs sm:text-sm leading-relaxed">
              Monitoreo analítico de ventas en balanza, rotación por variedad, stock en puestos de Lima y rentabilidad comercial.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={cargarMetricas}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs backdrop-blur-sm border border-white/20 transition-all cursor-pointer shadow-xs"
              title="Actualizar métricas en tiempo real"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Sincronizar Datos</span>
            </button>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {loading && ventas.length === 0 && inventario.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 flex flex-col items-center justify-center text-center shadow-xs">
          <Spinner size="lg" />
          <p className="mt-4 text-xs font-bold text-[#2C221E]">Cargando estadísticas ejecutivas de JOSBECORSA...</p>
        </div>
      ) : (
        <>
          {/* 2. Grid de KPIs Ejecutivos (5 Tarjetas Principales) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Kilos Vendidos */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Kilos Vendidos</span>
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#E65100] flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-[#2C221E] tracking-tight">
              {formatearKilos(kpis.totalKilosVendidos)}
            </span>
            <p className="text-[11px] font-semibold text-stone-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>{kpis.totalVentasRealizadas} transacciones balanza</span>
            </p>
          </div>
        </div>

        {/* Ingresos Totales */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ingresos Totales</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-700 tracking-tight">
              {formatearMoneda(kpis.totalIngresosVentas)}
            </span>
            <p className="text-[11px] font-semibold text-stone-500 mt-1">
              Venta bruta acumulada
            </p>
          </div>
        </div>

        {/* Stock Activo en Lima */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Stock en Lima</span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-[#2C221E] tracking-tight">
              {formatearKilos(kpis.totalStockLima)}
            </span>
            <p className="text-[11px] font-semibold text-stone-500 mt-1">
              Disponible en 3 puestos
            </p>
          </div>
        </div>

        {/* Gastos Operativos */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gastos Operativos</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-rose-700 tracking-tight">
              {formatearMoneda(kpis.totalGastosOperativos)}
            </span>
            <p className="text-[11px] font-semibold text-stone-500 mt-1">
              Fletes, estiba y cuadrillas
            </p>
          </div>
        </div>

        {/* Margen Operativo Bruto */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Margen Bruto</span>
            <div className="w-8 h-8 rounded-xl bg-[#6D4C41]/10 text-[#6D4C41] flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className={`text-2xl font-black tracking-tight ${kpis.margenOperativo >= 0 ? 'text-[#2C221E]' : 'text-rose-600'}`}>
              {formatearMoneda(kpis.margenOperativo)}
            </span>
            <p className="text-[11px] font-semibold text-stone-500 mt-1">
              {kpis.margenOperativo >= 0 ? 'Balance positivo' : 'Margen ajustado'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Hero Destacado: LA PALTA MÁS VENDIDA DE JOSBECORSA */}
      {analisisVariedades.paltaMasVendida ? (
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-white rounded-2xl p-5 border-2 border-orange-200 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-13 h-13 rounded-2xl bg-[#E65100] text-white flex items-center justify-center shadow-md shrink-0">
                <Trophy className="w-7 h-7 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E65100] text-white shadow-2xs">
                    ⭐ TOP SELLER JOSBECORSA
                  </span>
                  <span className="text-xs font-bold text-amber-900">
                    Líder Comercial de la Empresa
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#2C221E] mt-0.5">
                  Palta {analisisVariedades.paltaMasVendida.tipo}
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  Representa el <span className="font-extrabold text-[#E65100]">{analisisVariedades.paltaMasVendida.porcentaje.toFixed(1)}%</span> de todo el volumen despachado con {formatearKilos(analisisVariedades.paltaMasVendida.kilos)} comercializados.
                </p>
              </div>
            </div>

            {/* Métricas destacadas del Top Seller */}
            <div className="flex items-center gap-4 bg-white/90 p-3.5 rounded-xl border border-orange-200/80 shadow-2xs">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Total Recaudado</span>
                <span className="text-base sm:text-lg font-black text-emerald-700">
                  {formatearMoneda(analisisVariedades.paltaMasVendida.subtotal)}
                </span>
              </div>
              <div className="h-8 w-px bg-stone-200" />
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-stone-500 block">Kilos Despachados</span>
                <span className="text-base sm:text-lg font-black text-[#E65100]">
                  {formatearKilos(analisisVariedades.paltaMasVendida.kilos)}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* 4. SECCIÓN ANALÍTICA: Gráfico de Anillos + Gráfico de Barras */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* GRÁFICO DE ANILLOS (Donut Chart) - 5 Columnas */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#E65100] flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C221E]">
                    Participación por Variedad
                  </h3>
                  <p className="text-[11px] text-stone-500">Gráfico de anillos de ventas en kilos</p>
                </div>
              </div>
              <span className="text-xs font-bold text-stone-500">
                Total: {formatearKilos(analisisVariedades.sumaTotalKilos)}
              </span>
            </div>

            {/* Renderizado del SVG Donut Chart */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-3">
              <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                {segmentosDonut.length > 0 ? (
                  <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 140 140">
                    <circle
                      cx="70"
                      cy="70"
                      r={radio}
                      fill="transparent"
                      stroke="#F1F5F9"
                      strokeWidth="18"
                    />
                    {segmentosDonut.map((seg) => (
                      <circle
                        key={seg.tipo}
                        cx="70"
                        cy="70"
                        r={radio}
                        fill="transparent"
                        stroke={seg.config.color}
                        strokeWidth="18"
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        className="transition-all duration-500 hover:opacity-85"
                      />
                    ))}
                  </svg>
                ) : (
                  <div className="w-full h-full rounded-full border-8 border-stone-100 flex items-center justify-center">
                    <span className="text-xs text-stone-400 font-bold">Sin datos</span>
                  </div>
                )}

                {/* Centro del Anillo */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  {analisisVariedades.paltaMasVendida ? (
                    <>
                      <Award className="w-4 h-4 text-[#E65100] mb-0.5" />
                      <span className="text-[11px] font-extrabold text-stone-500 uppercase">Top</span>
                      <span className="text-sm font-black text-[#2C221E] leading-tight">
                        {analisisVariedades.paltaMasVendida.tipo}
                      </span>
                      <span className="text-xs font-extrabold text-[#E65100]">
                        {analisisVariedades.paltaMasVendida.porcentaje.toFixed(0)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-stone-400 font-bold">0 kg</span>
                  )}
                </div>
              </div>

              {/* Leyenda Detallada con Kilos y Porcentaje */}
              <div className="flex-1 w-full space-y-2">
                {analisisVariedades.lista.map((item) => {
                  return (
                    <div
                      key={item.tipo}
                      className="flex items-center justify-between p-2 rounded-xl border border-stone-100 hover:bg-stone-50 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3 h-3 rounded-md shrink-0 shadow-2xs"
                          style={{ backgroundColor: item.config.color }}
                        />
                        <span className="font-bold text-[#2C221E] truncate">
                          {item.config.nombre}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-black text-stone-800">
                          {formatearKilos(item.kilos)}
                        </span>
                        <span className="text-[11px] font-extrabold text-stone-500 w-11 text-right">
                          {item.porcentaje.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-semibold">
            <span>Matriz Oficial JOSBECORSA</span>
            <span className="text-[#E65100] font-bold">4 Variedades Certificadas</span>
          </div>
        </div>

        {/* GRÁFICO DE BARRAS (Calidades y Rotación) - 7 Columnas */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C221E]">
                    Ventas por Calidad / Categoría
                  </h3>
                  <p className="text-[11px] text-stone-500">Gráfico de barras de volumen en kilogramos</p>
                </div>
              </div>
              <span className="text-xs font-bold text-stone-500">
                {analisisCalidades.items.length} calidades registradas
              </span>
            </div>

            {/* Barras Horizontales con Escala Proporcional */}
            {analisisCalidades.items.length > 0 ? (
              <div className="space-y-3.5 py-2">
                {analisisCalidades.items.map((item) => {
                  const porcentajeBarra = Math.min(100, (item.kilos / analisisCalidades.maxKilos) * 100);
                  const shareTotal = analisisVariedades.sumaTotalKilos > 0
                    ? (item.kilos / analisisVariedades.sumaTotalKilos) * 100
                    : 0;

                  return (
                    <div key={item.categoria} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#2C221E] px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200">
                            Calidad {item.categoria}
                          </span>
                          <span className="text-[11px] text-stone-500 font-semibold">
                            {item.pedidos} {item.pedidos === 1 ? 'pedido' : 'pedidos'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="font-black text-[#E65100]">
                            {formatearKilos(item.kilos)}
                          </span>
                          <span className="text-[11px] font-bold text-stone-400 w-10 text-right">
                            {shareTotal.toFixed(1)}%
                          </span>
                          <span className="text-xs font-bold text-emerald-700 w-20 text-right">
                            {formatearMoneda(item.subtotal)}
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progreso */}
                      <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden border border-stone-200/60 p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-[#E65100] rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(4, porcentajeBarra)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center text-center p-4">
                <BarChart3 className="w-8 h-8 text-stone-300 mb-2" />
                <p className="text-xs font-bold text-stone-600">Aún no se han registrado ventas en balanza</p>
                <p className="text-[11px] text-stone-400">Diríjase al módulo de Ventas (Etapa 4) para iniciar operaciones.</p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Mayor rotación: <strong className="text-stone-800">{analisisCalidades.items[0]?.categoria || '-'}</strong></span>
            <Link to="/ventas" className="text-[#E65100] font-bold hover:underline flex items-center gap-1">
              <span>Ir a Balanza</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. SECCIÓN INTERMEDIA: Stock Físico por Puesto + Control de Lotes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Distribución de Stock Físico por Puesto (7 Columnas) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                <Boxes className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#2C221E]">
                  Stock Físico por Puesto en Lima
                </h3>
                <p className="text-[11px] text-stone-500">Kilos disponibles listos para despacho en balanza</p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-[#E65100]">
              Total: {formatearKilos(stockPorPuesto.totalStock)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stockPorPuesto.puestos.map((puesto) => {
              const Icon = puesto.icon;
              const porcentaje = stockPorPuesto.totalStock > 0
                ? (puesto.kilos / stockPorPuesto.totalStock) * 100
                : 0;

              return (
                <div
                  key={puesto.nombre}
                  className={`p-4 rounded-xl border ${puesto.border} ${puesto.bg} flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-extrabold text-[#2C221E] truncate">
                      {puesto.nombre}
                    </span>
                    <Icon className={`w-4 h-4 shrink-0 ${puesto.color}`} />
                  </div>
                  <div>
                    <span className="text-xl font-black text-[#2C221E] block">
                      {formatearKilos(puesto.kilos)}
                    </span>
                    <div className="mt-2 h-1.5 w-full bg-white/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#E65100] rounded-full"
                        style={{ width: `${Math.max(2, porcentaje)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-stone-500 mt-1 block text-right">
                      {porcentaje.toFixed(1)}% del stock
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resumen de Lotes de Acopio (5 Columnas) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center">
                  <Sprout className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#2C221E]">
                    Trazabilidad de Acopio
                  </h3>
                  <p className="text-[11px] text-stone-500">Lotes activos vs liquidados</p>
                </div>
              </div>
              <Badge status={kpis.lotesActivos > 0 ? 'Recibido_Lima' : 'Liquidado'} />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                <span className="font-bold text-stone-600">Lotes en Circulación</span>
                <span className="font-black text-[#E65100] text-sm">{kpis.lotesActivos} lotes</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Lotes Liquidados (100% Vendidos)</span>
                </span>
                <span className="font-black text-emerald-700 text-sm">{kpis.lotesLiquidados} lotes</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200 text-xs">
                <span className="font-bold text-stone-600">Total Lotes Históricos</span>
                <span className="font-black text-stone-800 text-sm">{kpis.totalLotes} lotes</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-100 text-right">
            <Link to="/acopio" className="text-xs font-bold text-[#E65100] hover:underline inline-flex items-center gap-1">
              <span>Gestionar Acopios</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Tabla de Últimas Ventas Realizadas en Balanza */}
      <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs">
        <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-[#E65100] flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2C221E]">
                Últimas Transacciones en Balanza
              </h3>
              <p className="text-[11px] text-stone-500">Historial reciente de ventas mayoristas registradas</p>
            </div>
          </div>
          <Link
            to="/ventas"
            className="text-xs font-bold text-[#E65100] hover:underline flex items-center gap-1"
          >
            <span>Ver todas las ventas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {ultimasVentas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Fecha / Hora</th>
                  <th className="py-2.5 px-3">Puesto</th>
                  <th className="py-2.5 px-3">Detalle de Palta</th>
                  <th className="py-2.5 px-3 text-right">Kilos</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-center">Método</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {ultimasVentas.map((venta) => {
                  const primerDetalle = venta.detalles?.[0];
                  const totalKgVenta = Array.isArray(venta.detalles)
                    ? venta.detalles.reduce((acc, d) => acc + (Number(d.kilosVendidos) || 0), 0)
                    : 0;

                  return (
                    <tr key={venta.ventaId} className="hover:bg-stone-50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-stone-700 whitespace-nowrap">
                        {formatearFecha(venta.fechaVenta)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#2C221E] whitespace-nowrap">
                        {venta.ubicacionNombre || 'Puesto Principal'}
                      </td>
                      <td className="py-2.5 px-3">
                        {primerDetalle ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[#E65100]">
                              Palta {primerDetalle.tipoPalta}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 font-bold">
                              {primerDetalle.categoria}
                            </span>
                            {venta.detalles.length > 1 && (
                              <span className="text-[10px] text-stone-400 font-bold">
                                +{venta.detalles.length - 1} más
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-stone-400">Venta estándar</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-[#2C221E] whitespace-nowrap">
                        {formatearKilos(totalKgVenta)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-emerald-700 whitespace-nowrap">
                        {formatearMoneda(venta.montoTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                          {venta.metodoPago || 'Efectivo'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-stone-400 text-xs">
            Sin transacciones registradas actualmente.
          </div>
        )}
      </div>
      </>
      )}

      {/* 7. Grid de las 4 Etapas Operativas (Navegación Rápida) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-[#2C221E] flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#E65100]" />
            <span>Módulos de Operación de la Empresa</span>
          </h2>
          <span className="text-xs text-stone-500 font-semibold">Trazabilidad Total</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ETAPAS_ACCIONES.map((modulo) => {
            const Icon = modulo.icon;
            return (
              <div
                key={modulo.etapa}
                className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:shadow-md hover:border-stone-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                      {modulo.etapa}
                    </span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${modulo.iconoBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[#2C221E] mb-1.5">
                    {modulo.titulo}
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    {modulo.descripcion}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100">
                  <Link
                    to={modulo.to}
                    className="inline-flex items-center justify-between w-full text-xs font-bold text-[#E65100] hover:text-[#C54200] transition-colors group"
                  >
                    <span>{modulo.accionTexto}</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
