// src/pages/fiados/AbonoFiadoModal.jsx - Ventana modal para registro de abonos parciales y liquidación de deudas de fiados
// ==========================================
// 1. Importaciones y Dependencias
// ==========================================
import { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { formatearMoneda } from '../../utils/formatters';
import { CheckCircle2, HandCoins } from 'lucide-react';

// ==========================================
// 2. Componente Modal AbonoFiadoModal
// ==========================================
export function AbonoFiadoModal({ isOpen, onClose, fiado, onAbonoSuccess, onMarcarMora }) {
  // ----------------------------------------
  // 3. Cálculos de Saldos y Amortización
  // ----------------------------------------
  const saldoPendiente = Number(fiado?.montoDeuda) || 0;
  const montoTotalOriginal = Number(fiado?.montoTotalOriginal) || saldoPendiente;
  const totalAbonadoPreviamente = Math.max(0, montoTotalOriginal - saldoPendiente);

  // Estados del formulario de abono
  const [montoAbonoStr, setMontoAbonoStr] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmarMora, setConfirmarMora] = useState(false);

  const montoAbonoNum = parseFloat(montoAbonoStr) || 0;
  const nuevoSaldo = Math.max(0, saldoPendiente - montoAbonoNum);

  // ----------------------------------------
  // 4. Manejador de Registro de Abono
  // ----------------------------------------
  const handleGuardarAbono = async (e) => {
    e.preventDefault();
    setError('');

    if (montoAbonoNum <= 0) {
      setError('Ingrese un monto de abono mayor a S/. 0.00.');
      return;
    }
    if (montoAbonoNum > saldoPendiente) {
      setError(
        `El monto a abonar (${formatearMoneda(montoAbonoNum)}) no puede superar el saldo pendiente (${formatearMoneda(saldoPendiente)}).`
      );
      return;
    }

    try {
      setLoading(true);
      await onAbonoSuccess({
        fiadoId: fiado.fiadoId,
        montoAbono: montoAbonoNum,
        metodoPago,
        nota,
        esTotal: nuevoSaldo === 0,
      });
      onClose();
    } catch (err) {
      setError(err?.message || 'Error al registrar el abono.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      icon={HandCoins}
      title="Registrar Abono o Cobranza"
      subtitle={`Cliente: ${fiado?.nombreDeudor || 'Deudor'}`}
    >
      <form onSubmit={handleGuardarAbono} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Tarjeta de Resumen de Deuda */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2.5">
          {montoTotalOriginal > saldoPendiente && (
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-stone-600 font-semibold">Monto Original de la Venta:</span>
              <span className="font-mono font-bold text-[#2C221E]">
                {formatearMoneda(montoTotalOriginal)}
              </span>
            </div>
          )}

          {totalAbonadoPreviamente > 0 && (
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-emerald-700 font-semibold">Total Abonado a la Fecha:</span>
              <span className="font-mono font-bold text-emerald-700">
                +{formatearMoneda(totalAbonadoPreviamente)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2.5 border-t border-stone-200">
            <span className="text-xs sm:text-sm font-bold text-[#2C221E]">
              Saldo Pendiente Actual:
            </span>
            <span className="font-mono font-black text-xl sm:text-2xl text-[#E65100]">
              {formatearMoneda(saldoPendiente)}
            </span>
          </div>
        </div>

        {/* Input Monto a Pagar Hoy */}
        <div>
          <label className="text-xs sm:text-sm font-bold text-[#2C221E] block mb-1.5">
            ¿Cuánto paga hoy el cliente? (S/.):
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.10"
              min="0.10"
              max={saldoPendiente}
              placeholder="0.00"
              value={montoAbonoStr}
              onChange={(e) => setMontoAbonoStr(e.target.value)}
              className="w-full h-12 px-4 pr-36 text-lg sm:text-xl font-black text-[#2C221E] bg-white border border-stone-300 rounded-xl outline-hidden focus:border-[#E65100] focus:ring-3 focus:ring-[#E65100]/25 transition-all"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setMontoAbonoStr(saldoPendiente.toFixed(2))}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-orange-100 hover:bg-orange-200 text-[#E65100] text-xs font-black cursor-pointer transition-colors"
            >
              Paga Todo ({formatearMoneda(saldoPendiente)})
            </button>
          </div>
        </div>

        {/* Proyección del Saldo Restante */}
        {montoAbonoNum > 0 && (
          <div className="p-3.5 bg-orange-50/70 border border-orange-200/90 rounded-xl flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-stone-700">Nuevo Saldo que quedará debiendo:</span>
            <span className="font-mono font-black text-base sm:text-lg text-[#E65100]">
              {formatearMoneda(nuevoSaldo)}
            </span>
          </div>
        )}

        {/* Método de Pago */}
        <div>
          <label className="text-xs sm:text-sm font-bold text-[#2C221E] block mb-1.5">Medio de Cobro:</label>
          <div className="grid grid-cols-2 gap-2.5">
            {['Efectivo', 'Yape'].map((mp) => (
              <button
                key={mp}
                type="button"
                onClick={() => setMetodoPago(mp)}
                className={`min-h-[44px] rounded-xl border font-bold text-sm cursor-pointer transition-all ${
                  metodoPago === mp
                    ? 'border-[#E65100] bg-orange-50/80 text-[#E65100] ring-2 ring-[#E65100]/20'
                    : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                }`}
              >
                {mp}
              </button>
            ))}
          </div>
        </div>

        {/* Nota o Comprobante */}
        <div>
          <label className="text-xs sm:text-sm font-bold text-[#2C221E] block mb-1.5">
            Nota de Cobranza (Opcional):
          </label>
          <input
            type="text"
            placeholder="Ej. Abono a cuenta de palta Hass / Recibido en efectivo"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full h-11 px-3.5 text-sm bg-white border border-stone-300 rounded-xl outline-hidden focus:border-[#E65100] focus:ring-3 focus:ring-[#E65100]/25 transition-all text-[#2C221E]"
          />
        </div>

        {/* Confirmación interactiva de Mora */}
        {confirmarMora && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
            <p className="text-xs font-bold text-rose-900">
              ¿Marcar al cliente {fiado?.nombreDeudor} como &quot;En Mora / No Pagó&quot;?
            </p>
            <p className="text-[11px] text-rose-700">
              Se mantendrá el registro de los kilos retirados sin liquidar la deuda.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  onMarcarMora?.(fiado.fiadoId);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-xs"
              >
                Confirmar Mora
              </button>
              <button
                type="button"
                onClick={() => setConfirmarMora(false)}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-200 text-stone-700 font-bold text-xs cursor-pointer hover:bg-stone-50"
              >
                Volver
              </button>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Botón para solicitar confirmación de Mora */}
          {!confirmarMora && (
            <button
              type="button"
              onClick={() => setConfirmarMora(true)}
              className="text-xs sm:text-sm text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer py-1"
            >
              Marcar en Mora (No pagó)
            </button>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full sm:w-auto justify-end ml-auto">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[44px] text-xs sm:text-sm"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={montoAbonoNum <= 0}
              className="w-full sm:w-auto min-h-[44px] text-xs sm:text-sm font-black bg-[#E65100] hover:bg-[#cf4700] text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Confirmar Abono ({formatearMoneda(montoAbonoNum)})
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
