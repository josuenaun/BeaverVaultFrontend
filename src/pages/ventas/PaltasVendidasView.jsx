// src/pages/ventas/PaltasVendidasView.jsx - Auditoría y Registro Visual de Paltas Vendidas
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ventaService } from '../../services/ventaService';
import { distribucionService } from '../../services/distribucionService';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { Pagination } from '../../components/common/Pagination';
import { RefreshButton } from '../../components/common/RefreshButton';
import { formatearMoneda, formatearKilos, formatearFecha } from '../../utils/formatters';
import { TIPOS_PALTA } from '../../utils/constants';
import {
  ShoppingBag,
  Scale,
  Search,
  TrendingUp,
  Receipt,
  User,
  Boxes,
} from 'lucide-react';

export function PaltasVendidasView() {
  const { user, empresaId } = useAuth();
  const navigate = useNavigate();

  const [ventas, setVentas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filtroUbicacion, setFiltroUbicacion] = useState('TODOS');
  const [filtroPalta, setFiltroPalta] = useState('TODOS');
  const [filtroFecha, setFiltroFecha] = useState('TODOS'); // 'TODOS' | 'HOY' | '7DIAS' (Historial completo por defecto)
  const [busqueda, setBusqueda] = useState('');

  // Paginación (10 registros por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const TAMANO_PAGINA = 10;

  const cargarDatos = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      setError('');
      const [listaVentas, listaUbicaciones] = await Promise.all([
        ventaService.listarVentas(empresaId),
        distribucionService.listarUbicaciones(empresaId),
      ]);
      setVentas(Array.isArray(listaVentas) ? listaVentas : []);
      setUbicaciones(Array.isArray(listaUbicaciones) ? listaUbicaciones : []);
    } catch (err) {
      setError('Error al cargar el historial de ventas: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Mapa de nombres de ubicación
  const mapaUbicaciones = useMemo(() => {
    const mapa = {};
    ubicaciones.forEach((u) => {
      mapa[u.ubicacionId] = u.tipo || u.nombre;
    });
    return mapa;
  }, [ubicaciones]);

  // Aplanar y normalizar detalles de venta (soporta tanto 'detalles' como '_detalles' de backend)
  const ventasAplanadas = useMemo(() => {
    const items = [];
    ventas.forEach((v) => {
      const fecha = v.fechaVenta || v.createdAt || v.fecha || new Date().toISOString();
      const ubicacionId =
        v.ubicacionId ||
        v._ubicacionId ||
        v.ubicacion_id ||
        v.ubicacion?.ubicacionId ||
        '';

      const ubicacionNombre =
        v.ubicacionNombre ||
        v.ubicacion?.nombre ||
        v.ubicacion?.tipo ||
        mapaUbicaciones[ubicacionId] ||
        'Puesto Principal';

      const metodoPago =
        v.metodoPago ||
        v._metodoPago ||
        v.metodo_pago ||
        'Efectivo';

      const vendedorNombre =
        v.vendedorNombre ||
        v.nombreVendedor ||
        v.vendedor?.nombre ||
        v.vendedorUsuario?.nombre ||
        v.usuario?.nombre ||
        user?.nombre ||
        'Yolanda Salvatierra';

      const arrayDetalles = v.detalles || v._detalles || [];

      if (Array.isArray(arrayDetalles) && arrayDetalles.length > 0) {
        arrayDetalles.forEach((d, idx) => {
          const kilos = Number(d.kilosVendidos ?? d.kilos ?? 0);
          const precio = Number(d.precioUnitario ?? d.precio ?? 0);
          const subtotalCalc = Number(
            d.subtotal ?? (kilos > 0 && precio > 0 ? kilos * precio : 0)
          );

          items.push({
            id: `${v.ventaId || v.id}-${idx}`,
            ventaId: v.ventaId || v.id,
            fecha,
            ubicacionId,
            ubicacionNombre,
            vendedorNombre,
            tipoPalta: d.tipoPalta || 'Fuerte',
            categoria: d.categoria || '1era',
            kilosVendidos: kilos,
            precioUnitario: precio,
            subtotal: subtotalCalc,
            metodoPago: d.metodoPago || metodoPago,
          });
        });
      } else {
        const kilos = Number(v.kilosVendidos ?? v.totalKilos ?? 0);
        const precio = Number(v.precioUnitario ?? 0);
        const subtotalCalc = Number(
          v.montoTotal ??
            v._montoTotal ??
            v.total ??
            (kilos > 0 && precio > 0 ? kilos * precio : 0)
        );

        items.push({
          id: v.ventaId || v.id || Math.random().toString(),
          ventaId: v.ventaId || v.id,
          fecha,
          ubicacionId,
          ubicacionNombre,
          vendedorNombre,
          tipoPalta: v.tipoPalta || 'Fuerte',
          categoria: v.categoria || '1era',
          kilosVendidos: kilos,
          precioUnitario: precio,
          subtotal: subtotalCalc,
          metodoPago,
        });
      }
    });
    return items;
  }, [ventas, mapaUbicaciones, user]);

  // Filtrado reactivo
  const ventasFiltradas = useMemo(() => {
    const ahora = new Date();
    const hoyStr = ahora.toISOString().split('T')[0];
    const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);

    return ventasAplanadas.filter((item) => {
      // Filtro de ubicación
      if (filtroUbicacion !== 'TODOS') {
        const matchUbicacion =
          item.ubicacionId === filtroUbicacion ||
          (mapaUbicaciones[filtroUbicacion] && item.ubicacionNombre === mapaUbicaciones[filtroUbicacion]);
        if (!matchUbicacion) return false;
      }

      // Filtro de variedad de palta
      if (filtroPalta !== 'TODOS' && item.tipoPalta !== filtroPalta) {
        return false;
      }

      // Filtro de fecha
      if (filtroFecha === 'HOY') {
        const itemFechaStr = new Date(item.fecha).toISOString().split('T')[0];
        if (itemFechaStr !== hoyStr) return false;
      } else if (filtroFecha === '7DIAS') {
        const itemFecha = new Date(item.fecha);
        if (itemFecha < hace7Dias) return false;
      }

      // Búsqueda por texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const texto = `${item.tipoPalta} ${item.categoria} ${item.ubicacionNombre} ${item.vendedorNombre} ${item.metodoPago}`.toLowerCase();
        if (!texto.includes(q)) return false;
      }

      return true;
    });
  }, [ventasAplanadas, filtroUbicacion, filtroPalta, filtroFecha, busqueda, mapaUbicaciones]);

  // Resetear a página 1 cuando cambian filtros
  useEffect(() => {
    setPaginaActual(1);
  }, [filtroUbicacion, filtroPalta, filtroFecha, busqueda]);

  // Registros paginados de 10 en 10
  const itemsPaginados = useMemo(() => {
    const start = (paginaActual - 1) * TAMANO_PAGINA;
    return ventasFiltradas.slice(start, start + TAMANO_PAGINA);
  }, [ventasFiltradas, paginaActual]);

  // Cálculos consolidados para los indicadores clave (KPIs)
  const totales = useMemo(() => {
    let kilos = 0;
    let dineroCobrado = 0;
    let dineroFiado = 0;
    const desgloseVariedad = {};

    ventasFiltradas.forEach((v) => {
      kilos += v.kilosVendidos;
      const esFiado = (v.metodoPago || '').toLowerCase() === 'fiado';
      if (esFiado) {
        dineroFiado += v.subtotal;
      } else {
        dineroCobrado += v.subtotal;
      }
      desgloseVariedad[v.tipoPalta] = (desgloseVariedad[v.tipoPalta] || 0) + v.kilosVendidos;
    });

    return {
      kilos,
      dineroCobrado,
      dineroFiado,
      dinero: dineroCobrado,
      totalTransacciones: ventasFiltradas.length,
      desgloseVariedad,
    };
  }, [ventasFiltradas]);

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              Ventas
            </span>
            <span className="text-xs text-stone-500 font-semibold">Registro Histórico</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#E65100]" />
            <span>Paltas Vendidas</span>
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro histórico de todos los kilogramos despachados en balanza.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => navigate('/ventas')}
            className="bg-[#E65100] hover:bg-[#cf4700] text-white font-extrabold text-xs h-11 px-4 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>Nueva Venta</span>
          </Button>

          <RefreshButton
            onRefresh={cargarDatos}
            loading={loading}
            title="Actualizar registro"
          />
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Tarjetas de Métricas de Ventas (Limpias y Homogéneas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Dinero */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Total Cobrado en Caja
            </span>
            <p className="text-2xl font-extrabold text-emerald-800 mt-1 tracking-tight">
              {formatearMoneda(totales.dineroCobrado)}
            </p>
            <span className="text-[11px] text-stone-500">
              {totales.dineroFiado > 0 ? (
                <span className="text-amber-700 font-bold">
                  +{formatearMoneda(totales.dineroFiado)} en espera (Fiados)
                </span>
              ) : (
                `${totales.totalTransacciones} ventas filtradas`
              )}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Total Kilos Despachados */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Kilos Despachados
            </span>
            <p className="text-2xl font-extrabold text-[#2C221E] mt-1 tracking-tight">
              {formatearKilos(totales.kilos)}
            </p>
            <span className="text-[11px] text-emerald-700 font-semibold">Salida de balanza</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Variedad Fuerte */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Palta Fuerte
            </span>
            <p className="text-2xl font-extrabold text-stone-800 mt-1 tracking-tight">
              {formatearKilos(totales.desgloseVariedad['Fuerte'] || 0)}
            </p>
            <span className="text-[11px] text-stone-500">Total despachado</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Variedad Hass */}
        <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Palta Hass
            </span>
            <p className="text-2xl font-extrabold text-stone-800 mt-1 tracking-tight">
              {formatearKilos(totales.desgloseVariedad['Hass'] || 0)}
            </p>
            <span className="text-[11px] text-stone-500">Total despachado</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros Interactivos */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Selector de Fecha */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl shrink-0">
            {[
              { id: 'TODOS', label: 'Todo el Historial' },
              { id: 'HOY', label: 'Ventas de Hoy' },
              { id: '7DIAS', label: 'Últimos 7 días' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFiltroFecha(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroFecha === f.id
                    ? 'bg-white text-[#2C221E] shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por variedad, calidad, vendedor..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full h-10 pl-9 pr-3 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:border-[#E65100] focus:bg-white outline-hidden font-medium"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100 text-xs">
          {/* Filtro por Puesto */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-600">Puesto:</span>
            <select
              value={filtroUbicacion}
              onChange={(e) => setFiltroUbicacion(e.target.value)}
              className="h-8 px-2.5 font-bold bg-white border border-stone-200 rounded-lg text-stone-700 outline-hidden focus:border-[#E65100] cursor-pointer"
            >
              <option value="TODOS">Todos los puestos</option>
              {ubicaciones.map((u) => (
                <option key={u.ubicacionId} value={u.ubicacionId}>
                  {u.tipo || u.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Variedad de Palta */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-600">Variedad:</span>
            <select
              value={filtroPalta}
              onChange={(e) => setFiltroPalta(e.target.value)}
              className="h-8 px-2.5 font-bold bg-white border border-stone-200 rounded-lg text-stone-700 outline-hidden focus:border-[#E65100] cursor-pointer"
            >
              <option value="TODOS">Todas las variedades</option>
              {TIPOS_PALTA.map((tp) => (
                <option key={tp} value={tp}>
                  Palta {tp}
                </option>
              ))}
            </select>
          </div>

          {(filtroUbicacion !== 'TODOS' || filtroPalta !== 'TODOS' || busqueda || filtroFecha !== 'TODOS') && (
            <button
              type="button"
              onClick={() => {
                setFiltroUbicacion('TODOS');
                setFiltroPalta('TODOS');
                setFiltroFecha('TODOS');
                setBusqueda('');
              }}
              className="text-[#E65100] hover:underline font-bold text-xs ml-auto cursor-pointer"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de Paltas Vendidas */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Spinner />
            <p className="text-xs text-stone-500 font-bold mt-2">Cargando registro de ventas...</p>
          </div>
        ) : ventasFiltradas.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-12 h-12 text-stone-300 mx-auto" />
            <p className="text-sm font-bold text-stone-700">No se encontraron ventas registradas</p>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              No hay movimientos de venta que coincidan con los filtros seleccionados.
            </p>
            <Button
              onClick={() => navigate('/ventas')}
              className="bg-[#E65100] hover:bg-[#cf4700] text-white font-bold text-xs h-9 px-3 rounded-lg mx-auto"
            >
              Realizar una venta en Balanza
            </Button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Puesto</th>
                    <th className="py-3 px-4">Variedad y Calidad</th>
                    <th className="py-3 px-4 text-right">Kilos Vendidos</th>
                    <th className="py-3 px-4 text-right">Precio / kg</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-center">Pago</th>
                    <th className="py-3 px-4">Vendedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {itemsPaginados.map((item) => {
                    const fechaObj = new Date(item.fecha);
                    const horaStr = !isNaN(fechaObj)
                      ? fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-[#2C221E] block">
                            {formatearFecha(item.fecha)}
                          </span>
                          <span className="text-[10px] text-stone-400 font-semibold">{horaStr}</span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-stone-100 text-stone-700 border border-stone-200">
                            {item.ubicacionNombre}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-bold text-[#6D4C41] block">
                            Palta {item.tipoPalta}
                          </span>
                          <span className="text-[11px] text-stone-500">
                            Calidad: <strong className="text-stone-800">{item.categoria}</strong>
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="font-mono font-black text-sm text-[#2C221E]">
                            {formatearKilos(item.kilosVendidos)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap text-stone-600 font-mono">
                          {formatearMoneda(item.precioUnitario)}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span className="font-mono font-black text-sm text-[#E65100]">
                            {formatearMoneda(item.subtotal)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                              item.metodoPago === 'Fiado'
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : item.metodoPago === 'Yape'
                                ? 'bg-purple-100 text-purple-900 border-purple-300'
                                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {item.metodoPago === 'Fiado' ? 'Fiado (Por cobrar)' : item.metodoPago}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-stone-600 flex items-center gap-1.5 pt-4">
                          <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span className="truncate max-w-[140px] font-semibold text-[#2C221E]">
                            {item.vendedorNombre}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Paginación de 10 en 10 */}
            <Pagination
              currentPage={paginaActual}
              totalItems={ventasFiltradas.length}
              pageSize={TAMANO_PAGINA}
              onPageChange={setPaginaActual}
            />
          </div>
        )}
      </div>
    </div>
  );
}
