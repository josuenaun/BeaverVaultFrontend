// src/pages/fiados/AbonoFiadoModal.jsx - Registro de Abonos Parciales y Cobranzas
import { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { formatearMoneda } from '../../utils/formatters';
import { DollarSign, CheckCircle2, AlertTriangle, User } from 'lucide-react';

export function AbonoFiadoModal({ isOpen, onClose, fiado, onAbonoSuccess, onMarcarMora }) {
  const montoDeuda = Number(fiado?.montoDeuda) || 0;
  const totalAbonado = Number(fiado?.montoAbonado) || 0;
  const saldoPendiente = Math.max(0, montoDeuda - totalAbonado);

  const [montoAbonoStr, setMontoAbonoStr] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const montoAbonoNum = parseFloat(montoAbonoStr) || 0;
  const nuevoSaldo = Math.max(0, saldoPendiente - montoAbonoNum);

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
      title="Registrar Abono o Cobranza"
      subtitle={`Cliente: ${fiado?.nombreDeudor || 'Deudor'}`}
    >
      <form onSubmit={handleGuardarAbono} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Tarjeta de Resumen de Deuda */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-500 font-bold">Monto Total de Deuda:</span>
            <span className="font-mono font-bold text-stone-800">
              {formatearMoneda(montoDeuda)}
            </span>
          </div>

          {totalAbonado > 0 && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-emerald-700 font-bold">Total Abonado Previamente:</span>
              <span className="font-mono font-bold text-emerald-700">
                +{formatearMoneda(totalAbonado)}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-stone-200">
            <span className="text-xs font-black text-[#2C221E] uppercase">
              Saldo Pendiente Actual:
            </span>
            <span className="font-mono font-black text-lg text-[#E65100]">
              {formatearMoneda(saldoPendiente)}
            </span>
          </div>
        </div>

        {/* Input Monto a Pagar Hoy */}
        <div>
          <label className="text-xs font-black text-[#2C221E] block mb-1">
            ¿Cuánto paga hoy el cliente? (S/.):
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.50"
              min="0.5"
              max={saldoPendiente}
              placeholder="0.00"
              value={montoAbonoStr}
              onChange={(e) => setMontoAbonoStr(e.target.value)}
              className="w-full h-11 px-3 text-base font-black bg-white border border-stone-300 rounded-xl outline-hidden focus:border-[#E65100]"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setMontoAbonoStr(String(saldoPendiente))}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-orange-100 hover:bg-orange-200 text-[#E65100] text-[11px] font-black cursor-pointer"
            >
              Paga Todo (S/. {saldoPendiente.toFixed(2)})
            </button>
          </div>
        </div>

        {/* Proyección del Saldo Restante */}
        {montoAbonoNum > 0 && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700">Nuevo Saldo que quedará debiendo:</span>
            <span className="font-mono font-black text-sm text-[#E65100]">
              {formatearMoneda(nuevoSaldo)}
            </span>
          </div>
        )}

        {/* Método de Pago */}
        <div>
          <label className="text-xs font-bold text-stone-600 block mb-1">Medio de Cobro:</label>
          <div className="grid grid-cols-2 gap-2">
            {['Efectivo', 'Yape'].map((mp) => (
              <button
                key={mp}
                type="button"
                onClick={() => setMetodoPago(mp)}
                className={`h-10 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                  metodoPago === mp
                    ? 'border-[#E65100] bg-orange-50 text-[#E65100]'
                    : 'border-stone-200 bg-white text-stone-600'
                }`}
              >
                {mp}
              </button>
            ))}
          </div>
        </div>

        {/* Nota o Comprobante */}
        <div>
          <label className="text-[11px] font-bold text-stone-600 block mb-1">
            Nota de Cobranza (Opcional):
          </label>
          <input
            type="text"
            placeholder="Ej. Abono a cuenta de palta Hass / Recibido en efectivo"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            className="w-full h-9 px-3 text-xs bg-white border border-stone-300 rounded-lg outline-hidden"
          />
        </div>

        {/* Acciones */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Marcar como Mora / Incobrable */}
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  `¿Marcar al cliente ${fiado?.nombreDeudor} como 'En Mora / No Pagó'? Se mantendrá la auditoría de los kilos retirados sin saldar.`
                )
              ) {
                onMarcarMora?.(fiado.fiadoId);
                onClose();
              }
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer py-1"
          >
            Marcar en Mora (No pagó)
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button type="button" variant="secondary" onClick={onClose} className="h-10 text-xs">
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={montoAbonoNum <= 0}
              className="h-10 text-xs font-black bg-[#E65100] hover:bg-[#cf4700] text-white"
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
