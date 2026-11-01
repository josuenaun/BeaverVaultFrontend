// src/pages/inventario/InventarioView.jsx - Módulo de Inventario de Kilos por Puesto
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { inventarioService } from '../../services/inventarioService';
import { acopioService } from '../../services/acopioService';
import { ventaService } from '../../services/ventaService';
import { formatearKilos, formatearFecha } from '../../utils/formatters';
import { UBICACIONES, TIPOS_PALTA, UBICACION_ICONS } from '../../utils/constants';
import { Alert } from '../../components/common/Alert';
import { Spinner } from '../../components/common/Spinner';
import {
  Warehouse,
  Scale,
  RefreshCw,
  Search,
  Filter,
  Snowflake,
  Store,
  Building2,
  ArrowRight,
  TrendingUp,
  PackageCheck,
  CheckCircle2,
  AlertCircle,
  Box,
} from 'lucide-react';

export function InventarioView() {
  const { empresaId, empresaActiva } = useAuth();
  const navigate = useNavigate();

  const [inventario, setInventario] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [acopios, setAcopios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [transformando, setTransformando] = useState(false);

  // Filtros interactivos
  const [filtroUbicacion, setFiltroUbicacion] = useState('TODOS');
  const [filtroPalta, setFiltroPalta] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Normalizar nombre de ubicación para match uniforme
  const normalizarNombreUbicacion = useCallback((nombre) => {
    if (!nombre) return '';
    const norm = nombre.toLowerCase().trim();
    if (norm.includes('frio') || norm.includes('frío') || norm.includes('camara')) return 'Camara Frio';
    if (norm.includes('contingencia')) return 'Puesto Contingencia';
    if (norm.includes('principal')) return 'Puesto Principal';
    return nombre;
  }, []);

  // Cargar inventario en balanza, ubicaciones y acopios con jabas distribuidas
  const cargarInventario = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    setError('');
    try {
      const [dataInventario, dataUbicaciones, dataAcopios] = await Promise.all([
        inventarioService.listarInventarioPorEmpresa(empresaId),
        inventarioService.listarUbicaciones(empresaId),
        acopioService.listarAcopios(empresaId),
      ]);
      setInventario(Array.isArray(dataInventario) ? dataInventario : []);
      setUbicaciones(Array.isArray(dataUbicaciones) ? dataUbicaciones : []);
      setAcopios(Array.isArray(dataAcopios) ? dataAcopios : []);
    } catch (err) {
      console.error('Error cargando inventario por puesto:', err);
      setError(err?.response?.data?.error || err?.message || 'No se pudo cargar el inventario de kilos.');
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarInventario();
  }, [cargarInventario]);

  // Mapa de configuración visual para las 3 ubicaciones de Lima (Iconos estandarizados)
  const configUbicaciones = useMemo(() => ({
    'Camara Frio': {
      nombre: 'Cámara Frío',
      icono: Snowflake,
      colorBg: 'bg-sky-50 text-sky-700 border-sky-200',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      accentColor: '#0288D1',
      descripcion: 'Conservación en frío y control de maduración.',
    },
    'Puesto Principal': {
      nombre: 'Puesto Principal',
      icono: Store,
      colorBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      accentColor: '#10B981',
      descripcion: 'Punto neurálgico de venta mayorista y balanza.',
    },
    'Puesto Contingencia': {
      nombre: 'Puesto Contingencia',
      icono: Building2,
      colorBg: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      accentColor: '#F59E0B',
      descripcion: 'Desfogue de stock rápido y ventas de apoyo.',
    },
  }), []);

  // Extraer todas las jabas ubicadas en Lima desde los acopios
  const jabasEnLima = useMemo(() => {
    const list = [];
    acopios.forEach((acopio) => {
      const jabas = acopio.jabas || [];
      jabas.forEach((jaba) => {
        const ubicacionObj = ubicaciones.find((u) => u.ubicacionId === jaba.ubicacionId);
        const norm = normalizarNombreUbicacion(ubicacionObj?.tipo || ubicacionObj?.nombre);
        if (norm && UBICACIONES.includes(norm)) {
          list.push({
            ...jaba,
            ubicacionNombre: norm,
            acopioOrigen: acopio.origen,
            acopioId: acopio.acopioId,
          });
        }
      });
    });
    return list;
  }, [acopios, ubicaciones, normalizarNombreUbicacion]);

  // Jabas que están ubicadas en Lima pero aún no se han transformado a inventarios_kilos
  const jabasPendientesTransformar = useMemo(() => {
    return jabasEnLima.filter((j) => j.estado !== 'Convertida_Kilos');
  }, [jabasEnLima]);

  // Convertir todas las jabas pendientes de Lima a balanza (¡Sin merma!)
  const handleConvertirTodasABalanza = async () => {
    if (jabasPendientesTransformar.length === 0) return;
    try {
      setTransformando(true);
      setError('');
      await Promise.all(
        jabasPendientesTransformar.map((j) =>
          ventaService.transformarJabaAKilos(j.jabaId, j.ubicacionId)
        )
      );
      setSuccessMsg('¡Todas las jabas distribuidas en Lima han sido convertidas a Balanza sin merma!');
      setTimeout(() => setSuccessMsg(''), 5000);
      await cargarInventario();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al convertir jabas a balanza.'
      );
    } finally {
      setTransformando(false);
    }
  };

  // Convertir jabas pendientes de un puesto específico
  const handleConvertirPuestoABalanza = async (puestoKey) => {
    const jabasPuesto = jabasPendientesTransformar.filter((j) => j.ubicacionNombre === puestoKey);
    if (jabasPuesto.length === 0) return;

    try {
      setTransformando(true);
      setError('');
      await Promise.all(
        jabasPuesto.map((j) => ventaService.transformarJabaAKilos(j.jabaId, j.ubicacionId))
      );
      setSuccessMsg(`¡Jabas de ${puestoKey} convertidas a Balanza exitosamente!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      await cargarInventario();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Error al convertir jabas a balanza.');
    } finally {
      setTransformando(false);
    }
  };

  // Métricas y totales calculados considerando stock en balanza y jabas en Lima
  const metricas = useMemo(() => {
    let totalKilosBalanza = 0;
    let totalKilosJabas = 0;

    const kilosPorPuesto = {
      'Camara Frio': { balanza: 0, jabas: 0, total: 0, jabasCount: 0 },
      'Puesto Principal': { balanza: 0, jabas: 0, total: 0, jabasCount: 0 },
      'Puesto Contingencia': { balanza: 0, jabas: 0, total: 0, jabasCount: 0 },
    };

    const variedadesPresentes = new Set();

    // 1. Kilos ya en Balanza (inventarios_kilos)
    inventario.forEach((item) => {
      const kilos = Number(item.kilosDisponibles ?? item._kilosDisponibles) || 0;
      totalKilosBalanza += kilos;

      const norm = normalizarNombreUbicacion(item.ubicacionNombre || item.ubicacionTipo);
      if (kilosPorPuesto[norm]) {
        kilosPorPuesto[norm].balanza += kilos;
        kilosPorPuesto[norm].total += kilos;
      }
      if (kilos > 0 && item.tipoPalta) {
        variedadesPresentes.add(item.tipoPalta);
      }
    });

    // 2. Kilos en jabas distribuidas que están pendientes de pasar a balanza
    jabasPendientesTransformar.forEach((jaba) => {
      const kilos = Number(jaba.pesoBruto) || 0;
      totalKilosJabas += kilos;

      const norm = jaba.ubicacionNombre;
      if (kilosPorPuesto[norm]) {
        kilosPorPuesto[norm].jabas += kilos;
        kilosPorPuesto[norm].total += kilos;
        kilosPorPuesto[norm].jabasCount += Number(jaba.cantidadJabas) || 1;
      }
      if (kilos > 0 && jaba.tipoPalta) {
        variedadesPresentes.add(jaba.tipoPalta);
      }
    });

    return {
      totalKilosEmpresa: totalKilosBalanza + totalKilosJabas,
      totalKilosBalanza,
      totalKilosJabas,
      kilosPorPuesto,
      variedadesCount: variedadesPresentes.size,
      totalJabasPendientes: jabasPendientesTransformar.length,
    };
  }, [inventario, jabasPendientesTransformar, normalizarNombreUbicacion]);

  // Lista unificada de items de inventario (Balanza + Jabas en Lima)
  const itemsFiltrados = useMemo(() => {
    // 1. Items de Balanza
    const balanzaItems = inventario.map((it) => ({
      ...it,
      origenTipo: 'Balanza',
      kilos: Number(it.kilosDisponibles ?? it._kilosDisponibles) || 0,
      puestoNorm: normalizarNombreUbicacion(it.ubicacionNombre || it.ubicacionTipo),
    }));

    // 2. Items de Jabas Pendientes
    const jabasItems = jabasPendientesTransformar.map((j) => ({
      inventarioId: `jaba-${j.jabaId}`,
      ubicacionId: j.ubicacionId,
      ubicacionNombre: j.ubicacionNombre,
      puestoNorm: j.ubicacionNombre,
      tipoPalta: j.tipoPalta,
      categoria: j.categoria,
      kilos: Number(j.pesoBruto) || 0,
      origenTipo: 'Jaba',
      cantidadJabas: j.cantidadJabas,
      codigoColor: j.codigoColor,
      jabaId: j.jabaId,
    }));

    const todos = [...balanzaItems, ...jabasItems];

    return todos.filter((item) => {
      // Filtro de ubicación
      if (filtroUbicacion !== 'TODOS') {
        if (item.puestoNorm !== filtroUbicacion) return false;
      }

      // Filtro de variedad
      if (filtroPalta !== 'TODOS') {
        if (item.tipoPalta !== filtroPalta) return false;
      }

      // Búsqueda por texto
      if (busqueda.trim()) {
        const term = busqueda.toLowerCase().trim();
        const variedadMatch = (item.tipoPalta || '').toLowerCase().includes(term);
        const categoriaMatch = (item.categoria || '').toLowerCase().includes(term);
        const puestoMatch = (item.puestoNorm || '').toLowerCase().includes(term);
        if (!variedadMatch && !categoriaMatch && !puestoMatch) return false;
      }

      return true;
    });
  }, [inventario, jabasPendientesTransformar, filtroUbicacion, filtroPalta, busqueda, normalizarNombreUbicacion]);

  // Redirigir a Venta POS con el puesto preseleccionado
  const handleIrAVenta = (ubicacionNorm) => {
    const ubicacionEncontrada = ubicaciones.find(
      (u) => normalizarNombreUbicacion(u.nombre || u.tipo) === ubicacionNorm
    );
    navigate('/ventas', {
      state: { ubicacionId: ubicacionEncontrada?.ubicacionId || '' },
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Corporativo y Resumen */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#2C221E] text-white flex items-center justify-center shadow-md shrink-0">
              <Warehouse className="w-6 h-6 text-[#E65100]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
                  Inventario por Puesto
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-[#E65100] border border-orange-200">
                  En Kilos
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
                Supervisión del stock disponible en balanza para los 3 puestos de Lima de {empresaActiva?.nombre || 'JOSBECORSA'}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={cargarInventario}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-[#2C221E] text-xs font-bold transition-all shadow-xs min-h-[44px] min-w-[44px] disabled:opacity-50 cursor-pointer"
              title="Actualizar inventario"
            >
              <RefreshCw className={`w-4 h-4 text-stone-600 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refrescar Stock</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/ventas')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E65100] hover:bg-[#cf4700] text-white text-xs font-bold transition-all shadow-sm min-h-[44px] min-w-[44px] cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Ir a Balanza POS</span>
            </button>
          </div>
        </div>

        {/* Banner de Calidad y Regla de Negocio */}
        <div className="mt-4 p-3 rounded-xl bg-[#E8D8C8]/30 border border-[#E8D8C8] flex items-center gap-2.5 text-xs text-[#2C221E]">
          <CheckCircle2 className="w-4 h-4 text-[#E65100] shrink-0" />
          <span>
            <strong>Regla JOSBECORSA:</strong> El 100% del peso en jabas recibido se traslada íntegramente a kilogramos en inventario disponible sin merma.
          </span>
        </div>
      </div>

      {/* Manejo de Alertas */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* 1.1 BANNER DE DETECCIÓN Y CONVERSIÓN DE JABAS EN LIMA */}
      {metricas.totalKilosJabas > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <Box className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-950">
                📦 {formatearKilos(metricas.totalKilosJabas)} de fruta distribuidas en Lima listas para balanza
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Se detectaron {metricas.totalJabasPendientes} grupos de jabas en los puestos de Lima pendientes de ingresar al inventario de balanza para venta inmediata.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConvertirTodasABalanza}
            disabled={transformando}
            className="px-4 py-2.5 rounded-xl bg-[#E65100] hover:bg-[#cf4700] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px] disabled:opacity-50"
          >
            <Scale className="w-4 h-4" />
            <span>{transformando ? 'Ingresando...' : 'Pasar Todas a Balanza (Kilos) Ahora'}</span>
          </button>
        </div>
      )}

      {/* 2. Tarjetas KPI de Stock Total y por Puesto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Stock Total Empresa */}
        <div className="bg-[#2C221E] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-stone-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
              Stock Total Lima
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#E65100]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatearKilos(metricas.totalKilosEmpresa)}
            </span>
            <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
              <span>{metricas.variedadesCount} variedades activas</span>
              {metricas.totalKilosJabas > 0 && (
                <span className="text-amber-400 font-semibold">({formatearKilos(metricas.totalKilosBalanza)} balanza + {formatearKilos(metricas.totalKilosJabas)} en jabas)</span>
              )}
            </p>
          </div>
        </div>

        {/* KPI: Cámara Frío */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-sky-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
              Cámara Frío
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-[#0288D1]">
              <Snowflake className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-sky-950 tracking-tight">
              {formatearKilos(metricas.kilosPorPuesto['Camara Frio'].total)}
            </span>
            <div className="mt-2 w-full bg-sky-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-sky-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${metricas.totalKilosEmpresa > 0 ? Math.min(100, (metricas.kilosPorPuesto['Camara Frio'].total / metricas.totalKilosEmpresa) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* KPI: Puesto Principal */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Puesto Principal
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-950 tracking-tight">
              {formatearKilos(metricas.kilosPorPuesto['Puesto Principal'].total)}
            </span>
            <div className="mt-2 w-full bg-emerald-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${metricas.totalKilosEmpresa > 0 ? Math.min(100, (metricas.kilosPorPuesto['Puesto Principal'].total / metricas.totalKilosEmpresa) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* KPI: Puesto Contingencia (Icono oficial Building2 unificado) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              Puesto Contingencia
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-950 tracking-tight">
              {formatearKilos(metricas.kilosPorPuesto['Puesto Contingencia'].total)}
            </span>
            <div className="mt-2 w-full bg-amber-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${metricas.totalKilosEmpresa > 0 ? Math.min(100, (metricas.kilosPorPuesto['Puesto Contingencia'].total / metricas.totalKilosEmpresa) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visión Estructurada de los 3 Puestos de Lima (Cards Operativas) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-[#2C221E] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#E65100]" />
            <span>Monitoreo por Puesto Operativo</span>
          </h2>
          <span className="text-xs text-stone-500 font-medium">3 ubicaciones autorizadas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {UBICACIONES.map((ubicacionKey) => {
            const conf = configUbicaciones[ubicacionKey] || {
              nombre: ubicacionKey,
              icono: Building2,
              colorBg: 'bg-stone-50 text-stone-800 border-stone-200',
              badgeColor: 'bg-stone-100 text-stone-800 border-stone-300',
              accentColor: '#2C221E',
              descripcion: 'Ubicación física autorizada.',
            };
            const Icon = conf.icono;
            const puestoInfo = metricas.kilosPorPuesto[ubicacionKey] || { balanza: 0, jabas: 0, total: 0, jabasCount: 0 };
            const tieneFruta = puestoInfo.total > 0;

            // Variedades presentes en este puesto
            const itemsEnPuesto = itemsFiltrados.filter((it) => it.puestoNorm === ubicacionKey);
            const variedadesMap = {};
            itemsEnPuesto.forEach((it) => {
              if (it.kilos > 0) {
                variedadesMap[it.tipoPalta] = (variedadesMap[it.tipoPalta] || 0) + it.kilos;
              }
            });

            return (
              <div
                key={ubicacionKey}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between hover:border-stone-300 transition-all space-y-4"
              >
                <div>
                  {/* Encabezado de la Card */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${conf.colorBg} border shadow-xs shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[#2C221E]">{conf.nombre}</h3>
                        <p className="text-xs text-stone-500 line-clamp-1">{conf.descripcion}</p>
                      </div>
                    </div>
                  </div>

                  {/* Kilos Totales en el Puesto */}
                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-baseline justify-between">
                    <span className="text-xs text-stone-500 font-semibold uppercase">Stock Total:</span>
                    <span className="text-xl font-extrabold text-[#2C221E]">
                      {formatearKilos(puestoInfo.total)}
                    </span>
                  </div>

                  {/* Desglose Balanza vs Jabas */}
                  <div className="mt-2 text-[11px] font-semibold text-stone-600 flex justify-between bg-[#FAFAFC] p-2 rounded-lg border border-stone-100">
                    <span className="text-emerald-700">Balanza: {formatearKilos(puestoInfo.balanza)}</span>
                    <span className="text-amber-800">En Jabas: {formatearKilos(puestoInfo.jabas)}</span>
                  </div>

                  {/* Detalle de Variedades en este Puesto */}
                  <div className="mt-3 space-y-1.5">
                    {tieneFruta ? (
                      Object.entries(variedadesMap).map(([variedad, kilos]) => (
                        <div
                          key={variedad}
                          className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-stone-50 border border-stone-200/60"
                        >
                          <span className="font-semibold text-stone-700">Palta {variedad}</span>
                          <span className="font-bold text-[#2C221E]">{formatearKilos(kilos)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-stone-50 border border-dashed border-stone-200 text-center">
                        <p className="text-xs text-stone-400">Sin stock en este puesto</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones del Puesto */}
                <div className="space-y-2 pt-3 border-t border-stone-100">
                  {puestoInfo.jabas > 0 && (
                    <button
                      type="button"
                      onClick={() => handleConvertirPuestoABalanza(ubicacionKey)}
                      disabled={transformando}
                      className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-orange-50 text-[#E65100] border border-[#E65100]/40 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
                    >
                      <Scale className="w-4 h-4" />
                      <span>Pasar {formatearKilos(puestoInfo.jabas)} de jabas a Balanza</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleIrAVenta(ubicacionKey)}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#2C221E] hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <span>Vender desde este puesto</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Tabla Detallada de Inventario Unificado */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-[#2C221E]">
              Inventario Detallado de Palta
            </h2>
            <p className="text-xs text-stone-500">
              Registros consolidados de inventario en balanza y fruta distribuida en Lima.
            </p>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
              className="h-10 px-3 text-xs font-bold bg-[#FAFAFC] border border-stone-300 rounded-xl focus:border-[#E65100] outline-hidden cursor-pointer"
            >
              <option value="TODOS">Todas las Ubicaciones</option>
              {UBICACIONES.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            <select
              value={filtroPalta}
              onChange={(e) => setFiltroPalta(e.target.value)}
              className="h-10 px-3 text-xs font-bold bg-[#FAFAFC] border border-stone-300 rounded-xl focus:border-[#E65100] outline-hidden cursor-pointer"
            >
              <option value="TODOS">Todas las Variedades</option>
              {TIPOS_PALTA.map((tp) => (
                <option key={tp} value={tp}>Palta {tp}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla Responsive */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAFC] border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Puesto / Ubicación</th>
                <th className="py-3 px-4">Variedad</th>
                <th className="py-3 px-4">Calidad</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Kilos Disponibles</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">
                    No se encontraron registros de palta para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((item, idx) => (
                  <tr key={item.inventarioId || idx} className="hover:bg-orange-50/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#2C221E] flex items-center gap-2">
                      {item.puestoNorm === 'Camara Frio' && <Snowflake className="w-4 h-4 text-[#0288D1]" />}
                      {item.puestoNorm === 'Puesto Principal' && <Store className="w-4 h-4 text-emerald-600" />}
                      {item.puestoNorm === 'Puesto Contingencia' && <Building2 className="w-4 h-4 text-amber-700" />}
                      <span>{item.puestoNorm}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-800">
                      Palta {item.tipoPalta}
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-semibold">
                      {item.categoria}
                    </td>
                    <td className="py-3 px-4">
                      {item.origenTipo === 'Balanza' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Balanza (Listo)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          En Jabas ({item.cantidadJabas} und)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-sm text-[#E65100]">
                      {formatearKilos(item.kilos)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.origenTipo === 'Balanza' ? (
                        <button
                          type="button"
                          onClick={() => handleIrAVenta(item.puestoNorm)}
                          className="px-3 py-1.5 rounded-lg bg-[#2C221E] hover:bg-black text-white text-[11px] font-bold cursor-pointer"
                        >
                          Vender
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleConvertirPuestoABalanza(item.puestoNorm)}
                          className="px-3 py-1.5 rounded-lg bg-[#E65100] hover:bg-[#cf4700] text-white text-[11px] font-bold cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Scale className="w-3 h-3" />
                          <span>Pasar a Balanza</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
