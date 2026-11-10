// src/components/common/PeriodFilter.jsx - Barra de selección y filtrado por periodos contables y operativos
import { useState, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { obtenerFechaHoyPeru } from '../../utils/formatters';

const PRESETS = [
  { id: 'TODO', label: 'Histórico Completo' },
  { id: 'HOY', label: 'Hoy' },
  { id: '7DIAS', label: 'Últimos 7 Días' },
  { id: 'ESTE_MES', label: 'Este Mes' },
  { id: 'MES_ANTERIOR', label: 'Mes Anterior' },
  { id: 'CUSTOM', label: 'Personalizado' },
];

export function PeriodFilter({ onPeriodChange, initialPreset = 'ESTE_MES' }) {
  const [preset, setPreset] = useState(initialPreset);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mostrarCustom, setMostrarCustom] = useState(false);

  const hoy = obtenerFechaHoyPeru();

  // Calcular fechas al cambiar el preset
  useEffect(() => {
    const ahora = new Date();
    const hoyStr = hoy;

    if (preset === 'TODO') {
      setFechaInicio('');
      setFechaFin('');
      setMostrarCustom(false);
      onPeriodChange?.({
        preset: 'TODO',
        fechaInicio: '',
        fechaFin: '',
        label: 'Histórico Completo',
      });
    } else if (preset === 'HOY') {
      setFechaInicio(hoyStr);
      setFechaFin(hoyStr);
      setMostrarCustom(false);
      onPeriodChange?.({
        preset: 'HOY',
        fechaInicio: hoyStr,
        fechaFin: hoyStr,
        label: `Hoy (${hoyStr})`,
      });
    } else if (preset === '7DIAS') {
      const hace7Dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
      const hace7Str = hace7Dias.toISOString().split('T')[0];
      setFechaInicio(hace7Str);
      setFechaFin(hoyStr);
      setMostrarCustom(false);
      onPeriodChange?.({
        preset: '7DIAS',
        fechaInicio: hace7Str,
        fechaFin: hoyStr,
        label: `Últimos 7 Días (${hace7Str} a ${hoyStr})`,
      });
    } else if (preset === 'ESTE_MES') {
      const primerDia = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      setFechaInicio(primerDia);
      setFechaFin(hoyStr);
      setMostrarCustom(false);
      onPeriodChange?.({
        preset: 'ESTE_MES',
        fechaInicio: primerDia,
        fechaFin: hoyStr,
        label: `Este Mes (${primerDia} a ${hoyStr})`,
      });
    } else if (preset === 'MES_ANTERIOR') {
      const primerDia = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
        .toISOString()
        .split('T')[0];
      const ultimoDia = new Date(ahora.getFullYear(), ahora.getMonth(), 0)
        .toISOString()
        .split('T')[0];
      setFechaInicio(primerDia);
      setFechaFin(ultimoDia);
      setMostrarCustom(false);
      onPeriodChange?.({
        preset: 'MES_ANTERIOR',
        fechaInicio: primerDia,
        fechaFin: ultimoDia,
        label: `Mes Anterior (${primerDia} a ${ultimoDia})`,
      });
    } else if (preset === 'CUSTOM') {
      setMostrarCustom(true);
      // Se mantiene lo que el usuario digite o defaults
      if (!fechaInicio) setFechaInicio(hoyStr);
      if (!fechaFin) setFechaFin(hoyStr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, hoy]);

  // Manejar cambio manual en rango custom
  const handleAplicarCustom = (e) => {
    e.preventDefault();
    if (!fechaInicio || !fechaFin) return;
    onPeriodChange?.({
      preset: 'CUSTOM',
      fechaInicio,
      fechaFin,
      label: `Personalizado (${fechaInicio} a ${fechaFin})`,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-3.5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-stone-700 font-semibold text-xs uppercase tracking-wider">
          <Calendar className="w-4 h-4 text-emerald-700" />
          <span>Periodo Contable / Operativo:</span>
        </div>

        {/* Botones de presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESETS.map((p) => {
            const activo = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activo
                    ? 'bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-900'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selector de Rango Personalizado */}
      {mostrarCustom && (
        <form
          onSubmit={handleAplicarCustom}
          className="pt-2 border-t border-stone-100 flex flex-wrap items-end gap-3 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              max={hoy}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-xs"
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              min={fechaInicio}
              max={hoy}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-stone-300 text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent text-xs"
              required
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium shadow-sm transition-colors text-xs flex items-center gap-1"
          >
            <Filter className="w-3.5 h-3.5" />
            Aplicar Rango
          </button>
        </form>
      )}
    </div>
  );
}
