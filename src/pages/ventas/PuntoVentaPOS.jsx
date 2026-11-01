// src/pages/ventas/PuntoVentaPOS.jsx - Terminal Punto de Venta (POS) Mayorista en Balanza por Kilos
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ventaService } from '../../services/ventaService';
import { distribucionService } from '../../services/distribucionService';
import { api } from '../../services/api';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { formatearMoneda, formatearKilos } from '../../utils/formatters';
import { TIPOS_PALTA, MATRIZ_CLASIFICACION, UBICACION_ICONS } from '../../utils/constants';
import {
  Scale,
  DollarSign,
  QrCode,
  BookOpenCheck,
  CheckCircle2,
  RefreshCw,
  Building2,
  Store,
  Snowflake,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export function PuntoVentaPOS() {
  const { user, empresaId } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const targetUbicacionId = location.state?.ubicacionId;

  const [ubicaciones, setUbicaciones] = useState([]);
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState('');
  const [inventarioKilos, setInventarioKilos] = useState([]);
  const [ventasRecientes, setVentasRecientes] = useState([]);
  const [usuariosEmpresa, setUsuariosEmpresa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados del ítem a vender
  const [tipoPalta, setTipoPalta] = useState('Fuerte');
  const [categoria, setCategoria] = useState('1era');
  const [kilosStr, setKilosStr] = useState('');
  const [precioUnitarioStr, setPrecioUnitarioStr] = useState('7.50');

  // Método de pago: 'Efectivo' | 'Yape' | 'Fiado'
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');

  // Datos para Fiado si se elige Fiado
  const [nombreDeudor, setNombreDeudor] = useState('');
  const [fechaAdvertencia, setFechaAdvertencia] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const kilosNum = parseFloat(kilosStr) || 0;
  const precioNum = parseFloat(precioUnitarioStr) || 0;
  const subtotal = kilosNum * precioNum;
  const vuelto = Math.max(0, (parseFloat(montoRecibido) || 0) - subtotal);

  // Cargar ubicaciones, ventas e inventario
  const cargarUbicacionesYVentas = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      setError('');
      const [listaUbicaciones, listaVentas, resUsuarios] = await Promise.allSettled([
        distribucionService.listarUbicaciones(empresaId),
        ventaService.listarVentas(empresaId),
        api.get(`/empresas/${empresaId}/usuarios`),
      ]);

      const ubicacionesData = listaUbicaciones.status === 'fulfilled' ? listaUbicaciones.value : [];
      const ventasData = listaVentas.status === 'fulfilled' ? listaVentas.value : [];
      const usuariosData = resUsuarios.status === 'fulfilled' ? resUsuarios.value.data?.data || resUsuarios.value.data || [] : [];

      // Filtrar para mostrar solo las ubicaciones de Lima
      const ubicacionesLima = ubicacionesData.filter((u) => u.tipo !== 'Acopio' && u.nombre !== 'Acopio');
      setUbicaciones(ubicacionesLima);
      setVentasRecientes(ventasData);
      setUsuariosEmpresa(usuariosData);

      // Ubicación por defecto
      const seleccionada = targetUbicacionId && ubicacionesLima.some((u) => u.ubicacionId === targetUbicacionId)
        ? targetUbicacionId
        : (ubicacionesLima.find((u) => u.tipo === 'Puesto Principal' || u.nombre === 'Puesto Principal') ||
           ubicacionesLima[0])?.ubicacionId;

      if (seleccionada) {
        setUbicacionSeleccionada(seleccionada);
      }
    } catch (err) {
      setError('Error al inicializar la terminal de balanza: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [empresaId, targetUbicacionId]);

  useEffect(() => {
    cargarUbicacionesYVentas();
  }, [cargarUbicacionesYVentas]);

  // Cargar inventario en kilos al cambiar de ubicación
  const cargarInventarioKilos = useCallback(async () => {
    if (!ubicacionSeleccionada) return;
    try {
      const data = await ventaService.listarInventarioKilos(ubicacionSeleccionada);
      setInventarioKilos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('No se pudo cargar inventario en kilos:', err?.message);
    }
  }, [ubicacionSeleccionada]);

  useEffect(() => {
    cargarInventarioKilos();
  }, [cargarInventarioKilos]);

  // Objeto de la ubicación seleccionada
  const ubicacionActivaObj = useMemo(() => {
    return ubicaciones.find((u) => u.ubicacionId === ubicacionSeleccionada);
  }, [ubicaciones, ubicacionSeleccionada]);

  // Icono oficial unificado para la ubicación
  const IconUbicacion = useMemo(() => {
    const norm = ubicacionActivaObj?.tipo || ubicacionActivaObj?.nombre || '';
    if (norm.includes('Frio') || norm.includes('Frío') || norm.includes('Camara')) return Snowflake;
    if (norm.includes('Contingencia')) return Building2;
    if (norm.includes('Principal')) return Store;
    return UBICACION_ICONS[norm] || Store;
  }, [ubicacionActivaObj]);

  // Helper para obtener kilos disponibles de cualquier variedad y calidad
  const obtenerKilosItem = useCallback((tp, cat) => {
    if (!inventarioKilos || inventarioKilos.length === 0) return 0;
    if (cat) {
      const match = inventarioKilos.find((it) => it.tipoPalta === tp && it.categoria === cat);
      return Number(match?.kilosDisponibles ?? match?._kilosDisponibles) || 0;
    }
    // Suma de toda la variedad
    return inventarioKilos
      .filter((it) => it.tipoPalta === tp)
      .reduce((sum, it) => sum + (Number(it.kilosDisponibles ?? it._kilosDisponibles) || 0), 0);
  }, [inventarioKilos]);

  // Stock disponible en balanza para la variedad y calidad actualmente seleccionadas
  const stockDisponible = useMemo(() => {
    return obtenerKilosItem(tipoPalta, categoria);
  }, [obtenerKilosItem, tipoPalta, categoria]);

  // Funciones del teclado táctil numérico de balanza
  const handleKeypadPress = (val) => {
    if (val === 'C') {
      setKilosStr('');
      return;
    }
    if (val === '.' && kilosStr.includes('.')) return;
    setKilosStr((prev) => prev + val);
  };

  const handleIncrementoKilos = (sumar) => {
    const act = parseFloat(kilosStr) || 0;
    setKilosStr((act + sumar).toFixed(2));
  };

  // Registrar venta
  const handleRegistrarVenta = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!ubicacionSeleccionada) {
      setError('Seleccione un puesto de venta o ubicación.');
      return;
    }
    if (kilosNum <= 0) {
      setError('Ingrese un pesaje en kilos mayor a 0 kg.');
      return;
    }
    if (precioNum <= 0) {
      setError('Ingrese un precio por kilo válido.');
      return;
    }

    if (stockDisponible <= 0) {
      setError(
        `No hay stock disponible en balanza para Palta ${tipoPalta} (${categoria}) en este puesto. Primero traslade jabas a balanza en Distribución Lima o Inventario.`
      );
      return;
    }

    if (kilosNum > stockDisponible) {
      setError(
        `El pesaje a vender (${kilosNum.toFixed(2)} kg) supera el stock disponible en balanza (${stockDisponible.toFixed(2)} kg).`
      );
      return;
    }

    if (metodoPago === 'Fiado' && !nombreDeudor.trim()) {
      setError('Para ventas al crédito (Fiado), el nombre del deudor es obligatorio.');
      return;
    }

    // Resolver ID de vendedor válido (garantizando cumplimiento de FK en Postgres)
    let vendedorUsuarioId = user?.usuarioId;
    if (!vendedorUsuarioId) {
      const vendedorEmpresa = usuariosEmpresa.find((u) => u.usuarioId);
      vendedorUsuarioId = vendedorEmpresa?.usuarioId || '304dbfc7-3c2b-4b08-a6e6-7b6f8876431b';
    }

    const payloadVenta = {
      empresaId,
      vendedorUsuarioId,
      ubicacionId: ubicacionSeleccionada,
      detalles: [
        {
          tipoPalta,
          categoria,
          kilosVendidos: kilosNum,
          precioUnitario: precioNum,
        },
      ],
    };

    try {
      setProcessing(true);
      await ventaService.registrarVenta(payloadVenta);

      // Si el método de pago es Fiado, registrar en /api/fiados
      if (metodoPago === 'Fiado') {
        await ventaService.registrarFiado({
          empresaId,
          nombreDeudor: nombreDeudor.trim(),
          motivoDeuda: `Venta POS: ${kilosNum} kg Palta ${tipoPalta} ${categoria}`,
          montoDeuda: subtotal,
          fechaAdvertencia,
          creadoPorUsuarioId: vendedorUsuarioId,
        });
      }

      setSuccessMsg(
        `¡Venta completada con éxito! ${kilosNum} kg de Palta ${tipoPalta} (${categoria}) cobrados (${formatearMoneda(subtotal)}).`
      );
      setKilosStr('');
      setMontoRecibido('');
      setNombreDeudor('');
      await cargarInventarioKilos();
      await cargarUbicacionesYVentas();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al procesar la venta en el servidor.'
      );
    } finally {
      setProcessing(false);
    }
  };

  const categoriasDisponibles = MATRIZ_CLASIFICACION[tipoPalta] || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera del POS con Iconografía Unificada */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
              Etapa 4: Ventas
            </span>
            <span className="text-xs text-stone-500 font-semibold">Balanza Mayorista</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
            Terminal Punto de Venta en Balanza
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Pesaje en tiempo real, facturación por kilos y control estricto sin merma.
          </p>
        </div>

        {/* Selector de Puesto con Icono Oficial */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white border border-stone-300 rounded-xl shadow-xs min-h-[44px]">
            <IconUbicacion className="w-5 h-5 text-[#E65100] shrink-0" />
            <select
              id="select-puesto-venta"
              value={ubicacionSeleccionada}
              onChange={(e) => setUbicacionSeleccionada(e.target.value)}
              className="text-xs sm:text-sm font-bold text-[#2C221E] bg-transparent outline-hidden cursor-pointer"
            >
              {ubicaciones.map((u) => (
                <option key={u.ubicacionId} value={u.ubicacionId}>
                  {u.tipo || u.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              cargarUbicacionesYVentas();
              cargarInventarioKilos();
            }}
            disabled={loading}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shadow-xs"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda / Central: Selección de Palta y Keypad Táctil de Balanza */}
        <div className="lg:col-span-2 space-y-5">
          {/* Tarjeta de Selección de Variedad */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            <span className="text-xs font-bold text-[#2C221E] uppercase tracking-wider block">
              1. Seleccione Variedad de Palta
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {TIPOS_PALTA.map((tp) => {
                const stockVariedad = obtenerKilosItem(tp);
                return (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => {
                      setTipoPalta(tp);
                      setCategoria(MATRIZ_CLASIFICACION[tp][0]);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs min-h-[58px] flex flex-col items-center justify-center gap-1 ${
                      tipoPalta === tp
                        ? 'border-[#E65100] bg-orange-50 text-[#E65100] shadow-xs ring-2 ring-[#E65100]/20'
                        : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                    }`}
                  >
                    <span className="font-extrabold">Palta {tp}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                      stockVariedad > 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-stone-100 text-stone-400'
                    }`}>
                      {formatearKilos(stockVariedad)}
                    </span>
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-bold text-[#2C221E] uppercase tracking-wider block pt-2">
              2. Calidad de {tipoPalta}
            </span>
            <div className="flex flex-wrap gap-2">
              {categoriasDisponibles.map((cat) => {
                const stockCat = obtenerKilosItem(tipoPalta, cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoria(cat)}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] flex items-center gap-2 ${
                      categoria === cat
                        ? 'border-[#6D4C41] bg-[#6D4C41]/10 text-[#6D4C41] ring-2 ring-[#6D4C41]/20 font-black'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    <span>{cat}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                      stockCat > 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-stone-100 text-stone-400'
                    }`}>
                      {formatearKilos(stockCat)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* BANNER DE DISPONIBILIDAD DE STOCK EN BALANZA EN TIEMPO REAL */}
            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm transition-all ${
              stockDisponible > 0
                ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                : 'bg-amber-50 text-amber-900 border-amber-300'
            }`}>
              <div className="flex items-center gap-2.5">
                {stockDisponible > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                )}
                <div>
                  <span className="font-extrabold text-[#2C221E] block">
                    Stock en balanza ({ubicacionActivaObj?.tipo || ubicacionActivaObj?.nombre || 'Puesto'}):
                  </span>
                  <span className="text-stone-600 text-xs">
                    Palta {tipoPalta} &bull; Calidad {categoria}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-base font-black ${stockDisponible > 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {formatearKilos(stockDisponible)}
                </span>
                {stockDisponible === 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/inventario')}
                    className="text-xs font-bold text-[#E65100] underline hover:text-[#cf4700] ml-1 cursor-pointer whitespace-nowrap"
                  >
                    Pasar Jabas a Balanza &rarr;
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tarjeta de Ingreso de Peso y Keypad Táctil */}
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2C221E] uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600" />
                3. Pesaje en Balanza (Kilogramos)
              </span>
              <span className="text-xs font-semibold text-stone-500">100% Preciso</span>
            </div>

            {/* Display de Peso en Balanza */}
            <div className="p-4 rounded-2xl bg-[#2C221E] text-white flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2">
                <Scale className="w-6 h-6 text-amber-300 animate-pulse" />
                <span className="text-xs uppercase font-bold text-stone-400">Peso Bruto:</span>
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-wider">
                {kilosStr || '0.00'} <span className="text-base text-stone-300">kg</span>
              </div>
            </div>

            {/* Botones de incremento rápido */}
            <div className="grid grid-cols-4 gap-2">
              {[+1, +5, +10, +25].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleIncrementoKilos(inc)}
                  className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer min-h-[40px]"
                >
                  +{inc} kg
                </button>
              ))}
            </div>

            {/* Keypad Numérico Táctil */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'C'].map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => handleKeypadPress(btn)}
                  className={`h-13 sm:h-14 rounded-xl text-lg font-black transition-all shadow-xs cursor-pointer flex items-center justify-center active:scale-95 ${
                    btn === 'C'
                      ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                      : 'bg-stone-100 text-[#2C221E] hover:bg-stone-200'
                  }`}
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Facturación y Métodos de Pago */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-md space-y-5 sticky top-24">
            <div className="border-b border-stone-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Liquidación en Balanza
              </span>
              <h3 className="text-base font-extrabold text-[#2C221E]">
                Resumen de Venta
              </h3>
            </div>

            {/* Detalle actual */}
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-[#2C221E]">
                <span>Producto:</span>
                <span>Palta {tipoPalta} ({categoria})</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Peso en balanza:</span>
                <span className="font-extrabold text-stone-900">{kilosNum.toFixed(2)} kg</span>
              </div>
              <div className="flex items-center justify-between text-stone-600 pt-1">
                <label htmlFor="precioUnitarioInput" className="font-semibold">Precio por kg (S/.):</label>
                <input
                  id="precioUnitarioInput"
                  type="number"
                  step="0.10"
                  value={precioUnitarioStr}
                  onChange={(e) => setPrecioUnitarioStr(e.target.value)}
                  className="w-24 h-8 px-2 text-right font-bold text-xs bg-white border border-stone-300 rounded-lg focus:border-[#E65100] outline-hidden"
                />
              </div>
            </div>

            {/* Total a Pagar */}
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-stone-500">Total a Cobrar</span>
                <p className="text-2xl font-black text-[#E65100]">
                  {formatearMoneda(subtotal)}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#E65100] text-white flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

            {/* Métodos de Pago Aprobados */}
            <div>
              <span className="text-xs font-bold text-[#2C221E] uppercase tracking-wider block mb-2">
                Método de Pago
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Efectivo', label: 'Efectivo', icon: DollarSign },
                  { id: 'Yape', label: 'Yape', icon: QrCode },
                  { id: 'Fiado', label: 'Fiado', icon: BookOpenCheck },
                ].map((mp) => {
                  const Icon = mp.icon;
                  return (
                    <button
                      key={mp.id}
                      type="button"
                      onClick={() => setMetodoPago(mp.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold text-xs flex flex-col items-center gap-1 min-h-[56px] ${
                        metodoPago === mp.id
                          ? 'border-[#E65100] bg-orange-50 text-[#E65100] shadow-xs ring-1 ring-[#E65100]'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{mp.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opciones según método de pago */}
            {metodoPago === 'Efectivo' && (
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <label htmlFor="montoRecibidoInput" className="font-semibold text-stone-700">Monto Recibido:</label>
                  <input
                    id="montoRecibidoInput"
                    type="number"
                    step="0.50"
                    placeholder="S/. 0.00"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className="w-28 h-8 px-2 text-right font-bold text-xs bg-white border border-stone-300 rounded-lg outline-hidden focus:border-[#E65100]"
                  />
                </div>
                {montoRecibido && (
                  <div className="flex justify-between font-bold pt-1 border-t border-stone-200">
                    <span className="text-stone-600">Vuelto a entregar:</span>
                    <span className="text-emerald-700 font-extrabold">{formatearMoneda(vuelto)}</span>
                  </div>
                )}
              </div>
            )}

            {metodoPago === 'Yape' && (
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900 flex items-center gap-2.5">
                <QrCode className="w-6 h-6 text-[#0288D1] shrink-0" />
                <p className="text-[11px] leading-tight">
                  Verifique la recepción del pago vía Yape en el teléfono de la balanza antes de finalizar.
                </p>
              </div>
            )}

            {metodoPago === 'Fiado' && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2.5 text-xs">
                <div>
                  <label htmlFor="nombreDeudorInput" className="font-bold text-amber-900 block mb-1">Nombre del Cliente (Deudor):</label>
                  <input
                    id="nombreDeudorInput"
                    type="text"
                    placeholder="Ej. Don Manuel - Puesto 42"
                    value={nombreDeudor}
                    onChange={(e) => setNombreDeudor(e.target.value)}
                    className="w-full h-9 px-2.5 font-bold text-xs bg-white border border-amber-300 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label htmlFor="fechaAdvertenciaInput" className="font-bold text-amber-900 block mb-1">Fecha Límite de Pago:</label>
                  <input
                    id="fechaAdvertenciaInput"
                    type="date"
                    value={fechaAdvertencia}
                    onChange={(e) => setFechaAdvertencia(e.target.value)}
                    className="w-full h-9 px-2.5 font-bold text-xs bg-white border border-amber-300 rounded-lg outline-hidden"
                  />
                </div>
              </div>
            )}

            {/* Botón Finalizar Venta */}
            <Button
              onClick={handleRegistrarVenta}
              loading={processing}
              disabled={kilosNum <= 0 || stockDisponible <= 0 || kilosNum > stockDisponible}
              className="w-full bg-[#E65100] hover:bg-[#cf4700] text-white font-extrabold h-12 text-sm shadow-md min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Cobrar y Finalizar Venta ({formatearMoneda(subtotal)})
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
