// src/pages/gastos/RegistrarGastoModal.jsx - Modal para registrar gastos operativos vinculados a un lote de acopio
import { useState, useEffect, useId } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../hooks/useAuth';
import { gastoService } from '../../services/gastoService';
import { formatearMoneda, formatearFecha } from '../../utils/formatters';
import {
  ReceiptText,
  UserCheck,
  Truck,
  PackageCheck,
  MapPin,
  Calendar,
  Layers,
  CheckCircle2,
} from 'lucide-react';

const TIPOS_GASTO = [
  {
    id: 'Seleccionador',
    label: 'Seleccionador',
    etapa: 'Campo / Provincia',
    icon: UserCheck,
    tarifaSugerida: '0.80',
    conceptoBase: 'Selección y calibración en campo',
  },
  {
    id: 'Transporte',
    label: 'Transporte (Flete)',
    etapa: 'Ruta hacia Lima',
    icon: Truck,
    tarifaSugerida: '',
    conceptoBase: 'Flete de transporte hacia almacén Lima',
  },
  {
    id: 'Estibador',
    label: 'Estibador',
    etapa: 'Descarga Lima',
    icon: PackageCheck,
    tarifaSugerida: '0.60',
    conceptoBase: 'Descarga y estiba en almacén de Lima',
  },
  {
    id: 'Cargador',
    label: 'Cargador',
    etapa: 'Descarga Lima',
    icon: PackageCheck,
    tarifaSugerida: '0.60',
    conceptoBase: 'Cuadrilla de cargadores en descarga Lima',
  },
];

