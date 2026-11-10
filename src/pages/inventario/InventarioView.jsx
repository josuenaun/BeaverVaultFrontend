// src/pages/inventario/InventarioView.jsx - Módulo de Inventario por Puesto en Lima
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { inventarioService } from '../../services/inventarioService';
import { acopioService } from '../../services/acopioService';
import { ventaService } from '../../services/ventaService';
import { formatearKilos } from '../../utils/formatters';
import { UBICACIONES, TIPOS_PALTA } from '../../utils/constants';
import { Alert } from '../../components/common/Alert';
import { Pagination } from '../../components/common/Pagination';
import { RefreshButton } from '../../components/common/RefreshButton';
import {
  Scale,
  Snowflake,
  Store,
  Building2,
  ArrowRight,
  Boxes,
  Search,
} from 'lucide-react';

export function InventarioView() {
  const { empresaId, empresaActiva } = useAuth();
  const navigate = useNavigate();

  const [ubicaciones, setUbicaciones] = useState([]);
  const [acopios, setAcopios] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  // Cargar datos sincronizados: ubicaciones, acopios con jabas distribuidas y ventas
  const cargarInventario = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    setError('');
    try {
      const [dataUbicaciones, dataAcopios, dataVentas] = await Promise.all([
        inventarioService.listarUbicaciones(empresaId),
        acopioService.listarAcopios(empresaId),
        ventaService.listarVentas(empresaId),
      ]);
      setUbicaciones(Array.isArray(dataUbicaciones) ? dataUbicaciones : []);
      setAcopios(Array.isArray(dataAcopios) ? dataAcopios : []);
      setVentas(Array.isArray(dataVentas) ? dataVentas : []);
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

  // Configuración visual para las 3 ubicaciones de Lima
  const configUbicaciones = useMemo(() => ({
    'Camara Frio': {
      nombre: 'Cámara Frío',
      icono: Snowflake,
      colorBg: 'bg-sky-50 text-sky-700 border-sky-200',
      badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
      accentColor: '#0288D1',
      descripcion: 'Conservación en frío y stock disponible para venta.',
    },
    'Puesto Principal': {
      nombre: 'Puesto Principal',
      icono: Store,
      colorBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      accentColor: '#10B981',
      descripcion: 'Punto central de venta directa mayorista.',
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

  // Extraer todas las jabas ubicadas en Lima desde los acopios activos (Distribución Lima)
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

  // Mapa de kilos vendidos por (ubicacion_id/puestoNorm + tipoPalta + categoria)
  const mapaVentasPorPuesto = useMemo(() => {
    const mapa = new Map();
    ventas.forEach((v) => {
      const ubicacionObj = ubicaciones.find((u) => u.ubicacionId === (v.ubicacionId || v._ubicacionId));
      const puestoNorm = normalizarNombreUbicacion(ubicacionObj?.tipo || ubicacionObj?.nombre || v.ubicacionNombre);
      const detalles = v.detalles || v._detalles || [];

      detalles.forEach((d) => {
        const tp = d.tipoPalta || 'Fuerte';
        const cat = d.categoria || '1era';
        const key = `${puestoNorm}_${tp}_${cat}`;
        const kv = Number(d.kilosVendidos || d.kilos || 0);
        mapa.set(key, (mapa.get(key) || 0) + kv);
      });
    });
    return mapa;
  }, [ventas, ubicaciones, normalizarNombreUbicacion]);

  // Paginación (10 items por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const TAMANO_PAGINA = 10;

  // Lista unificada de items de inventario:
  // JALA ESTRICTAMENTE DE DISTRIBUCIÓN EN LIMA (Jabas asignadas en acopios activos menos ventas del puesto)
  const itemsInventarioConsolidados = useMemo(() => {
    if (!acopios || acopios.length === 0 || jabasEnLima.length === 0) {
      return [];
    }

    // Agrupar jabas de Lima por puesto + tipoPalta + categoria
    const agrupado = new Map();

    jabasEnLima.forEach((jaba) => {
      const puesto = jaba.ubicacionNombre;
      const key = `${puesto}_${jaba.tipoPalta}_${jaba.categoria}`;
      const kilosJaba = Number(jaba.pesoBruto) || 0;
      const cantJabas = Number(jaba.cantidadJabas) || 1;

      if (!agrupado.has(key)) {
        agrupado.set(key, {
          inventarioId: `inv-${key}`,
          ubicacionId: jaba.ubicacionId,
          ubicacionNombre: puesto,
          puestoNorm: puesto,
          tipoPalta: jaba.tipoPalta,
          categoria: jaba.categoria,
          pesoBrutoTotal: kilosJaba,
          cantidadJabas: cantJabas,
        });
      } else {
        const item = agrupado.get(key);
        item.cantidadJabas += cantJabas;
        item.pesoBrutoTotal += kilosJaba;
      }
    });

    // Descontar las ventas reales de ese puesto y variedad
    const listaResultante = [];
    agrupado.forEach((item, key) => {
      const ventasPuesto = mapaVentasPorPuesto.get(key) || 0;
      const kilosDisponibles = Math.max(0, item.pesoBrutoTotal - ventasPuesto);

      // Solo incluir si hay stock disponible o si hay jabas físicas asignadas
      listaResultante.push({
        ...item,
        kilos: Number(kilosDisponibles.toFixed(2)),
      });
    });

    return listaResultante;
  }, [acopios, jabasEnLima, mapaVentasPorPuesto]);

  // Métricas y totales calculados estrictamente desde Distribución Lima
  const metricas = useMemo(() => {
    const kilosPorPuesto = {
      'Camara Frio': { total: 0, jabasCount: 0 },
      'Puesto Principal': { total: 0, jabasCount: 0 },
      'Puesto Contingencia': { total: 0, jabasCount: 0 },
    };

    if (!acopios || acopios.length === 0 || itemsInventarioConsolidados.length === 0) {
      return {
        totalKilosEmpresa: 0,
        kilosPorPuesto,
        variedadesCount: 0,
      };
    }

    const variedadesPresentes = new Set();
    let totalKilosEmpresa = 0;

    itemsInventarioConsolidados.forEach((item) => {
      const kilos = Number(item.kilos) || 0;
      const cant = Number(item.cantidadJabas) || 0;
      const norm = item.puestoNorm;

      if (kilosPorPuesto[norm]) {
        kilosPorPuesto[norm].total += kilos;
        kilosPorPuesto[norm].jabasCount += cant;
      }

      totalKilosEmpresa += kilos;
      if (kilos > 0 && item.tipoPalta) {
        variedadesPresentes.add(item.tipoPalta);
      }
    });

    return {
      totalKilosEmpresa: Number(totalKilosEmpresa.toFixed(2)),
      kilosPorPuesto,
      variedadesCount: variedadesPresentes.size,
    };
  }, [acopios, itemsInventarioConsolidados]);

  // Filtrado de items
  const itemsFiltrados = useMemo(() => {
    return itemsInventarioConsolidados.filter((item) => {
      if (filtroUbicacion !== 'TODOS' && item.puestoNorm !== filtroUbicacion) {
        return false;
      }
      if (filtroPalta !== 'TODOS' && item.tipoPalta !== filtroPalta) {
        return false;
      }
      if (busqueda.trim()) {
        const term = busqueda.toLowerCase().trim();
        const variedadMatch = (item.tipoPalta || '').toLowerCase().includes(term);
        const categoriaMatch = (item.categoria || '').toLowerCase().includes(term);
        const puestoMatch = (item.puestoNorm || '').toLowerCase().includes(term);
        if (!variedadMatch && !categoriaMatch && !puestoMatch) return false;
      }
      return true;
    });
  }, [itemsInventarioConsolidados, filtroUbicacion, filtroPalta, busqueda]);

  // Resetear página al filtrar
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroUbicacion, filtroPalta, busqueda]);

  // Paginación
  const itemsPaginados = useMemo(() => {
    const start = (paginaActual - 1) * TAMANO_PAGINA;
    return itemsFiltrados.slice(start, start + TAMANO_PAGINA);
  }, [itemsFiltrados, paginaActual]);

  // Redirigir a POS con el puesto preseleccionado
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
      {/* 1. Header Limpio y Acciones */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                {empresaActiva?.nombre || 'JOSBECORSA'}
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs text-stone-400 font-medium">Lima</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#2C221E] tracking-tight">
              Inventario por Puesto
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-0.5">
              Kilos disponibles listos para venta en puestos de mercado y cámara de frío.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
            <RefreshButton
              onRefresh={cargarInventario}
              loading={loading}
              label="Actualizar"
              title="Actualizar inventario"
            />
            <button
              type="button"
              onClick={() => navigate('/ventas')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E65100] hover:bg-[#cf4700] text-white text-xs font-bold transition-all shadow-xs min-h-[44px] cursor-pointer"
            >
              <Scale className="w-4 h-4" />
              <span>Vender en Balanza</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manejo de Alertas */}
      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* 2. Tarjetas KPI de Stock Total y por Puesto (Limpio y Homogéneo) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI: Stock Total Empresa */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Stock Total en Lima
            </span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#2C221E] tracking-tight">
              {formatearKilos(metricas.totalKilosEmpresa)}
            </span>
            <p className="text-xs text-stone-500 mt-1">
              {metricas.variedadesCount} variedades en almacén
            </p>
          </div>
        </div>

        {/* KPI: Puesto Principal */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Puesto Principal
            </span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#2C221E] tracking-tight">
              {formatearKilos(metricas.kilosPorPuesto['Puesto Principal'].total)}
            </span>
            <div className="mt-2 w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-stone-700 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${metricas.totalKilosEmpresa > 0 ? Math.min(100, (metricas.kilosPorPuesto['Puesto Principal'].total / metricas.totalKilosEmpresa) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* KPI: Cámara Frío */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Cámara de Frío
            </span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
              <Snowflake className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#2C221E] tracking-tight">
              {formatearKilos(metricas.kilosPorPuesto['Camara Frio'].total)}
            </span>
            <div className="mt-2 w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-stone-700 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${metricas.totalKilosEmpresa > 0 ? Math.min(100, (metricas.kilosPorPuesto['Camara Frio'].total / metricas.totalKilosEmpresa) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* KPI: Puesto Contingencia */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Puesto Contingencia
            </span>
            <div className="w-7 h-7 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#2C221E] tracking-tight">
              {formatearKilos(metricas.kilosPorPuesto['Puesto Contingencia'].total)}
            </span>
            <div className="mt-2 w-full bg-stone-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-stone-700 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${metricas.totalKilosEmpresa > 0 ? Math.min(100, (metricas.kilosPorPuesto['Puesto Contingencia'].total / metricas.totalKilosEmpresa) * 100) : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visión Estructurada de los 3 Puestos de Lima */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-extrabold text-[#2C221E] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#E65100]" />
            <span>Monitoreo por Puesto Operativo</span>
          </h2>
          <span className="text-xs text-stone-500 font-medium">3 ubicaciones oficiales</span>
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
            const puestoInfo = metricas.kilosPorPuesto[ubicacionKey] || { total: 0, jabasCount: 0 };
            const tieneFruta = puestoInfo.total > 0;

            // Variedades presentes en este puesto
            const itemsEnPuesto = itemsInventarioConsolidados.filter((it) => it.puestoNorm === ubicacionKey);
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
                    <span className="text-xs text-stone-500 font-semibold uppercase">Stock Disponible:</span>
                    <span className="text-xl font-extrabold text-[#2C221E]">
                      {formatearKilos(puestoInfo.total)}
                    </span>
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
                        <p className="text-xs text-stone-400">Sin stock disponible en este puesto</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones del Puesto: Permite vender desde cualquier puesto con fruta o seleccionarlo */}
                <div className="pt-3 border-t border-stone-100">
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

      {/* 4. Tabla Detallada de Inventario */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-[#2C221E]">
              Inventario Detallado de Palta
            </h2>
            <p className="text-xs text-stone-500">
              Kilos disponibles por variedad y calidad sincronizados con las jabas distribuidas en Lima.
            </p>
          </div>

          {/* Filtros */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por variedad o puesto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-10 pl-8 pr-3 text-xs bg-[#FAFAFC] border border-stone-300 rounded-xl focus:border-[#E65100] outline-hidden"
              />
            </div>

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

        {/* Tabla Responsive Paginada */}
        <div className="overflow-x-auto rounded-xl border border-stone-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FAFAFC] border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Puesto / Ubicación</th>
                <th className="py-3 px-4">Variedad</th>
                <th className="py-3 px-4">Calidad</th>
                <th className="py-3 px-4">Jabas Asociadas</th>
                <th className="py-3 px-4 text-right">Kilos Disponibles</th>
                <th className="py-3 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {itemsPaginados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-stone-400">
                    No se encontraron registros de palta para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                itemsPaginados.map((item, idx) => (
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-stone-100 text-stone-700 border border-stone-200">
                        {item.cantidadJabas} {item.cantidadJabas === 1 ? 'jaba' : 'jabas'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-sm text-[#E65100]">
                      {formatearKilos(item.kilos)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleIrAVenta(item.puestoNorm)}
                        className="px-3 py-1.5 rounded-lg bg-[#2C221E] hover:bg-black text-white text-[11px] font-bold cursor-pointer"
                      >
                        Vender
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <Pagination
            currentPage={paginaActual}
            totalItems={itemsFiltrados.length}
            pageSize={TAMANO_PAGINA}
            onPageChange={setPaginaActual}
          />
        </div>
      </div>
    </div>
  );
}
