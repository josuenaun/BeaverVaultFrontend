// src/pages/distribucion/DistribucionView.jsx - Tablero Kanban para Distribución de Jabas con Sincronización Automática y Flexibilidad Total
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { acopioService } from '../../services/acopioService';
import { distribucionService } from '../../services/distribucionService';
import { inventarioService } from '../../services/inventarioService';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { DividirJabaModal } from './DividirJabaModal';
import { RefreshButton } from '../../components/common/RefreshButton';
import { formatearKilos, formatearMoneda, formatearFecha, obtenerEstiloPastel } from '../../utils/formatters';
import { UBICACIONES, UBICACION_ICONS } from '../../utils/constants';
import {
  Building2,
  Truck,
  MapPin,
  Split,
  CheckCircle2,
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

const UBICACION_COLORS = {
  'Camara Frio': 'border-sky-200 bg-sky-50/70 text-[#0288D1]',
  'Puesto Principal': 'border-[#E8D8C8] bg-[#E8D8C8]/30 text-[#2C221E]',
  'Puesto Contingencia': 'border-stone-200 bg-[#6D4C41]/10 text-[#6D4C41]',
};

/**
 * Componente Tarjeta de Jaba 100% Simétrica y Flexible
 * Permite seleccionar y reubicar libremente a cualquier puesto en cualquier momento.
 */
function JabaCardSimetrica({
  jaba,
  idx,
  ubicacionesDB,
  onMover,
  onDividir,
  prefixId = 'lote',
  esLiquidada = false,
}) {
  const pastel = obtenerEstiloPastel(jaba.codigoColor);
  const ubicacionActual = ubicacionesDB.find((u) => u.ubicacionId === jaba.ubicacionId);
  const nombreUbicacionActual = ubicacionActual?.tipo || ubicacionActual?.nombre;
  const tieneVariasJabas = Number(jaba.cantidadJabas) > 1;
  const pesoNumerico = (jaba.pesoActual !== undefined && jaba.pesoActual !== null)
    ? Number(jaba.pesoActual)
    : Number(jaba.pesoBruto);
  const estaAgotada = esLiquidada || pesoNumerico <= 0 || jaba.estado === 'Convertida_Kilos';
  const pesoRestante = estaAgotada ? 0 : pesoNumerico;

  // Todas las ubicaciones disponibles para máxima flexibilidad de movimiento
  const destinosDisponibles = UBICACIONES;

  const idSelect = `select-mover-${prefixId}-${jaba.jabaId || idx}`;

  return (
    <div
      style={{
        backgroundColor: pastel.backgroundColor,
        borderColor: pastel.borderColor,
      }}
      className={`h-full flex flex-col justify-between rounded-2xl p-4 border shadow-xs hover:shadow-md transition-all space-y-3.5 select-none ${
        estaAgotada ? 'opacity-70 saturate-50' : ''
      }`}
    >
      {/* 1. Cabecera Rígida de 2 Filas */}
      <div className="space-y-1.5">
        {/* Fila 1: Variedad de Palta y Badge de Color */}
        <div className="flex items-center justify-between gap-2 h-6">
          <span
            className="text-xs font-black uppercase text-[#6D4C41] tracking-wide truncate"
            title={`Palta ${jaba.tipoPalta}`}
          >
            Palta {jaba.tipoPalta}
          </span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 bg-white shrink-0 shadow-2xs"
            style={{ borderColor: pastel.borderColor }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ backgroundColor: pastel.dotColor }}
            />
            <span className="font-mono text-stone-700">{jaba.codigoColor}</span>
          </span>
        </div>

        {/* Fila 2: Calidad y Ubicación Actual */}
        <div className="flex items-center justify-between gap-2 h-6">
          <span className="text-xs font-bold text-[#2C221E] truncate">
            Calidad: <span className="font-extrabold text-stone-900">{jaba.categoria}</span>
          </span>

          {nombreUbicacionActual ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/90 text-stone-700 border border-stone-300 shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#E65100]" />
              {nombreUbicacionActual.replace('Puesto ', 'P. ')}
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
              Por Asignar
            </span>
          )}
        </div>

        {/* Origen del lote */}
        {jaba.acopioOrigen && (
          <p className="text-[11px] text-stone-500 font-semibold flex items-center gap-1 truncate pt-0.5">
            <MapPin className="w-3.5 h-3.5 text-[#E65100] shrink-0" />
            <span className="truncate">{jaba.acopioOrigen}</span>
          </p>
        )}
      </div>

      {/* 2. Display de Cantidad y Peso */}
      <div className="flex items-center justify-between text-xs sm:text-sm bg-white/90 p-2.5 rounded-xl border border-black/5 shadow-2xs h-11 shrink-0">
        <span className="font-bold text-stone-700">
          {jaba.cantidadJabas} {Number(jaba.cantidadJabas) === 1 ? 'jaba' : 'jabas'}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`font-black text-sm tracking-tight ${estaAgotada ? 'text-stone-500' : 'text-[#E65100]'}`}>
            {formatearKilos(pesoRestante)}
          </span>
          {estaAgotada ? (
            <span className="text-[10px] text-stone-400 line-through" title="Total inicial vendido">
              {formatearKilos(jaba.pesoBruto)}
            </span>
          ) : Number(jaba.pesoBruto) > pesoRestante ? (
            <span className="text-[10px] text-stone-400 line-through" title="Peso inicial">
              {formatearKilos(jaba.pesoBruto)}
            </span>
          ) : null}
        </div>
      </div>

      {/* 3. Zona de Acciones Simétricas y Flexibles */}
      <div className="pt-2 border-t border-black/5 space-y-2 mt-auto">
        {estaAgotada ? (
          <div className="h-11 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 select-none text-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Stock Liquidado (0.00 kg)</span>
          </div>
        ) : (
          <>
            {/* Dropdown Mover A (Siempre permite elegir cualquiera de los 3 puestos) */}
            <div>
              <label htmlFor={idSelect} className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                Reubicar / Mover a:
              </label>
              <select
                id={idSelect}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onMover(jaba, e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full h-11 px-3 text-xs sm:text-sm font-bold bg-white border border-stone-300 rounded-xl focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20 text-[#2C221E] outline-hidden cursor-pointer shadow-xs"
              >
                <option value="" disabled>
                  📍 Seleccionar destino...
                </option>
                {destinosDisponibles.map((ub) => (
                  <option key={ub} value={ub}>
                    {ub === 'Camara Frio' ? '❄️ Cámara Frío' : ub === 'Puesto Principal' ? '🏪 Puesto Principal' : '🏢 Puesto Contingencia'}
                  </option>
                ))}
              </select>
            </div>

            {/* Botón Dividir Jabas */}
            {tieneVariasJabas ? (
              <button
                type="button"
                onClick={() => onDividir(jaba)}
                className="w-full h-11 px-3 rounded-xl bg-white hover:bg-orange-50 text-[#6D4C41] hover:text-[#E65100] border border-stone-300 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                title="Dividir este grupo en jabas separadas"
              >
                <Split className="w-4 h-4 text-[#E65100] shrink-0" />
                <span>Dividir grupo ({jaba.cantidadJabas} jabas)</span>
              </button>
            ) : (
              <div className="h-11 px-3 rounded-xl bg-stone-100/70 border border-stone-200/80 text-stone-400 font-semibold text-xs flex items-center justify-center gap-1 select-none text-center">
                <span>Jaba individual (1)</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export function DistribucionView() {
  const { empresaId } = useAuth();
  const [ubicacionesDB, setUbicacionesDB] = useState([]);
  const [acopios, setAcopios] = useState([]);
  const [inventarioDB, setInventarioDB] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTabMobile, setActiveTabMobile] = useState('Puesto Principal');

  // Lote seleccionado para distribución rápida
  const [selectedLoteId, setSelectedLoteId] = useState('');

  // Control del modal de dividir jaba
  const [jabaADividir, setJabaADividir] = useState(null);
  const [modalDividirOpen, setModalDividirOpen] = useState(false);

  // Mapeo de jabas organizadas por ubicación (Solo las 3 ubicaciones oficiales en Lima)
  const [jabasMap, setJabasMap] = useState({
    'Camara Frio': [],
    'Puesto Principal': [],
    'Puesto Contingencia': [],
  });

  const cargarDatos = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      setError('');

      const [listaUbicaciones, listaAcopios, dataInventario] = await Promise.all([
        distribucionService.listarUbicaciones(empresaId),
        acopioService.listarAcopios(empresaId),
        inventarioService.listarInventarioPorEmpresa(empresaId),
      ]);

      // Filtrar para que solo existan las 3 ubicaciones operativas de Lima
      const ubicacionesLima = listaUbicaciones.filter((u) => u.tipo !== 'Acopio' && u.nombre !== 'Acopio');
      setUbicacionesDB(ubicacionesLima);
      setAcopios(listaAcopios);
      setInventarioDB(Array.isArray(dataInventario) ? dataInventario : []);

      // Preseleccionar preferentemente un lote que aún tenga stock activo (no liquidado)
      if (listaAcopios.length > 0 && (!selectedLoteId || !listaAcopios.some((a) => a.acopioId === selectedLoteId))) {
        const loteActivo = listaAcopios.find((a) => a.estado !== 'Liquidado');
        setSelectedLoteId(loteActivo ? loteActivo.acopioId : listaAcopios[0].acopioId);
      }

      const nuevoMapa = {
        'Camara Frio': [],
        'Puesto Principal': [],
        'Puesto Contingencia': [],
      };

      // Poblar en las columnas si la jaba tiene asignada esa ubicación físicamente
      listaAcopios.forEach((acopio) => {
        // Los lotes ya liquidados (100% vendidos) no deben mostrarse en las columnas físicas activas
        if (acopio.estado === 'Liquidado') return;

        const jabas = acopio.jabas || [];
        jabas.forEach((jaba) => {
          const ubicacionObj = listaUbicaciones.find((u) => u.ubicacionId === jaba.ubicacionId);
          const nombreUbicacion = ubicacionObj?.tipo || ubicacionObj?.nombre;
          const pesoDisp = (jaba.pesoActual !== undefined && jaba.pesoActual !== null)
            ? Number(jaba.pesoActual)
            : (Number(jaba.pesoBruto) || 0);
          
          // Solo mostrar en las columnas si tiene kilos reales (> 0) y no fue descartada
          if (nombreUbicacion && nuevoMapa[nombreUbicacion] && pesoDisp > 0 && jaba.estado !== 'Convertida_Kilos' && jaba.estado !== 'Descartada') {
            nuevoMapa[nombreUbicacion].push({
              ...jaba,
              pesoActual: pesoDisp,
              acopioOrigen: acopio.origen,
              acopioId: acopio.acopioId,
              encargadoLote: acopio.encargadoLote,
              fechaCompra: acopio.fechaCompra,
              nombreUbicacion,
            });
          }
        });
      });

      setJabasMap(nuevoMapa);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'No se pudieron cargar los datos de distribución en Lima.'
      );
    } finally {
      setLoading(false);
    }
  }, [empresaId, selectedLoteId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Trasladar una jaba individual y sincronizar stock automáticamente en BD
  const handleMoverJaba = async (jaba, destinoUbicacionNombre) => {
    const ubicacionDestino = ubicacionesDB.find(
      (u) => u.tipo === destinoUbicacionNombre || u.nombre === destinoUbicacionNombre
    );

    if (ubicacionDestino?.ubicacionId && jaba.jabaId) {
      try {
        await distribucionService.trasladarJaba(jaba.jabaId, ubicacionDestino.ubicacionId);
        const pesoInfo = Number(jaba.pesoActual) > 0 ? Number(jaba.pesoActual) : Number(jaba.pesoBruto);
        setSuccessMsg(`Jaba y ${formatearKilos(pesoInfo)} reubicados en ${destinoUbicacionNombre}.`);
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        console.warn('Error trasladando jaba en servidor:', err?.message);
        setError(err.response?.data?.message || err.response?.data?.error || 'Error al mover jaba.');
        return;
      }
    }

    setJabasMap((prev) => {
      const nuevo = { ...prev };
      Object.keys(nuevo).forEach((col) => {
        nuevo[col] = nuevo[col].filter((item) => (item.jabaId || item.id) !== (jaba.jabaId || jaba.id));
      });
      const jabaActualizada = {
        ...jaba,
        ubicacionId: ubicacionDestino?.ubicacionId || jaba.ubicacionId,
      };
      nuevo[destinoUbicacionNombre] = [...(nuevo[destinoUbicacionNombre] || []), jabaActualizada];
      return nuevo;
    });

    // Actualizar estado del lote a Recibido en Lima
    if (jaba.acopioId) {
      setAcopios((prev) =>
        prev.map((a) => (a.acopioId === jaba.acopioId ? { ...a, estado: 'Recibido' } : a))
      );
    }

    cargarDatos();
  };

  // Trasladar TODO el lote completo a una ubicación con 1 clic y sincronizar en BD
  const handleMoverLoteCompleto = async (acopioId, destinoUbicacionNombre) => {
    const ubicacionDestino = ubicacionesDB.find(
      (u) => u.tipo === destinoUbicacionNombre || u.nombre === destinoUbicacionNombre
    );
    if (!ubicacionDestino?.ubicacionId) return;

    const acopio = acopios.find((a) => a.acopioId === acopioId);
    const jabasDelLote = acopio?.jabas || [];
    if (jabasDelLote.length === 0) return;

    // Actualizar estado del lote a Recibido en Lima
    setAcopios((prev) =>
      prev.map((a) => (a.acopioId === acopioId ? { ...a, estado: 'Recibido' } : a))
    );

    // Enviar traslados en paralelo a la base de datos
    try {
      await Promise.all(
        jabasDelLote.map(async (j) => {
          await distribucionService.trasladarJaba(j.jabaId, ubicacionDestino.ubicacionId);
        })
      );
      setSuccessMsg(`Lote completo distribuido en ${destinoUbicacionNombre}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      cargarDatos();
    } catch (err) {
      console.warn('Error trasladando grupo en servidor:', err?.message);
    }
  };

  const handleAbrirDividir = (jaba) => {
    setJabaADividir(jaba);
    setModalDividirOpen(true);
  };

  // Mapa de stock disponible en BD por ubicación_id
  const stockPorUbicacionDB = useMemo(() => {
    const mapa = {};
    inventarioDB.forEach((inv) => {
      const uId = inv.ubicacionId;
      const k = Number(inv.kilosDisponibles) || 0;
      mapa[uId] = (mapa[uId] || 0) + k;
    });
    return mapa;
  }, [inventarioDB]);

  // Obtener el lote activo seleccionado para distribución rápida
  const acopioSeleccionado = acopios.find((a) => a.acopioId === selectedLoteId) || acopios[0];
  const jabasDelLoteSeleccionado = acopioSeleccionado?.jabas || [];

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#E8D8C8]/60 text-[#2C221E] border border-[#E8D8C8]">
              Distribución Lima
            </span>
            <span className="text-xs text-stone-500 font-semibold">Mercado Mayorista</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
            Distribución Física de Jabas
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Asignación y reubicación flexible de jabas entre puestos oficiales con sincronización automática de stock.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton
            onRefresh={cargarDatos}
            loading={loading}
            title="Recargar inventario"
          />
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* PANEL DE DISTRIBUCIÓN POR ACOPIO / LOTE */}
      {acopios.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E65100] flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-[#2C221E]">
                  Distribución por Lote de Acopio
                </h2>
                <p className="text-[11px] text-stone-500">
                  Seleccione el lote para distribuir sus jabas y sincronizar kilos directamente en los puestos.
                </p>
              </div>
            </div>

            {/* Selector de Acopio */}
            <div className="flex items-center gap-2">
              <label htmlFor="select-lote" className="text-xs font-bold text-stone-600 whitespace-nowrap">
                Lote Activo:
              </label>
              <select
                id="select-lote"
                value={selectedLoteId}
                onChange={(e) => setSelectedLoteId(e.target.value)}
                className="h-11 px-3 text-xs sm:text-sm bg-[#FAFAFC] border border-stone-300 rounded-xl focus:bg-white focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20 font-bold text-[#2C221E] outline-hidden cursor-pointer"
              >
                {acopios.map((a) => {
                  const estaLiquidado = a.estado === 'Liquidado';
                  const pesoRemanente = estaLiquidado ? 0 : (a.totalPesoActual !== undefined ? a.totalPesoActual : a.totalPesoBruto);
                  return (
                    <option key={a.acopioId} value={a.acopioId}>
                      {estaLiquidado ? '[LIQUIDADO] ' : ''}
                      {a.origen} • {a.encargadoLote} ({a.estado} • {formatearKilos(pesoRemanente || 0)})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Información del Lote y Acciones de Distribución Masiva */}
          {acopioSeleccionado && (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#FAFAFC] p-4 rounded-xl border border-stone-200">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-extrabold text-[#2C221E] flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#E65100]" />
                    {acopioSeleccionado.origen}
                  </span>
                  <span className="text-xs text-stone-500 font-semibold">
                    Encargado: {acopioSeleccionado.encargadoLote}
                  </span>
                  <span className="text-xs text-stone-500 font-semibold">
                    Fecha: {formatearFecha(acopioSeleccionado.fechaCompra)}
                  </span>
                  <span className="text-xs font-bold text-[#E65100]">
                    Flete: {formatearMoneda(acopioSeleccionado.fleteCosto || 0)}
                  </span>
                  <Badge
                    status={
                      acopioSeleccionado.estado === 'En Transito'
                        ? 'En_Transito'
                        : acopioSeleccionado.estado === 'Recibido'
                        ? 'Recibido_Lima'
                        : acopioSeleccionado.estado === 'Liquidado'
                        ? 'Liquidado'
                        : acopioSeleccionado.estado
                    }
                    size="sm"
                  />
                </div>

                {/* Acciones para distribuir todo el lote a un destino */}
                {acopioSeleccionado.estado === 'Liquidado' ? (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-xs shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Lote 100% Liquidado (Stock Agotado)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-stone-600 whitespace-nowrap">
                      Distribuir todo a:
                    </span>
                    {UBICACIONES.map((ub) => (
                      <button
                        key={ub}
                        type="button"
                        onClick={() => handleMoverLoteCompleto(acopioSeleccionado.acopioId, ub)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-stone-300 text-[#2C221E] hover:bg-[#E65100] hover:text-white hover:border-[#E65100] transition-all cursor-pointer shadow-xs min-h-[44px]"
                        title={`Enviar todas las jabas a ${ub}`}
                      >
                        {ub}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Banner informativo si el lote está liquidado */}
              {acopioSeleccionado.estado === 'Liquidado' && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Historial: Todas las jabas de este lote han sido vendidas en balanza. No quedan kilos activos en puestos.</span>
                </div>
              )}

              {/* Lista de jabas del lote con CARDS LIMPIAS */}
              <div>
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2.5">
                  Grupos de Jabas del Lote ({jabasDelLoteSeleccionado.length} grupos):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-stretch">
                  {jabasDelLoteSeleccionado.map((jaba, idx) => (
                    <JabaCardSimetrica
                      key={jaba.jabaId || idx}
                      jaba={jaba}
                      idx={idx}
                      ubicacionesDB={ubicacionesDB}
                      onMover={handleMoverJaba}
                      onDividir={handleAbrirDividir}
                      prefixId="lote"
                      esLiquidada={acopioSeleccionado.estado === 'Liquidado' || Number(jaba.pesoActual) === 0}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selector de pestañas para vista móvil (< lg) */}
      <div className="lg:hidden flex rounded-xl bg-stone-100 p-1 overflow-x-auto gap-1">
        {UBICACIONES.map((ub) => (
          <button
            key={ub}
            type="button"
            onClick={() => setActiveTabMobile(ub)}
            className={`px-3 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all min-h-[44px] flex items-center gap-1.5 ${
              activeTabMobile === ub
                ? 'bg-white text-[#2C221E] shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <span>{ub}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-stone-200 text-stone-700 text-[10px]">
              {jabasMap[ub]?.length || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Tablero Kanban General por Ubicación Física */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 flex flex-col items-center justify-center text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-xs font-bold text-[#2C221E]">Cargando tablero de distribución...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {UBICACIONES.map((ubicacionNombre) => {
            const Icon = UBICACION_ICONS[ubicacionNombre] || Building2;
            const estiloCol = UBICACION_COLORS[ubicacionNombre];
            const items = jabasMap[ubicacionNombre] || [];
            const ubicacionObj = ubicacionesDB.find((u) => u.tipo === ubicacionNombre || u.nombre === ubicacionNombre);
            
            // Si la base de datos tiene stock disponible registrado para este puesto (con ventas descontadas), usamos ese valor;
            // de lo contrario sumamos el peso de las jabas
            const stockRealBD = ubicacionObj?.ubicacionId ? stockPorUbicacionDB[ubicacionObj.ubicacionId] : null;
            const totalKgJabas = items.reduce((acc, curr) => acc + (Number(curr.pesoActual !== undefined ? curr.pesoActual : curr.pesoBruto) || 0), 0);
            const totalKgColumna = stockRealBD !== undefined && stockRealBD !== null && inventarioDB.length > 0 ? stockRealBD : totalKgJabas;
            const totalJabasColumna = items.reduce((acc, curr) => acc + (Number(curr.cantidadJabas) || 0), 0);

            const isVisibleMobile = activeTabMobile === ubicacionNombre;

            return (
              <div
                key={ubicacionNombre}
                className={`flex flex-col bg-white border rounded-2xl p-4 space-y-4 min-h-[500px] ${
                  isVisibleMobile ? 'flex' : 'hidden lg:flex'
                } border-stone-200 shadow-xs`}
              >
                {/* Cabecera de la columna */}
                <div className={`p-3.5 rounded-xl border flex flex-col gap-1 ${estiloCol}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 shrink-0" />
                      <div>
                        <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider">
                          {ubicacionNombre}
                        </h3>
                        <p className="text-[11px] font-semibold opacity-90">
                          {totalJabasColumna} {totalJabasColumna === 1 ? 'jaba' : 'jabas'} • {formatearKilos(totalKgColumna)} disponibles
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white shadow-xs">
                      {items.length}
                    </span>
                  </div>
                </div>

                {/* Lista de tarjetas simétricas */}
                <div className="flex-1 space-y-3.5 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-center p-4 border border-dashed border-stone-300 rounded-xl bg-[#FAFAFC]">
                      <Icon className="w-8 h-8 text-stone-300 mb-1" />
                      <p className="text-xs font-bold text-stone-600">Sin jabas en este puesto</p>
                      <p className="text-[11px] text-stone-400">Distribuya jabas desde el panel superior</p>
                    </div>
                  ) : (
                    items.map((jaba, idx) => (
                      <JabaCardSimetrica
                        key={jaba.jabaId || jaba.id || idx}
                        jaba={jaba}
                        idx={idx}
                        ubicacionesDB={ubicacionesDB}
                        onMover={handleMoverJaba}
                        onDividir={handleAbrirDividir}
                        prefixId="kanban"
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para Dividir / Separar Grupo de Jabas */}
      <DividirJabaModal
        isOpen={modalDividirOpen}
        onClose={() => setModalDividirOpen(false)}
        jaba={jabaADividir}
        ubicaciones={ubicacionesDB}
        onSuccess={cargarDatos}
      />
    </div>
  );
}
