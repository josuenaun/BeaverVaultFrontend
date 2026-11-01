// src/pages/fiados/FiadosList.jsx - Módulo de cobranzas y control de fiados (Ventas al crédito)
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ventaService } from '../../services/ventaService';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { Modal } from '../../components/common/Modal';
import { Input } from '../../components/common/Input';
import { formatearMoneda, formatearFecha } from '../../utils/formatters';
import {
  BookOpenCheck,
  Search,
  RefreshCw,
  Plus,
  CheckCircle,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react';

export function FiadosList() {
  const { user, empresaId } = useAuth();
  const [fiados, setFiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para nuevo fiado manual
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [nombreDeudor, setNombreDeudor] = useState('');
  const [motivoDeuda, setMotivoDeuda] = useState('');
  const [montoDeuda, setMontoDeuda] = useState('');
  const [fechaAdvertencia, setFechaAdvertencia] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);

  const cargarFiados = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      setError('');
      const data = await ventaService.listarFiados(empresaId);
      setFiados(data);
    } catch (err) {
      setError('No se pudieron cargar los fiados: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarFiados();
  }, [cargarFiados]);

  const handleSaldarFiado = async (fiadoId) => {
    if (!window.confirm('¿Confirmar que la deuda ha sido cobrada y saldada?')) return;
    try {
      await ventaService.eliminarFiado(fiadoId);
      cargarFiados();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al saldar la deuda');
    }
  };

  const handleCrearFiadoManual = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoDeuda);
    if (!nombreDeudor.trim() || !motivoDeuda.trim() || isNaN(monto) || monto <= 0) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    const creadoPorUsuarioId =
      user?.usuarioId ||
      user?.superAdminId ||
      '00000000-0000-0000-0000-000000000000';

    try {
      setSaving(true);
      await ventaService.registrarFiado({
        empresaId,
        nombreDeudor: nombreDeudor.trim(),
        motivoDeuda: motivoDeuda.trim(),
        montoDeuda: monto,
        fechaAdvertencia,
        creadoPorUsuarioId,
      });

      setModalNuevoOpen(false);
      setNombreDeudor('');
      setMotivoDeuda('');
      setMontoDeuda('');
      cargarFiados();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al registrar el fiado');
    } finally {
      setSaving(false);
    }
  };

  const fiadosFiltrados = fiados.filter((f) => {
    const txt = `${f.nombreDeudor || ''} ${f.motivoDeuda || ''}`.toLowerCase();
    return txt.includes(searchQuery.toLowerCase());
  });

  const totalPorCobrar = fiados.reduce((acc, curr) => acc + (Number(curr.montoDeuda) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#E8D8C8]/60 text-[#2C221E] border border-[#E8D8C8]">
              Créditos & Balanza
            </span>
            <span className="text-xs text-stone-500 font-semibold">Cuentas por Cobrar</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
            Control de Fiados Mayoristas
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Seguimiento de compras al crédito, fechas límite de pago y registro de cobranzas en efectivo.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={cargarFiados}
            disabled={loading}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shadow-xs"
            title="Recargar deudas"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#E65100]' : ''}`} />
          </button>

          <Button
            onClick={() => setModalNuevoOpen(true)}
            className="bg-[#E65100] hover:bg-[#cf4700] text-white font-bold min-h-[44px]"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Registrar Fiado Directo
          </Button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Tarjetas de Métricas de Cobranza */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Total Saldo Pendiente por Cobrar
            </span>
            <p className="text-2xl font-black text-[#E65100] mt-1">
              {formatearMoneda(totalPorCobrar)}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#E65100] flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Cuentas / Clientes Activos
            </span>
            <p className="text-2xl font-black text-[#2C221E] mt-1">
              {fiados.length} clientes
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#6D4C41] text-white flex items-center justify-center font-bold">
            <BookOpenCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por cliente o motivo de deuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20 outline-hidden transition-all"
          />
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
        <>
          {/* Tabla Desktop */}
          <div className="hidden md:block bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Cliente (Deudor)</th>
                    <th className="px-5 py-3.5">Motivo / Variedad</th>
                    <th className="px-5 py-3.5">Fecha Límite</th>
                    <th className="px-5 py-3.5">Monto Adeudado</th>
                    <th className="px-5 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {fiadosFiltrados.map((item) => (
                    <tr key={item.fiadoId} className="hover:bg-stone-50/80 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#2C221E]">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{item.nombreDeudor}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-stone-600 font-medium">
                        {item.motivoDeuda}
                      </td>
                      <td className="px-5 py-4 text-stone-600 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          <span>{formatearFecha(item.fechaAdvertencia)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-black text-[#E65100] text-sm">
                        {formatearMoneda(item.montoDeuda)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSaldarFiado(item.fiadoId)}
                          className="bg-[#2C221E] hover:bg-[#E65100] text-white font-bold"
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                          Saldar Deuda
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards Mobile */}
          <div className="md:hidden space-y-3">
            {fiadosFiltrados.map((item) => (
              <div
                key={item.fiadoId}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#2C221E] flex items-center gap-1.5">
                      <User className="w-4 h-4 text-amber-600" />
                      {item.nombreDeudor}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {item.motivoDeuda}
                    </p>
                  </div>
                  <span className="text-base font-black text-[#E65100]">
                    {formatearMoneda(item.montoDeuda)}
                  </span>
                </div>

                <div className="text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-100 flex items-center justify-between">
                  <span className="text-stone-500 font-semibold">Fecha Límite:</span>
                  <span className="font-bold text-stone-800">
                    {formatearFecha(item.fechaAdvertencia)}
                  </span>
                </div>

                <Button
                  onClick={() => handleSaldarFiado(item.fiadoId)}
                  className="w-full bg-[#2C221E] hover:bg-[#E65100] text-white font-bold min-h-[44px]"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marcar Deuda como Pagada
                </Button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Registrar Fiado Manual */}
      <Modal
        isOpen={modalNuevoOpen}
        onClose={() => setModalNuevoOpen(false)}
        title="Registrar Nuevo Fiado"
        subtitle="Registro de venta o crédito mayorista pendiente de pago"
      >
        <form onSubmit={handleCrearFiadoManual} className="space-y-4">
          <Input
            label="Nombre del Cliente (Deudor)"
            name="nombreDeudor"
            value={nombreDeudor}
            onChange={(e) => setNombreDeudor(e.target.value)}
            placeholder="Ej. Don Santos - Puesto 12"
            required
          />

          <Input
            label="Motivo o Detalle de la Venta"
            name="motivoDeuda"
            value={motivoDeuda}
            onChange={(e) => setMotivoDeuda(e.target.value)}
            placeholder="Ej. 60 kg Palta Hass de primera"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Monto Adeudado (S/.)"
              name="montoDeuda"
              type="number"
              step="0.10"
              min="0.10"
              value={montoDeuda}
              onChange={(e) => setMontoDeuda(e.target.value)}
              placeholder="Ej. 420.00"
              required
            />

            <Input
              label="Fecha Límite de Cobro"
              name="fechaAdvertencia"
              type="date"
              value={fechaAdvertencia}
              onChange={(e) => setFechaAdvertencia(e.target.value)}
              required
            />
          </div>

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
    </div>
  );
}
