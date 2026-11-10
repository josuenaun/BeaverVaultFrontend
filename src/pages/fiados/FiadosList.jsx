// src/pages/fiados/FiadosList.jsx - Módulo de cobranzas, abonos y control de fiados (Ventas al crédito)
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ventaService } from '../../services/ventaService';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { RefreshButton } from '../../components/common/RefreshButton';
import { AbonoFiadoModal } from './AbonoFiadoModal';
import { Pagination } from '../../components/common/Pagination';
import { formatearMoneda, formatearFecha } from '../../utils/formatters';
import { TIPOS_PALTA } from '../../utils/constants';
import {
  BookOpenCheck,
  Search,
  Plus,
  CheckCircle,
  Calendar,
  DollarSign,
  User,
  AlertTriangle,
} from 'lucide-react';

export function FiadosList() {
  const { user, empresaId } = useAuth();
  const [fiados, setFiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS'); // 'TODOS' | 'PENDIENTES' | 'MORA'

  // Modal para abono parcial o liquidación
  const [selectedFiadoAbono, setSelectedFiadoAbono] = useState(null);

  // Modal para nuevo fiado manual
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [nombreDeudor, setNombreDeudor] = useState('');
  const [tipoPalta, setTipoPalta] = useState('Fuerte');
  const [kilosRetirados, setKilosRetirados] = useState('');
  const [montoTotal, setMontoTotal] = useState('');
  const [adelantoInicial, setAdelantoInicial] = useState('');
  const [motivoDeuda, setMotivoDeuda] = useState('');
  const [fechaAdvertencia, setFechaAdvertencia] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);
  const [fiadoASaldar, setFiadoASaldar] = useState(null);
  const [saldando, setSaldando] = useState(false);
  const [errorNuevoFiado, setErrorNuevoFiado] = useState('');

  const cargarFiados = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      setError('');
      const data = await ventaService.listarFiados(empresaId);
      setFiados(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('No se pudieron cargar los fiados: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarFiados();
  }, [cargarFiados]);

  // Manejar abonos parciales
  const handleAbonoSuccess = async ({ fiadoId, montoAbono, metodoPago, nota, esTotal }) => {
    try {
      // Actualización reactiva inmediata en pantalla: descuenta la deuda al instante
      setFiados((prev) =>
        prev
          .map((f) => {
            if (f.fiadoId === fiadoId) {
              const deudaActual = Number(f.montoDeuda) || 0;
              const nuevoMonto = Math.max(0, deudaActual - montoAbono);
              if (esTotal || nuevoMonto <= 0) return null;
              const detalleAbono = `[Abonó ${formatearMoneda(montoAbono)} via ${metodoPago}${nota ? ` - ${nota}` : ''}]`;
              return {
                ...f,
                montoDeuda: nuevoMonto,
                motivoDeuda: `${f.motivoDeuda || ''} ${detalleAbono}`.trim(),
              };
            }
            return f;
          })
          .filter(Boolean)
      );

      await ventaService.registrarAbonoFiado(fiadoId, {
        montoAbono,
        metodoPago,
        nota,
        esTotal,
      });

      setSuccessMsg(
        esTotal
          ? '¡Deuda saldada en su totalidad!'
          : `Abono de ${formatearMoneda(montoAbono)} registrado con éxito. Saldo pendiente actualizado.`
      );
      setTimeout(() => setSuccessMsg(''), 4000);
      await cargarFiados();
    } catch (err) {
      setError(err?.message || 'Error al procesar el abono.');
    }
  };

  // Marcar deudor en mora (se llevó los kilos y no pagó)
  const handleMarcarMora = async (fiadoId) => {
    try {
      await ventaService.actualizarEstadoFiado(fiadoId, { estado: 'Mora' });
      setFiados((prev) =>
        prev.map((f) => (f.fiadoId === fiadoId ? { ...f, estado: 'Mora' } : f))
      );
      setSuccessMsg('Cliente registrado como "En Mora / No Pagó". Kilos descontados mantenidos.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err?.message || 'Error al actualizar estado a mora.');
    }
  };

  // Saldar directo interactivo (abre modal de confirmación sin localhost dice)
  const solicitarSaldarFiado = (fiado) => {
    setFiadoASaldar(fiado);
  };

  const ejecutarSaldarFiado = async () => {
    if (!fiadoASaldar) return;
    try {
      setSaldando(true);
      await ventaService.eliminarFiado(fiadoASaldar.fiadoId);
      setSuccessMsg(`Deuda de ${fiadoASaldar.nombreDeudor} marcada como cobrada y saldada.`);
      setTimeout(() => setSuccessMsg(''), 4000);
      setFiadoASaldar(null);
      cargarFiados();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al saldar la deuda.');
    } finally {
      setSaldando(false);
    }
  };

  // Crear fiado manual
  const handleCrearFiadoManual = async (e) => {
    e.preventDefault();
    setErrorNuevoFiado('');
    const total = parseFloat(montoTotal);
    const adelanto = parseFloat(adelantoInicial) || 0;
    const netoDeuda = total - adelanto;

    if (!nombreDeudor.trim() || isNaN(total) || total <= 0) {
      setErrorNuevoFiado('Por favor complete los campos obligatorios (nombre del cliente y monto total válido).');
      return;
    }

    if (netoDeuda <= 0) {
      setErrorNuevoFiado('El adelanto no puede ser mayor o igual al monto total de la venta.');
      return;
    }

    const creadoPorUsuarioId =
      user?.usuarioId ||
      user?.superAdminId ||
      '00000000-0000-0000-0000-000000000000';

    const detalleFruta = kilosRetirados
      ? `${kilosRetirados} kg Palta ${tipoPalta}`
      : `Palta ${tipoPalta}`;
    const motivoFinal = motivoDeuda.trim()
      ? `${detalleFruta} - ${motivoDeuda.trim()}${adelanto > 0 ? ` (Adelanto: ${formatearMoneda(adelanto)})` : ''}`
      : `${detalleFruta}${adelanto > 0 ? ` (Adelanto inicial: ${formatearMoneda(adelanto)})` : ''}`;

    try {
      setSaving(true);
      await ventaService.registrarFiado({
        empresaId,
        nombreDeudor: nombreDeudor.trim(),
        motivoDeuda: motivoFinal,
        montoDeuda: netoDeuda,
        montoAbonado: adelanto,
        montoTotalOriginal: total,
        fechaAdvertencia,
        creadoPorUsuarioId,
      });

      setModalNuevoOpen(false);
      setNombreDeudor('');
      setMotivoDeuda('');
      setKilosRetirados('');
      setMontoTotal('');
      setAdelantoInicial('');
      setErrorNuevoFiado('');
      setSuccessMsg('¡Nuevo fiado registrado con éxito!');
      setTimeout(() => setSuccessMsg(''), 4000);
      cargarFiados();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar el fiado.');
    } finally {
      setSaving(false);
    }
  };

  // Filtrado reactivo
  const fiadosFiltrados = useMemo(() => {
    return fiados.filter((f) => {
      // Filtro de texto
      const txt = `${f.nombreDeudor || ''} ${f.motivoDeuda || ''}`.toLowerCase();
      if (searchQuery && !txt.includes(searchQuery.toLowerCase())) return false;

      // Filtro de estado
      if (filtroEstado === 'MORA' && f.estado !== 'Mora') return false;
      if (filtroEstado === 'PENDIENTES' && f.estado === 'Mora') return false;

      return true;
    });
  }, [fiados, searchQuery, filtroEstado]);

  // Paginación (10 fiados por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const TAMANO_PAGINA = 10;

  useEffect(() => {
    setPaginaActual(1);
  }, [searchQuery, filtroEstado]);

  const itemsPaginados = useMemo(() => {
    const start = (paginaActual - 1) * TAMANO_PAGINA;
    return fiadosFiltrados.slice(start, start + TAMANO_PAGINA);
  }, [fiadosFiltrados, paginaActual]);

  // Cálculos consolidados
  const metricas = useMemo(() => {
    let totalPorCobrar = 0;
    let totalEnMora = 0;
    let clientesEnMoraCount = 0;

    fiados.forEach((f) => {
      const deuda = Number(f.montoDeuda) || 0;
      totalPorCobrar += deuda;
      if (f.estado === 'Mora') {
        totalEnMora += deuda;
        clientesEnMoraCount += 1;
      }
    });

    return {
      totalPorCobrar,
      totalEnMora,
      clientesEnMoraCount,
      totalClientes: fiados.length,
    };
  }, [fiados]);

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
              Créditos
            </span>
            <span className="text-xs text-stone-500 font-semibold">Cuentas por Cobrar</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
            Control de Fiados
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Seguimiento de ventas al crédito, abonos parciales y clientes con pagos pendientes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton
            onRefresh={cargarFiados}
            loading={loading}
            title="Recargar deudas"
          />

          <Button
            onClick={() => setModalNuevoOpen(true)}
            className="bg-[#E65100] hover:bg-[#cf4700] text-white font-bold min-h-[44px] text-xs shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Nuevo Fiado</span>
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {successMsg && <Alert type="success" message={successMsg} onClose={() => setSuccessMsg('')} />}

      {/* Tarjetas de Métricas de Cobranza (Limpias y Homogéneas) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Saldo Pendiente
            </span>
            <p className="text-2xl font-extrabold text-[#E65100] mt-1 tracking-tight">
              {formatearMoneda(metricas.totalPorCobrar)}
            </p>
            <span className="text-[11px] text-stone-500">Por cobrar en balanza</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Clientes con Deuda
            </span>
            <p className="text-2xl font-extrabold text-[#2C221E] mt-1 tracking-tight">
              {metricas.totalClientes} clientes
            </p>
            <span className="text-[11px] text-stone-500">Cuentas activas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
            <BookOpenCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              En Observación / Mora
            </span>
            <p className="text-2xl font-extrabold text-rose-700 mt-1 tracking-tight">
              {formatearMoneda(metricas.totalEnMora)}
            </p>
            <span className="text-[11px] text-rose-600 font-semibold">
              {metricas.clientesEnMoraCount} {metricas.clientesEnMoraCount === 1 ? 'cliente observado' : 'clientes observados'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por cliente o detalle de palta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#E65100] outline-hidden font-medium"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl shrink-0 text-xs font-bold">
          {[
            { id: 'TODOS', label: 'Todos' },
            { id: 'PENDIENTES', label: 'Vigentes' },
            { id: 'MORA', label: 'En Mora / Observados' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltroEstado(f.id)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filtroEstado === f.id
                  ? 'bg-white text-[#2C221E] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 flex flex-col items-center justify-center text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-xs font-bold text-stone-600">Cargando libro de fiados...</p>
        </div>
      ) : fiadosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-dashed border-stone-300 text-center max-w-lg mx-auto">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#2C221E] mb-1">¡Al día! No hay fiados pendientes</h3>
          <p className="text-xs text-stone-500">
            {searchQuery
              ? 'No hay registros que coincidan con la búsqueda.'
              : 'Todas las ventas al crédito han sido saldadas en su totalidad.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Cliente (Deudor)</th>
                  <th className="px-5 py-3.5">Detalle / Kilos Retirados</th>
                  <th className="px-5 py-3.5">Fecha Límite</th>
                  <th className="px-5 py-3.5 text-right">Saldo Pendiente</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {itemsPaginados.map((item) => {
                  const enMora = item.estado === 'Mora';
                  const deuda = Number(item.montoDeuda) || 0;

                  return (
                    <tr
                      key={item.fiadoId}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        enMora ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <td className="px-5 py-4 font-bold text-[#2C221E]">
                        <div className="flex items-center gap-2">
                          <User
                            className={`w-4 h-4 shrink-0 ${enMora ? 'text-rose-600' : 'text-amber-600'}`}
                          />
                          <span className="text-sm">{item.nombreDeudor}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-stone-700">
                        <span className="font-semibold block">{item.motivoDeuda}</span>
                        <span className="text-[10px] text-stone-400">
                          Kilos descontados de stock
                        </span>
                      </td>

                      <td className="px-5 py-4 text-stone-600 font-semibold whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{formatearFecha(item.fechaAdvertencia)}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-black text-right whitespace-nowrap">
                        <span
                          className={`text-base font-mono ${
                            enMora ? 'text-rose-700' : 'text-[#E65100]'
                          }`}
                        >
                          {formatearMoneda(deuda)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center whitespace-nowrap">
                        {enMora ? (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            En Mora (No Pagó)
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                            Pendiente
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón de Abono Parcial */}
                          <button
                            type="button"
                            onClick={() => setSelectedFiadoAbono(item)}
                            className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-[#E65100] border border-[#E65100]/30 font-bold text-xs cursor-pointer shadow-2xs"
                            title="Registrar abono de dinero a esta cuenta"
                          >
                            Abonar / Cobrar
                          </button>

                          {/* Botón de Saldar Deuda Completa */}
                          <Button
                            size="sm"
                            onClick={() => solicitarSaldarFiado(item)}
                            className="bg-[#2C221E] hover:bg-black text-white font-bold text-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Saldar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={paginaActual}
            totalItems={fiadosFiltrados.length}
            pageSize={TAMANO_PAGINA}
            onPageChange={setPaginaActual}
          />
        </div>
      )}

      {/* Modal Registrar Fiado Directo */}
      <Modal
        isOpen={modalNuevoOpen}
        onClose={() => {
          setModalNuevoOpen(false);
          setErrorNuevoFiado('');
        }}
        title="Registrar Fiado Directo"
        subtitle="Venta al crédito con descuento automático de kilos en inventario"
      >
        <form onSubmit={handleCrearFiadoManual} className="space-y-4">
          {errorNuevoFiado && <Alert type="error" message={errorNuevoFiado} />}

          <Input
            label="Nombre del Cliente (Deudor)"
            name="nombreDeudor"
            value={nombreDeudor}
            onChange={(e) => setNombreDeudor(e.target.value)}
            placeholder="Ej. Don Santos - Puesto 12"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#2C221E] block mb-1">Tipo de Palta:</label>
              <select
                value={tipoPalta}
                onChange={(e) => setTipoPalta(e.target.value)}
                className="w-full h-10 px-3 text-xs font-bold bg-white border border-stone-300 rounded-xl outline-hidden focus:border-[#E65100]"
              >
                {TIPOS_PALTA.map((tp) => (
                  <option key={tp} value={tp}>
                    Palta {tp}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#2C221E] block mb-1">
                Kilos Retirados:
              </label>
              <input
                type="number"
                step="0.5"
                placeholder="Ej. 65.50 kg"
                value={kilosRetirados}
                onChange={(e) => setKilosRetirados(e.target.value)}
                className="w-full h-10 px-3 text-xs font-bold bg-white border border-stone-300 rounded-xl outline-hidden focus:border-[#E65100]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Monto Total de Venta (S/.)"
              name="montoTotal"
              type="number"
              step="0.10"
              min="0.10"
              value={montoTotal}
              onChange={(e) => setMontoTotal(e.target.value)}
              placeholder="Ej. 520.00"
              required
            />

            <Input
              label="¿Dejó algún adelanto? (S/.)"
              name="adelantoInicial"
              type="number"
              step="0.10"
              value={adelantoInicial}
              onChange={(e) => setAdelantoInicial(e.target.value)}
              placeholder="Ej. 100.00 (Opcional)"
            />
          </div>

          <Input
            label="Detalle / Observación adicional"
            name="motivoDeuda"
            value={motivoDeuda}
            onChange={(e) => setMotivoDeuda(e.target.value)}
            placeholder="Ej. Se llevó 2 cajas de Fuerte primera"
          />

          <Input
            label="Fecha Límite de Cobro"
            name="fechaAdvertencia"
            type="date"
            value={fechaAdvertencia}
            onChange={(e) => setFechaAdvertencia(e.target.value)}
            required
          />

          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2.5 justify-end">
            <Button
              variant="outline"
              onClick={() => setModalNuevoOpen(false)}
              disabled={saving}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={saving}
              className="w-full sm:w-auto bg-[#E65100] hover:bg-[#cf4700] text-white font-bold min-h-[44px]"
            >
              Guardar Fiado
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Abono o Cobranza */}
      {selectedFiadoAbono && (
        <AbonoFiadoModal
          isOpen={Boolean(selectedFiadoAbono)}
          onClose={() => setSelectedFiadoAbono(null)}
          fiado={selectedFiadoAbono}
          onAbonoSuccess={handleAbonoSuccess}
          onMarcarMora={handleMarcarMora}
        />
      )}

      {/* Modal de confirmación para saldar deuda */}
      <ConfirmModal
        isOpen={Boolean(fiadoASaldar)}
        onClose={() => {
          if (!saldando) setFiadoASaldar(null);
        }}
        onConfirm={ejecutarSaldarFiado}
        title="Confirmar Cobro y Saldo de Deuda"
        message={`¿Confirmar que la totalidad de la deuda de "${fiadoASaldar?.nombreDeudor || 'este cliente'}" por un monto de ${formatearMoneda(fiadoASaldar?.montoDeuda || 0)} ha sido cobrada y saldada?`}
        confirmText="Sí, saldar deuda"
        cancelText="Cancelar"
        variant="success"
        loading={saldando}
      />
    </div>
  );
}
