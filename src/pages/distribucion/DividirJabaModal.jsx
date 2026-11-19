// src/pages/distribucion/DividirJabaModal.jsx - Separación y fraccionamiento de grupos de jabas con recálculo proporcional de peso
// ==========================================
// 1. Importaciones y Dependencias
// ==========================================
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

// ==========================================
// 2. Componente Modal DividirJabaModal
// ==========================================
export function DividirJabaModal({ isOpen, onClose, jaba, ubicaciones = [], onSuccess }) {
  // ----------------------------------------
  // 3. Cálculos Proporcionales de Jabas y Peso
  // ----------------------------------------
  const cantTotal = Number(jaba?.cantidadJabas) || 0;
  const pesoTotal = Number(jaba?.pesoBruto) || 0;
  const pesoPromedio = cantTotal > 0 ? pesoTotal / cantTotal : 0;

  // Estados locales de fraccionamiento
  const [cantidadSeparar, setCantidadSeparar] = useState('1');
  const [pesoSeparado, setPesoSeparado] = useState('');
  const [ubicacionDestinoId, setUbicacionDestinoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estilo pastel de la jaba a dividir
  const estiloPastel = obtenerEstiloPastel(jaba?.codigoColor);

  // ----------------------------------------
  // 4. Efecto de Inicialización de Valores
  // ----------------------------------------
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

  // ----------------------------------------
  // 5. Manejador de Fraccionamiento (Submit)
  // ----------------------------------------
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
      icon={Split}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* Resumen del Grupo Original con Color Pastel */}
        <div
          style={{
            backgroundColor: estiloPastel.backgroundColor,
            borderColor: estiloPastel.borderColor,
          }}
          className="p-4 rounded-xl border space-y-2.5 shadow-2xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black uppercase text-[#6D4C41] tracking-wide">
              Grupo Original en Balanza
            </span>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white border flex items-center gap-1.5 shadow-2xs"
              style={{ borderColor: estiloPastel.borderColor }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: estiloPastel.dotColor }}
              />
              <span className="font-mono">{jaba?.codigoColor}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm bg-white/90 p-3 rounded-xl border border-black/5">
            <span className="font-bold text-[#2C221E] flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-stone-500" />
              Total: {cantTotal} jabas
            </span>
            <span className="font-black text-base text-[#E65100]">
              {formatearKilos(pesoTotal)}
            </span>
            <span className="text-stone-600 font-semibold">
              Promedio: {pesoPromedio.toFixed(2)} kg/jaba
            </span>
          </div>
        </div>

        {/* Campos de Entrada: Cantidad de Jabas y Kilos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
            <p className="text-xs text-stone-500 mt-1 font-medium">
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
            <p className="text-xs text-stone-500 mt-1 font-medium flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-[#E65100] shrink-0" />
              Calculado automáticamente
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
        <div className="p-4 bg-[#FAFAFC] border border-stone-200 rounded-xl space-y-2.5">
          <p className="text-xs font-bold text-stone-600 uppercase tracking-wider">
            Previsualización del resultado:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Grupo Remanente */}
            <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs">
              <span className="text-xs text-stone-500 font-bold block">
                Se Queda en Origen:
              </span>
              <p className="text-base font-black text-[#2C221E] mt-1">
                {cantRestante > 0 ? cantRestante : 0} jabas
              </p>
              <p className="text-sm font-black text-[#E65100]">
                {formatearKilos(pesoRestante > 0 ? pesoRestante : 0)}
              </p>
            </div>

            {/* Nuevo Grupo Separado */}
            <div className="p-3 bg-orange-50/80 rounded-xl border border-orange-200 shadow-2xs">
              <span className="text-xs text-[#E65100] font-bold flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5" />
                Se Traslada a Destino:
              </span>
              <p className="text-base font-black text-[#2C221E] mt-1">
                {cantSepNum} jabas
              </p>
              <p className="text-sm font-black text-[#E65100]">
                {formatearKilos(pesoSepNum)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-600 pt-1">
            <Info className="w-4 h-4 text-stone-400 shrink-0" />
            <span>Regla BeaverVault: La suma total de kilos ({formatearKilos(pesoTotal)}) se preserva al 100% sin merma.</span>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="pt-3 border-t border-stone-200 flex flex-col-reverse sm:flex-row gap-2.5 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto min-h-11"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={cantSepNum < 1 || cantSepNum >= cantTotal}
            className="w-full sm:w-auto bg-[#E65100] hover:bg-[#cf4700] text-white min-h-11"
          >
            <Split className="w-4 h-4 mr-1.5" />
            Confirmar y Separar Jabas
          </Button>
        </div>
      </form>
    </Modal>
  );
}
