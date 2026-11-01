// src/pages/acopio/GastoSeleccionadorModal.jsx - Registro y actualización de pago a seleccionadores por jaba
import { useState, useEffect, useId } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';
import { acopioService } from '../../services/acopioService';
import { gastoService } from '../../services/gastoService';
import { formatearMoneda } from '../../utils/formatters';
import { UserCheck, DollarSign, AlertCircle, RefreshCw } from 'lucide-react';

export function GastoSeleccionadorModal({ isOpen, onClose, acopio, gastoExistente, onSuccess }) {
  const { user } = useAuth();
  const conceptoId = useId();
  
  // Calcular total de jabas del lote registrado
  const totalJabasAcopio =
    acopio?.totalJabas ||
    acopio?.jabas?.reduce((sum, j) => sum + (Number(j.cantidadJabas) || 0), 0) ||
    0;

  // Detectar si el acopio ya tiene un gasto de seleccionador previo
  const gastoPrevio =
    gastoExistente ||
    acopio?.gastos?.find((g) => g.tipoGasto === 'Seleccionador');

  const esEdicion = Boolean(gastoPrevio?.gastoId);

  const [nombreReceptor, setNombreReceptor] = useState('');
  const [cantidadJabas, setCantidadJabas] = useState('');
  const [tarifaPorJaba, setTarifaPorJaba] = useState('0.80');
  const [concepto, setConcepto] = useState('Selección y calibración en campo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sincronizar formulario cada vez que se abre el modal o cambia el acopio
  useEffect(() => {
    if (isOpen) {
      setError('');
      if (gastoPrevio) {
        setNombreReceptor(gastoPrevio.nombreReceptor || '');
        setCantidadJabas(gastoPrevio.cantidadJabas ? String(gastoPrevio.cantidadJabas) : String(totalJabasAcopio || ''));
        setTarifaPorJaba(gastoPrevio.tarifaPorJaba ? String(gastoPrevio.tarifaPorJaba) : '0.80');
        setConcepto(gastoPrevio.concepto || 'Selección y calibración en campo');
      } else {
        setNombreReceptor('');
        setCantidadJabas(totalJabasAcopio > 0 ? String(totalJabasAcopio) : '');
        setTarifaPorJaba('0.80');
        setConcepto('Selección y calibración en campo');
      }
    }
  }, [isOpen, acopio, gastoPrevio, totalJabasAcopio]);

  // Total proyectado a liquidar
  const cant = Number(cantidadJabas) || 0;
  const tarifa = Number(tarifaPorJaba) || 0;
  const totalPagar = Number((cant * tarifa).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acopio?.acopioId) return;

    if (!nombreReceptor.trim()) {
      setError('Ingrese el nombre del seleccionador.');
      return;
    }
    if (cant <= 0) {
      setError('La cantidad de jabas seleccionadas debe ser mayor a 0.');
      return;
    }

    // Regla de Negocio: La cantidad de jabas no puede superar el total del acopio
    if (totalJabasAcopio > 0 && cant > totalJabasAcopio) {
      setError(
        `Regla de negocio: La cantidad de jabas asignadas (${cant}) no puede superar el total de jabas registradas en el acopio (${totalJabasAcopio} jabas).`
      );
      return;
    }

    if (tarifa <= 0) {
      setError('La tarifa por jaba debe ser mayor a 0.');
      return;
    }

    const usuarioRegistroId =
      user?.usuarioId ||
      user?.superAdminId ||
      '00000000-0000-0000-0000-000000000000';

    try {
      setLoading(true);
      setError('');

      if (esEdicion && gastoPrevio?.gastoId) {
        // Modo UPDATE (Sobrescritura del registro existente)
        await gastoService.actualizarGasto(gastoPrevio.gastoId, {
          nombreReceptor: nombreReceptor.trim(),
          cantidadJabas: cant,
          tarifaPorJaba: tarifa,
          montoTotal: totalPagar,
          concepto: concepto.trim(),
        });
      } else {
        // Modo CREATE
        await acopioService.registrarGastoSeleccionador(acopio.acopioId, {
          nombreReceptor: nombreReceptor.trim(),
          cantidadJabas: cant,
          tarifaPorJaba: tarifa,
          usuarioRegistroId,
          concepto: concepto.trim(),
        });
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al guardar la información del seleccionador.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Modificar Seleccionador Guardado' : 'Pago a Seleccionador en Campo'}
      subtitle={`Lote: ${acopio?.origen || 'Origen'} • Encargado: ${acopio?.encargadoLote || '-'} • Total Lote: ${totalJabasAcopio} jabas`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {esEdicion && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Este lote ya tiene un seleccionador guardado. Al confirmar se sobrescribirán los datos corregidos.
            </span>
          </div>
        )}

        {/* Tarjeta de resumen de liquidación */}
        <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#E65100] text-white flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-600 font-semibold">Total Liquidación</p>
              <p className="text-base font-extrabold text-[#E65100]">
                {formatearMoneda(totalPagar)}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2 py-1 bg-white border border-orange-200 rounded-md text-stone-700">
            {cant} jabas @ {formatearMoneda(tarifa)}/jaba
          </span>
        </div>

        <Input
          label="Nombre del Seleccionador"
          name="nombreReceptor"
          value={nombreReceptor}
          onChange={(e) => setNombreReceptor(e.target.value)}
          placeholder="Ej. Juan Pérez - Cuadrilla Huaral"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="Cantidad de Jabas"
              name="cantidadJabas"
              type="number"
              min="1"
              max={totalJabasAcopio > 0 ? totalJabasAcopio : undefined}
              step="1"
              value={cantidadJabas}
              onChange={(e) => setCantidadJabas(e.target.value)}
              placeholder={`Máx. ${totalJabasAcopio}`}
              required
            />
            {totalJabasAcopio > 0 && (
              <p className="text-[10px] text-stone-500 mt-1 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3 h-3 text-[#E65100]" />
                Tope máximo permitido: {totalJabasAcopio} jabas
              </p>
            )}
          </div>

          <Input
            label="Tarifa por Jaba (S/.)"
            name="tarifaPorJaba"
            type="number"
            min="0.01"
            step="0.01"
            value={tarifaPorJaba}
            onChange={(e) => setTarifaPorJaba(e.target.value)}
            placeholder="Ej. 0.80"
            required
          />
        </div>

        <div>
          <label htmlFor={conceptoId} className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1.5">
            Concepto / Observaciones
          </label>
          <input
            id={conceptoId}
            type="text"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej. Selección y calibración de palta Fuerte"
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
            <UserCheck className="w-4 h-4 mr-2" />
            {esEdicion ? 'Actualizar Seleccionador' : 'Confirmar Pago'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
