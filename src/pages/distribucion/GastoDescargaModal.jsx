// src/pages/distribucion/GastoDescargaModal.jsx - Registro y actualización de descarga en Lima con paleta JOSBECORSA
import { useState, useEffect, useId } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/forms/Select';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';
import { distribucionService } from '../../services/distribucionService';
import { gastoService } from '../../services/gastoService';
import { formatearMoneda } from '../../utils/formatters';
import { DollarSign, PackageCheck, AlertCircle, RefreshCw } from 'lucide-react';

export function GastoDescargaModal({ isOpen, onClose, acopio, gastoExistente, onSuccess }) {
  const { user } = useAuth();
  const conceptoId = useId();

  const totalJabasAcopio =
    acopio?.totalJabas ||
    acopio?.jabas?.reduce((sum, j) => sum + (Number(j.cantidadJabas) || 0), 0) ||
    0;

  const gastoPrevio =
    gastoExistente ||
    acopio?.gastos?.find((g) => g.tipoGasto === 'Estibador' || g.tipoGasto === 'Cargador');

  const esEdicion = Boolean(gastoPrevio?.gastoId);

  const [tipoGasto, setTipoGasto] = useState('Estibador');
  const [nombreReceptor, setNombreReceptor] = useState('');
  const [cantidadJabas, setCantidadJabas] = useState('');
  const [tarifaPorJaba, setTarifaPorJaba] = useState('0.60');
  const [concepto, setConcepto] = useState('Descarga y estiba en almacén de Lima');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      if (gastoPrevio) {
        setTipoGasto(gastoPrevio.tipoGasto || 'Estibador');
        setNombreReceptor(gastoPrevio.nombreReceptor || '');
        setCantidadJabas(gastoPrevio.cantidadJabas ? String(gastoPrevio.cantidadJabas) : String(totalJabasAcopio || ''));
        setTarifaPorJaba(gastoPrevio.tarifaPorJaba ? String(gastoPrevio.tarifaPorJaba) : '0.60');
        setConcepto(gastoPrevio.concepto || 'Descarga y estiba en almacén de Lima');
      } else {
        setTipoGasto('Estibador');
        setNombreReceptor('');
        setCantidadJabas(totalJabasAcopio > 0 ? String(totalJabasAcopio) : '');
        setTarifaPorJaba('0.60');
        setConcepto('Descarga y estiba en almacén de Lima');
      }
    }
  }, [isOpen, acopio, gastoPrevio, totalJabasAcopio]);

  const cant = Number(cantidadJabas) || 0;
  const tarifa = Number(tarifaPorJaba) || 0;
  const montoTotal = Number((cant * tarifa).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!acopio?.acopioId) return;

    if (!nombreReceptor.trim()) {
      setError('Ingrese el nombre del estibador o cuadrilla de descarga.');
      return;
    }
    if (cant <= 0) {
      setError('La cantidad de bultos/jabas debe ser mayor a 0.');
      return;
    }

    // Regla de Negocio: No puede superar la cantidad de jabas registradas en el acopio
    if (totalJabasAcopio > 0 && cant > totalJabasAcopio) {
      setError(
        `Regla de negocio: La cantidad de jabas (${cant}) no puede superar el total de jabas del lote de acopio (${totalJabasAcopio} jabas).`
      );
      return;
    }

    if (tarifa <= 0) {
      setError('La tarifa por bulto descargado debe ser mayor a 0.');
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
        await gastoService.actualizarGasto(gastoPrevio.gastoId, {
          nombreReceptor: nombreReceptor.trim(),
          cantidadJabas: cant,
          tarifaPorJaba: tarifa,
          montoTotal,
          concepto: concepto.trim(),
        });
      } else {
        await distribucionService.registrarDescarga(acopio.acopioId, {
          tipoGasto,
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
        'Error al liquidar la descarga'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={esEdicion ? 'Actualizar Liquidación de Descarga' : 'Recepción en Lima y Liquidación de Descarga'}
      subtitle={`Lote: ${acopio?.origen || 'Origen'} • Encargado: ${acopio?.encargadoLote || '-'} • Total Lote: ${totalJabasAcopio} jabas`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {esEdicion && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Este lote ya tiene descarga guardada. Al confirmar se actualizarán los datos ingresados.
            </span>
          </div>
        )}

        {/* Tarjeta de cálculo en vivo */}
        <div className="p-3.5 bg-[#FAFAFC] border border-[#E8D8C8] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#6D4C41] text-white flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-stone-600 font-semibold">Total Pago Cuadrilla</p>
              <p className="text-base font-extrabold text-[#E65100]">
                {formatearMoneda(montoTotal)}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2 py-1 bg-white border border-stone-200 rounded-md text-[#2C221E]">
            {cant} bultos @ {formatearMoneda(tarifa)}/bulto
          </span>
        </div>

        <Select
          label="Tipo de Personal / Servicio"
          name="tipoGasto"
          value={tipoGasto}
          onChange={(e) => setTipoGasto(e.target.value)}
          options={[
            { value: 'Estibador', label: 'Estibador (Descarga individual / cuadrilla)' },
            { value: 'Cargador', label: 'Cargador (Acomodo interno en puesto / cámara)' },
          ]}
          disabled={esEdicion}
        />

        <Input
          label="Nombre del Estibador o Cuadrilla"
          name="nombreReceptor"
          value={nombreReceptor}
          onChange={(e) => setNombreReceptor(e.target.value)}
          placeholder="Ej. Cuadrilla Los Hermanos - Mercado Mayorista"
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="Cantidad de Bultos / Jabas"
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
            label="Tarifa por Bulto (S/.)"
            name="tarifaPorJaba"
            type="number"
            min="0.01"
            step="0.01"
            value={tarifaPorJaba}
            onChange={(e) => setTarifaPorJaba(e.target.value)}
            placeholder="Ej. 0.60"
            required
          />
        </div>

        <div>
          <label htmlFor={conceptoId} className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1.5">
            Observaciones de la Descarga
          </label>
          <input
            id={conceptoId}
            type="text"
            value={concepto}
            onChange={(e) => setConcepto(e.target.value)}
            placeholder="Ej. Descarga completa de 200 jabas hacia puesto principal"
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
            <PackageCheck className="w-4 h-4 mr-2" />
            {esEdicion ? 'Actualizar Liquidación' : 'Liquidar y Confirmar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