export function RegistrarGastoModal({
  isOpen,
  onClose,
  acopios = [],
  acopioInicialId = '',
  onSuccess,
}) {
  const { user } = useAuth();
  const conceptoId = useId();

  // Estados del formulario
  const [acopioSeleccionadoId, setAcopioSeleccionadoId] = useState('');
  const [tipoGasto, setTipoGasto] = useState('Seleccionador');
  const [nombreReceptor, setNombreReceptor] = useState('');
  const [cantidadJabas, setCantidadJabas] = useState('');
  const [tarifaPorJaba, setTarifaPorJaba] = useState('0.80');
  const [montoFlete, setMontoFlete] = useState('');
  const [concepto, setConcepto] = useState('Selección y calibración en campo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sincronizar selección inicial
  useEffect(() => {
    if (isOpen) {
      setError('');
      const defaultId = acopioInicialId || (acopios.length > 0 ? acopios[0].acopioId : '');
      setAcopioSeleccionadoId(defaultId);
      setTipoGasto('Seleccionador');
      setNombreReceptor('');
      setTarifaPorJaba('0.80');
      setMontoFlete('');
      setConcepto('Selección y calibración en campo');
    }
  }, [isOpen, acopioInicialId, acopios]);

  // Obtener objeto del lote seleccionado
  const acopioSeleccionado = acopios.find((a) => a.acopioId === acopioSeleccionadoId);

  // Total de jabas registradas en el acopio
  const totalJabasAcopio =
    acopioSeleccionado?.totalJabas ||
    acopioSeleccionado?.jabas?.reduce((sum, j) => sum + (Number(j.cantidadJabas) || 0), 0) ||
    0;

  // Actualizar cantidad de jabas por defecto al cambiar de acopio
  useEffect(() => {
    if (totalJabasAcopio > 0 && tipoGasto !== 'Transporte') {
      setCantidadJabas(String(totalJabasAcopio));
    }
  }, [acopioSeleccionadoId, totalJabasAcopio, tipoGasto]);

  // Manejar cambio de tipo de gasto
  const handleCambiarTipo = (tipo) => {
    setTipoGasto(tipo.id);
    setConcepto(tipo.conceptoBase);
    if (tipo.id === 'Transporte') {
      setMontoFlete('');
      setTarifaPorJaba('');
    } else {
      setTarifaPorJaba(tipo.tarifaSugerida || '0.60');
      setCantidadJabas(totalJabasAcopio > 0 ? String(totalJabasAcopio) : '');
    }
  };

  // Cálculo del monto total a registrar
  const esTransporte = tipoGasto === 'Transporte';
  const cantNum = Math.round(Number(cantidadJabas)) || 0;
  const tarifaNum = Number(tarifaPorJaba) || 0;
  const montoFleteNum = Number(montoFlete) || 0;

  const montoTotalCalculado = esTransporte
    ? montoFleteNum
    : Number((cantNum * tarifaNum).toFixed(2));

  // Manejador del envío
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!acopioSeleccionadoId) {
      setError('Debe seleccionar obligatoriamente un lote de acopio.');
      return;
    }

    if (!nombreReceptor.trim()) {
      setError(
        esTransporte
          ? 'Ingrese el nombre del chofer o empresa de transporte.'
          : 'Ingrese el nombre del receptor / estibador / seleccionador.'
      );
      return;
    }

    if (esTransporte) {
      if (montoFleteNum <= 0) {
        setError('El costo del flete debe ser mayor a 0.');
        return;
      }
    } else {
      if (cantNum <= 0) {
        setError('La cantidad de jabas debe ser mayor a 0.');
        return;
      }
      if (totalJabasAcopio > 0 && cantNum > totalJabasAcopio) {
        setError(
          `La cantidad de jabas (${cantNum}) no puede superar el total de jabas del lote (${totalJabasAcopio} jabas).`
        );
        return;
      }
      if (tarifaNum <= 0) {
        setError('La tarifa por jaba debe ser mayor a 0.');
        return;
      }
    }

    const usuarioRegistroId =
      user?.usuarioId ||
      user?.superAdminId ||
      '00000000-0000-0000-0000-000000000000';

    try {
      setLoading(true);
      await gastoService.registrarGasto({
        acopioId: acopioSeleccionadoId,
        tipoGasto,
        nombreReceptor: nombreReceptor.trim(),
        cantidadJabas: esTransporte ? totalJabasAcopio : cantNum,
        tarifaPorJaba: esTransporte ? null : tarifaNum,
        montoTotal: montoTotalCalculado,
        usuarioRegistroId,
        concepto: concepto.trim() || undefined,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error al registrar el gasto operativo en el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Gasto Operativo"
      subtitle="Liquidación de costos vinculados obligatoriamente a un lote de acopio"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}

        {/* PASO 1: Selección obligatoria del Acopio */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider">
            1. Seleccionar Lote de Acopio Origen <span className="text-red-500">*</span>
          </label>
          {acopios.length === 0 ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
              No hay lotes de acopio disponibles para registrar gastos operativos.
            </div>
          ) : (
            <select
              value={acopioSeleccionadoId}
              onChange={(e) => setAcopioSeleccionadoId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-semibold text-[#2C221E] focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100] transition-colors"
              required
            >
              <option value="" disabled>
                -- Seleccione un lote de acopio --
              </option>
              {acopios.map((a) => {
                const jabasLote =
                  a.totalJabas ||
                  a.jabas?.reduce((s, j) => s + (Number(j.cantidadJabas) || 0), 0) ||
                  0;
                return (
                  <option key={a.acopioId} value={a.acopioId}>
                    {a.origen} | Encargado: {a.encargadoLote} | Fecha: {formatearFecha(a.fechaCompra)} ({jabasLote} jabas)
                  </option>
                );
              })}
            </select>
          )}

          {/* Tarjeta de Resumen del Acopio seleccionado */}
          {acopioSeleccionado && (
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#E65100] shrink-0" />
                <span className="font-bold text-[#2C221E]">{acopioSeleccionado.origen}</span>
                <span className="text-stone-400">|</span>
                <span className="text-stone-600 font-medium">
                  {acopioSeleccionado.encargadoLote}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-700">
                  <Calendar className="w-3 h-3 text-stone-400" />
                  {formatearFecha(acopioSeleccionado.fechaCompra)}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-100 text-[#E65100] font-black text-[11px]">
                  <Layers className="w-3 h-3" />
                  {totalJabasAcopio} jabas
                </span>
              </div>
            </div>
          )}
        </div>

        {/* PASO 2: Selección del Tipo de Gasto */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider">
            2. Tipo de Gasto Operativo <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TIPOS_GASTO.map((tipo) => {
              const Icon = tipo.icon;
              const activo = tipoGasto === tipo.id;
              return (
                <button
                  key={tipo.id}
                  type="button"
                  onClick={() => handleCambiarTipo(tipo)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[72px] cursor-pointer ${
                    activo
                      ? 'border-[#E65100] bg-orange-50/70 text-[#E65100] shadow-xs'
                      : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Icon className={`w-4 h-4 ${activo ? 'text-[#E65100]' : 'text-stone-400'}`} />
                    {activo && <CheckCircle2 className="w-3.5 h-3.5 text-[#E65100]" />}
                  </div>
                  <div>
                    <span className="font-bold text-xs block leading-tight">{tipo.label}</span>
                    <span className="text-[10px] text-stone-400 font-medium block">
                      {tipo.etapa}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PASO 3: Campos del Gasto */}
        <div className="space-y-3 pt-1 border-t border-stone-100">
          <Input
            label={
              esTransporte
                ? 'Nombre del Chofer / Empresa de Transporte'
                : tipoGasto === 'Seleccionador'
                ? 'Nombre del Seleccionador'
                : 'Nombre del Estibador / Cuadrilla'
            }
            name="nombreReceptor"
            value={nombreReceptor}
            onChange={(e) => setNombreReceptor(e.target.value)}
            placeholder={
              esTransporte
                ? 'Ej. Chofer Luis Ramos / Transportes Del Sur'
                : tipoGasto === 'Seleccionador'
                ? 'Ej. Don Mario Quispe'
                : 'Ej. Cuadrilla Los Tigres / Juan Pérez'
            }
            required
          />

          {esTransporte ? (
            /* Campos específicos de Flete / Transporte */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Costo del Flete Pactado (S/.)"
                name="montoFlete"
                type="number"
                step="0.01"
                min="0.01"
                value={montoFlete}
                onChange={(e) => setMontoFlete(e.target.value)}
                placeholder="0.00"
                required
              />
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col justify-center">
                <span className="text-[11px] text-stone-500 font-medium">Jabas del lote:</span>
                <span className="text-xs font-bold text-[#2C221E]">
                  {totalJabasAcopio} jabas transportadas
                </span>
                {montoFleteNum > 0 && totalJabasAcopio > 0 && (
                  <span className="text-[10px] text-stone-400 mt-0.5">
                    Equivalente: {formatearMoneda(montoFleteNum / totalJabasAcopio)} / jaba
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* Campos específicos de Seleccionador / Estibador / Cargador */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-[#2C221E] uppercase tracking-wider">
                    Cantidad de Jabas
                  </label>
                  {totalJabasAcopio > 0 && (
                    <button
                      type="button"
                      onClick={() => setCantidadJabas(String(totalJabasAcopio))}
                      className="text-[10px] font-bold text-[#E65100] hover:underline cursor-pointer"
                    >
                      Máx ({totalJabasAcopio})
                    </button>
                  )}
                </div>
                <Input
                  name="cantidadJabas"
                  type="number"
                  min="1"
                  max={totalJabasAcopio || undefined}
                  value={cantidadJabas}
                  onChange={(e) => setCantidadJabas(e.target.value)}
                  placeholder={`1 a ${totalJabasAcopio}`}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1">
                  Tarifa por Jaba (S/.)
                </label>
                <Input
                  name="tarifaPorJaba"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={tarifaPorJaba}
                  onChange={(e) => setTarifaPorJaba(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          )}

          {/* Concepto / Observaciones */}
          <div>
            <label
              htmlFor={conceptoId}
              className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1"
            >
              Concepto / Observaciones
            </label>
            <textarea
              id={conceptoId}
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs text-[#2C221E] placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#E65100]/20 focus:border-[#E65100] transition-colors"
              placeholder="Detalle descriptivo del gasto operativo"
            />
          </div>

          {/* Tarjeta de Resumen de Liquidación */}
          <div className="p-3.5 bg-orange-50/50 border border-orange-200/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-stone-600 block">Total a Liquidar</span>
              <span className="text-[10px] text-stone-400">
                {esTransporte
                  ? 'Flete directo pactado'
                  : `${cantNum} jabas × ${formatearMoneda(tarifaNum)}`}
              </span>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-[#E65100]">
                {formatearMoneda(montoTotalCalculado)}
              </span>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            icon={ReceiptText}
            className="bg-[#E65100] hover:bg-[#cf4700] text-white"
          >
            Registrar Gasto Operativo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
