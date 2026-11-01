// src/pages/ventas/TransformarKilosModal.jsx - Transformación 1:1 de Jabas a Kilos (¡SIN MERMA!)
import { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/forms/Select';
import { Alert } from '../../components/common/Alert';
import { ventaService } from '../../services/ventaService';
import { formatearKilos } from '../../utils/formatters';
import { Scale, ShieldAlert, CheckCircle2 } from 'lucide-react';

export function TransformarKilosModal({ isOpen, onClose, jaba, ubicaciones = [], onSuccess }) {
  const [ubicacionId, setUbicacionId] = useState(
    ubicaciones.find((u) => u.tipo === 'Puesto Principal' || u.nombre === 'Puesto Principal')?.ubicacionId ||
    ubicaciones[0]?.ubicacionId ||
    ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const peso = Number(jaba?.pesoBruto) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jaba?.jabaId) return;

    if (!ubicacionId) {
      setError('Seleccione la ubicación donde se acreditarán los kilogramos.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await ventaService.transformarJabaAKilos(jaba.jabaId, ubicacionId);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al transformar las jabas a kilos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convertir Jabas a Stock en Kilos"
      subtitle={`Palta ${jaba?.tipoPalta || ''} - Calidad ${jaba?.categoria || ''}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Banner de REGLA DE ORO JOSBECORSA */}
        <div className="p-4 rounded-xl bg-[#6D4C41] text-white border border-[#E65100]/60 space-y-2">
          <div className="flex items-center gap-2 text-[#E8D8C8] font-extrabold text-xs">
            <ShieldAlert className="w-5 h-5 text-[#E65100] shrink-0" />
            <span>REGLA DE ORO JOSBECORSA: ¡NO HAY MERMA!</span>
          </div>
          <p className="text-xs text-stone-200 leading-relaxed">
            El <strong>100% del peso bruto ({formatearKilos(peso)})</strong> de este lote de jabas se convertirá íntegramente a kilogramos netos disponibles en balanza para su venta inmediata.
          </p>
        </div>

        {/* Tarjeta de Equivalencia 1:1 */}
        <div className="p-4 bg-[#FAFAFC] border border-[#E8D8C8] rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C221E]">
              Conversión Directa 1:1
            </span>
            <p className="text-xl font-black text-[#E65100]">
              +{formatearKilos(peso)} netos
            </p>
            <span className="text-[11px] text-stone-600">
              Equivalente a {jaba?.cantidadJabas || 1} jabas color {jaba?.codigoColor || '-'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E65100] text-white flex items-center justify-center font-bold shadow-xs">
            <Scale className="w-6 h-6" />
          </div>
        </div>

        {/* Selector de Ubicación */}
        <Select
          label="Ubicación de Destino (Inventario)"
          name="ubicacionId"
          value={ubicacionId}
          onChange={(e) => setUbicacionId(e.target.value)}
          options={ubicaciones.map((u) => ({
            value: u.ubicacionId,
            label: `${u.tipo || u.nombre} (${u.nombre})`,
          }))}
          required
          helperText="Seleccione el puesto de venta o cámara donde se registrará el stock"
        />

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
            className="w-full sm:w-auto bg-[#E65100] hover:bg-[#cf4700] text-white font-bold min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Confirmar Conversión (100% Kilos)
          </Button>
        </div>
      </form>
    </Modal>
  );
}
