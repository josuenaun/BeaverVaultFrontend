// src/pages/transporte/FleteModal.jsx - Contratación y actualización de flete y despacho de lote a Lima
import { useState, useEffect, useId } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';
import { transporteService } from '../../services/transporteService';
import { gastoService } from '../../services/gastoService';
import { formatearMoneda } from '../../utils/formatters';
import { Truck, RefreshCw } from 'lucide-react';

export function FleteModal({ isOpen, onClose, acopio, onSuccess }) {
  const { user } = useAuth();
  const conceptoId = useId();

  const gastoTransporte = acopio?.gastos?.find((g) => g.tipoGasto === 'Transporte');
  const esEdicion = Boolean(Number(acopio?.fleteCosto) > 0 || gastoTransporte);

  const [fleteCosto, setFleteCosto] = useState('');
  const [nombreReceptor, setNombreReceptor] = useState('');
  const [concepto, setConcepto] = useState('Transporte de lote de palta hacia Lima');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      const costo = acopio?.fleteCosto ? String(acopio.fleteCosto) : (gastoTransporte?.montoTotal ? String(gastoTransporte.montoTotal) : '');
      setFleteCosto(costo);
      setNombreReceptor(gastoTransporte?.nombreReceptor || '');
      setConcepto(gastoTransporte?.concepto || 'Transporte de lote de palta hacia Lima');
    }
  }, [isOpen, acopio, gastoTransporte]);

  const costoNum = Number(fleteCosto) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acopio?.acopioId) return;

    if (!nombreReceptor.trim()) {
      setError('Ingrese el nombre del transportista o chofer y placa.');
      return;
    }
    if (costoNum <= 0) {
      setError('El costo del flete debe ser mayor a S/. 0.00.');
      return;
    }

    const usuarioRegistroId =
      user?.usuarioId ||
      user?.superAdminId ||
      '00000000-0000-0000-0000-000000000000';

    try {
      setLoading(true);
      setError('');

      if (esEdicion && gastoTransporte?.gastoId) {
        // Actualizar registro de gasto existente y costo de acopio
        await gastoService.actualizarGasto(gastoTransporte.gastoId, {
          montoTotal: costoNum,
          nombreReceptor: nombreReceptor.trim(),
          concepto: concepto.trim(),
        });
      }

      // También confirmar flete en acopio
      await transporteService.contratarFlete(acopio.acopioId, {
        fleteCosto: costoNum,
        nombreReceptor: nombreReceptor.trim(),
        usuarioRegistroId,
        concepto: concepto.trim(),
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al registrar el flete de transporte'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Actualizar Flete de Transporte' : 'Contratar Flete de Transporte'}
      subtitle={`Lote: ${acopio?.origen || 'Origen'} - Encargado: ${acopio?.encargadoLote || '-'}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {esEdicion && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Este lote ya tiene flete contratado. Al confirmar se actualizarán el costo, chofer y datos pactados.
            </span>
          </div>
        )}

        {/* Tarjeta de resumen de costo */}
        <div className="p-4 bg-[#FAFAFC] border border-[#E8D8C8] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6D4C41] text-white flex items-center justify-center font-bold shadow-xs">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-600 font-semibold">Costo Total Flete</p>
              <p className="text-lg font-extrabold text-[#E65100]">
                {formatearMoneda(costoNum)}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-amber-900">
            En Tránsito a Lima
          </span>
        </div>

        <Input
          label="Chofer y Placa de Camión"
          name="nombreReceptor"
          value={nombreReceptor}
          onChange={(e) => setNombreReceptor(e.target.value)}
          placeholder="Ej. Roberto Quispe - Placa ABT-902"
          required
        />

        <Input
          label="Monto Acordado de Flete (S/.)"
          name="fleteCosto"
          type="number"
          min="1"
          step="0.01"
          value={fleteCosto}
          onChange={(e) => setFleteCosto(e.target.value)}
          placeholder="Ej. 1200.00"
          required
        />

        <div>
          <label htmlFor={conceptoId} className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1.5">
            Concepto / Detalles de la Ruta
          </label>
          <input
            id={conceptoId}
            type="text"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej. Transporte de lote de palta hacia Mercado Mayorista Lima"
            className="w-full h-11 px-3.5 py-2 text-sm text-[#2C221E] bg-white border border-stone-300 rounded-xl shadow-xs outline-hidden focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20"
          />
        </div>

        <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2.5 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto min-h-[44px]"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            className="w-full sm:w-auto bg-[#E65100] hover:bg-[#cf4700] text-white min-h-[44px]"
          >
            <Truck className="w-4 h-4 mr-2" />
            {esEdicion ? 'Actualizar Flete' : 'Confirmar Flete'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
