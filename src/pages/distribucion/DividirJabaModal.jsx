// src/pages/distribucion/DividirJabaModal.jsx - Separación y fraccionamiento flexible de jabas con recálculo de kilos
import { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/forms/Select';
import { Alert } from '../../components/common/Alert';
import { distribucionService } from '../../services/distribucionService';
import { ventaService } from '../../services/ventaService';
import { formatearKilos, obtenerEstiloPastel } from '../../utils/formatters';
import { Split, ArrowRight, Scale, Info, Layers } from 'lucide-react';

export function DividirJabaModal({ isOpen, onClose, jaba, ubicaciones = [], onSuccess }) {
  const cantTotal = Number(jaba?.cantidadJabas) || 0;
  const pesoTotal = Number(jaba?.pesoBruto) || 0;
  const pesoPromedio = cantTotal > 0 ? pesoTotal / cantTotal : 0;

  const [cantidadSeparar, setCantidadSeparar] = useState('1');
  const [pesoSeparado, setPesoSeparado] = useState('');
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estilo pastel de la jaba a dividir
  const estiloPastel = obtenerEstiloPastel(jaba?.codigoColor);

  useEffect(() => {
    if (isOpen && jaba) {
      setError('');
      // Inicializar con 1 jaba a separar y su peso proporcional
      const cantInicial = 1;
      setCantidadSeparar(String(cantInicial));
      const pesoInicial = Number((pesoPromedio * cantInicial).toFixed(2));
      setPesoSeparado(String(pesoInicial));

      // Seleccionar primera ubicación diferente a la actual (excluyendo Acopio)
      const destinosDisponibles = ubicaciones
        .filter((u) => u.tipo !== 'Acopio' && u.nombre !== 'Acopio')
        .filter((u) => u.ubicacionId !== jaba.ubicacionId);
      if (destinosDisponibles.length > 0) {
        setUbicacionDestinoId(destinosDisponibles[0].ubicacionId);
      } else if (ubicaciones.length > 0) {
        const fallback = ubicaciones.find((u) => u.tipo !== 'Acopio' && u.nombre !== 'Acopio');
        setUbicacionDestinoId(fallback?.ubicacionId || ubicaciones[0].ubicacionId);
      }
    }
  }, [isOpen, jaba, pesoPromedio, ubicaciones]);

  // Manejar cambio de cantidad de jabas con cálculo proporcional automático
  const handleCantidadChange = (val) => {
    setCantidadSeparar(val);
    const cantNum = parseInt(val, 10);
    if (!isNaN(cantNum) && cantNum > 0 && cantNum < cantTotal) {
      const calcKilos = Number((pesoPromedio * cantNum).toFixed(2));
      setPesoSeparado(String(calcKilos));
    }
  };

  const cantSepNum = parseInt(cantidadSeparar, 10) || 0;
  const pesoSepNum = parseFloat(pesoSeparado) || 0;

  // Cálculos restantes
  const cantRestante = cantTotal - cantSepNum;
  const pesoRestante = Number((pesoTotal - pesoSepNum).toFixed(2));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jaba?.jabaId) return;

    if (cantSepNum < 1 || cantSepNum >= cantTotal) {
      setError(
        `La cantidad a separar debe ser al menos 1 y menor al total disponible (${cantTotal} jabas).`
      );
      return;
    }

    if (pesoSepNum <= 0 || pesoSepNum >= pesoTotal) {
      setError(
        `Los kilos separados deben ser mayores a 0 y menores al total (${formatearKilos(pesoTotal)}).`
      );
      return;
    }

    if (!ubicacionDestinoId) {
      setError('Seleccione una ubicación física de destino para las jabas separadas.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const respDivision = await distribucionService.dividirJaba(jaba.jabaId, {
        cantidadSeparar: cantSepNum,
        pesoSeparado: pesoSepNum,
        ubicacionId: ubicacionDestinoId,
      });

      // Asegurar disponibilidad de kilos en el inventario del puesto destino
      const nuevaJabaId =
        respDivision?.nuevaJaba?.jabaId ||
        respDivision?.jabaSeparada?.jabaId ||
        respDivision?.jabaId;
      if (nuevaJabaId && ubicacionDestinoId) {
        try {
          await ventaService.transformarJabaAKilos(nuevaJabaId, ubicacionDestinoId);
        } catch {
          // Continuar fluido
        }
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al fraccionar y reubicar las jabas.'
      );
    } finally {
      setLoading(false);
    }
  };

  const opcionesUbicacion = ubicaciones
    .filter((u) => u.tipo !== 'Acopio' && u.nombre !== 'Acopio')
    .map((u) => ({
      value: u.ubicacionId,
      label: `${u.tipo || u.nombre}${u.ubicacionId === jaba?.ubicacionId ? ' (Ubicación Actual)' : ''}`,
    }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dividir / Separar Grupo de Jabas"
      subtitle={`Lote: ${jaba?.acopioOrigen || 'Origen'} • Palta ${jaba?.tipoPalta || ''} (${jaba?.categoria || ''})`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Resumen del Grupo Original con Color Pastel */}
        <div
          style={{
            backgroundColor: estiloPastel.backgroundColor,
            borderColor: estiloPastel.borderColor,
          }}
          className="p-3.5 rounded-xl border space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase text-[#6D4C41]">
              Grupo Original en Balanza
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border flex items-center gap-1 shadow-2xs"
              style={{ borderColor: estiloPastel.borderColor }}
            >
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: estiloPastel.dotColor }}
              />
              {jaba?.codigoColor}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs bg-white/80 p-2 rounded-lg border border-black/5">
            <span className="font-bold text-[#2C221E] flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-stone-500" />
              Total: {cantTotal} jabas
            </span>
            <span className="font-extrabold text-[#E65100]">
              {formatearKilos(pesoTotal)}
            </span>
            <span className="text-stone-500 font-semibold">
              Promedio: {pesoPromedio.toFixed(2)} kg/jaba
            </span>
          </div>
        </div>

        {/* Campos de Entrada: Cantidad de Jabas y Kilos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Input
              label="¿Cuántas Jabas separar?"
              name="cantidadSeparar"
              type="number"
              min="1"
              max={cantTotal - 1}
              step="1"
              value={cantidadSeparar}
              onChange={(e) => handleCantidadChange(e.target.value)}
              placeholder={`Máx. ${cantTotal - 1}`}
              required
            />
            <p className="text-[10px] text-stone-500 mt-1 font-semibold">
              Rango permitido: 1 a {cantTotal - 1} jabas
            </p>
          </div>

          <div>
            <Input
              label="Kilos a Separar (kg)"
              name="pesoSeparado"
              type="number"
              min="0.01"
              max={Number((pesoTotal - 0.01).toFixed(2))}
              step="0.01"
              value={pesoSeparado}
              onChange={(e) => setPesoSeparado(e.target.value)}
              placeholder="Ej. 120.50"
              required
            />
            <p className="text-[10px] text-stone-500 mt-1 font-semibold flex items-center gap-1">
              <Scale className="w-3 h-3 text-[#E65100]" />
              Calculado automáticamente (editable si se repesó)
            </p>
          </div>
        </div>

        {/* Selector de Destino */}
        <Select
          label="Enviar las jabas separadas a:"
          name="ubicacionDestinoId"
          value={ubicacionDestinoId}
          onChange={(e) => setUbicacionDestinoId(e.target.value)}
          options={opcionesUbicacion}
          required
        />

        {/* Previsualización del Resultado de la División */}
        <div className="p-3 bg-[#FAFAFC] border border-[#E8D8C8] rounded-xl space-y-2">
          <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">
            Previsualización de la Separación:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Grupo Remanente */}
            <div className="p-2.5 bg-white rounded-lg border border-stone-200">
              <span className="text-[10px] text-stone-500 uppercase font-bold block">
                Se Queda en Origen:
              </span>
              <p className="text-sm font-extrabold text-[#2C221E] mt-0.5">
                {cantRestante > 0 ? cantRestante : 0} jabas
              </p>
              <p className="text-xs font-bold text-[#E65100]">
                {formatearKilos(pesoRestante > 0 ? pesoRestante : 0)}
              </p>
            </div>

            {/* Nuevo Grupo Separado */}
            <div className="p-2.5 bg-orange-50/70 rounded-lg border border-orange-200">
              <span className="text-[10px] text-[#E65100] uppercase font-bold block flex items-center gap-1">
                <ArrowRight className="w-3 h-3" />
                Se Traslada a Destino:
              </span>
              <p className="text-sm font-extrabold text-[#2C221E] mt-0.5">
                {cantSepNum} jabas
              </p>
              <p className="text-xs font-bold text-[#E65100]">
                {formatearKilos(pesoSepNum)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-stone-500 pt-1">
            <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>Regla JOSBECORSA: La suma total de kilos ({formatearKilos(pesoTotal)}) se preserva al 100% sin merma.</span>
          </div>
        </div>

        {/* Botones de Acción */}
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
            disabled={cantSepNum < 1 || cantSepNum >= cantTotal}
            className="w-full sm:w-auto bg-[#E65100] hover:bg-[#cf4700] text-white min-h-[44px]"
          >
            <Split className="w-4 h-4 mr-2" />
            Confirmar y Separar Jabas
          </Button>
        </div>
      </form>
    </Modal>
  );
}
