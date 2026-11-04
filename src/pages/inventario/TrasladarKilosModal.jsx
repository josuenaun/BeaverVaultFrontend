// src/pages/inventario/TrasladarKilosModal.jsx - Traslado rápido de Kilos entre Puestos
import { useState, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/forms/Select';
import { Alert } from '../../components/common/Alert';
import { inventarioService } from '../../services/inventarioService';
import { formatearKilos } from '../../utils/formatters';
import { TIPOS_PALTA, MATRIZ_CLASIFICACION } from '../../utils/constants';
import { ArrowRight, Scale, Store, Building2, Snowflake, CheckCircle2 } from 'lucide-react';

export function TrasladarKilosModal({
  isOpen,
  onClose,
  ubicaciones = [],
  inventario = [],
  onSuccess,
}) {
  const ubicacionesLima = useMemo(() => {
    return ubicaciones.filter((u) => u.tipo !== 'Acopio' && u.nombre !== 'Acopio');
  }, [ubicaciones]);

  const [origenId, setOrigenId] = useState(ubicacionesLima[0]?.ubicacionId || '');
  const [destinoId, setDestinoId] = useState(ubicacionesLima[1]?.ubicacionId || '');
  const [tipoPalta, setTipoPalta] = useState('Fuerte');
  const [categoria, setCategoria] = useState('1era');
  const [kilosStr, setKilosStr] = useState('');
  const [motivo, setMotivo] = useState('Reabastecimiento de puesto');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Stock disponible en la ubicación de origen para la variedad/calidad seleccionada
  const stockDisponibleOrigen = useMemo(() => {
    if (!origenId) return 0;
    const itemsUbicacion = inventario.filter(
      (it) => it.ubicacionId === origenId || it.ubicacion?.ubicacionId === origenId
    );
    const item = itemsUbicacion.find(
      (it) => it.tipoPalta === tipoPalta && it.categoria === categoria
    );
    return Number(item?.kilosDisponibles ?? item?._kilosDisponibles) || 0;
  }, [inventario, origenId, tipoPalta, categoria]);

  const kilosNum = parseFloat(kilosStr) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!origenId || !destinoId) {
      setError('Seleccione un puesto de origen y un puesto de destino.');
      return;
    }
    if (origenId === destinoId) {
      setError('El puesto de origen y de destino no pueden ser el mismo.');
      return;
    }
    if (kilosNum <= 0) {
      setError('Ingrese una cantidad de kilos mayor a 0 kg.');
      return;
    }
    if (stockDisponibleOrigen > 0 && kilosNum > stockDisponibleOrigen) {
      setError(
        `La cantidad a trasladar (${kilosNum.toFixed(2)} kg) supera el stock disponible en el origen (${stockDisponibleOrigen.toFixed(2)} kg).`
      );
      return;
    }

    try {
      setLoading(true);
      await inventarioService.trasladarKilos({
        ubicacionOrigenId: origenId,
        ubicacionDestinoId: destinoId,
        tipoPalta,
        categoria,
        kilos: kilosNum,
        motivo,
      });

      onSuccess?.(
        `Se trasladaron con éxito ${kilosNum} kg de Palta ${tipoPalta} (${categoria}) entre puestos.`
      );
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al procesar el traslado de kilos entre puestos.'
      );
    } finally {
      setLoading(false);
    }
  };

  const categoriasDisponibles = MATRIZ_CLASIFICACION[tipoPalta] || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mover Kilos entre Puestos"
      subtitle="Rectificación de balanza o abastecimiento interno"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Origen y Destino */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-stone-50 rounded-2xl border border-stone-200">
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
              Puesto de Origen:
            </label>
            <select
              value={origenId}
              onChange={(e) => setOrigenId(e.target.value)}
              className="w-full h-10 px-3 text-xs font-bold bg-white border border-stone-300 rounded-xl outline-hidden focus:border-[#E65100]"
            >
              {ubicacionesLima.map((u) => (
                <option key={u.ubicacionId} value={u.ubicacionId}>
                  {u.tipo || u.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase block mb-1">
              Puesto de Destino:
            </label>
            <select
              value={destinoId}
              onChange={(e) => setDestinoId(e.target.value)}
              className="w-full h-10 px-3 text-xs font-bold bg-white border border-stone-300 rounded-xl outline-hidden focus:border-[#E65100]"
            >
              {ubicacionesLima.map((u) => (
                <option key={u.ubicacionId} value={u.ubicacionId}>
                  {u.tipo || u.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Variedad y Calidad */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-[#2C221E] block mb-1">Tipo de Palta:</label>
            <select
              value={tipoPalta}
              onChange={(e) => {
                const tp = e.target.value;
                setTipoPalta(tp);
                setCategoria(MATRIZ_CLASIFICACION[tp][0]);
              }}
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
            <label className="text-xs font-bold text-[#2C221E] block mb-1">Calidad:</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full h-10 px-3 text-xs font-bold bg-white border border-stone-300 rounded-xl outline-hidden focus:border-[#E65100]"
            >
              {categoriasDisponibles.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Indicador de Stock en Origen */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
          <span className="font-bold text-emerald-900">
            Stock disponible en origen ({tipoPalta} {categoria}):
          </span>
          <span className="font-mono font-black text-sm text-emerald-800">
            {formatearKilos(stockDisponibleOrigen)}
          </span>
        </div>

        {/* Cantidad a Mover */}
        <div>
          <label className="text-xs font-bold text-[#2C221E] block mb-1">
            Kilogramos a Trasladar:
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.10"
              min="0.1"
              placeholder="0.00"
              value={kilosStr}
              onChange={(e) => setKilosStr(e.target.value)}
              className="w-full h-11 px-3 text-sm font-black bg-white border border-stone-300 rounded-xl outline-hidden focus:border-[#E65100]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">
              kg
            </span>
          </div>
        </div>

        {/* Motivo del traslado */}
        <div>
          <label className="text-[11px] font-bold text-stone-600 block mb-1">
            Motivo de la Reubicación:
          </label>
          <input
            type="text"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej. Corrección por error de puesto / Abastecimiento"
            className="w-full h-9 px-3 text-xs bg-white border border-stone-300 rounded-lg outline-hidden focus:border-[#E65100]"
          />
        </div>

        {/* Botón de Confirmación */}
        <div className="pt-2 flex justify-end gap-2.5">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="h-10 px-4 text-xs font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={kilosNum <= 0}
            className="h-10 px-4 text-xs font-extrabold bg-[#E65100] hover:bg-[#cf4700] text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Confirmar Traslado ({kilosNum.toFixed(2)} kg)
          </Button>
        </div>
      </form>
    </Modal>
  );
}
