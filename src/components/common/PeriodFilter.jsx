// src/components/common/PeriodFilter.jsx - Barra de filtrado temporal por periodos predefinidos o rango personalizado
import { useState, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { obtenerFechaHoyPeru } from '../../utils/formatters';

// ==========================================
// Lista de periodos contables predefinidos
// ==========================================
const PRESETS = [
  { id: 'TODO', label: 'Histórico Completo' },
  { id: 'HOY', label: 'Hoy' },
  { id: '7DIAS', label: 'Últimos 7 Días' },
  { id: 'ESTE_MES', label: 'Este Mes' },
  { id: 'MES_ANTERIOR', label: 'Mes Anterior' },
  { id: 'CUSTOM', label: 'Personalizado' },
];

// ==========================================
// Componente PeriodFilter
// ==========================================
export function PeriodFilter({ onPeriodChange, initialPreset = 'ESTE_MES' }) {
  // Estados locales de selección de fecha
  const [preset, setPreset] = useState(initialPreset);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mostrarCustom, setMostrarCustom] = useState(false);

  const hoy = obtenerFechaHoyPeru();

  // Efecto: cálculo de fechas según el preset seleccionado
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
      const year = ahora.getFullYear();
      const month = String(ahora.getMonth() + 1).padStart(2, '0');
      const primerDia = `${year}-${month}-01`;
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
      const mesAnteriorDate = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
      const year = mesAnteriorDate.getFullYear();
      const month = String(mesAnteriorDate.getMonth() + 1).padStart(2, '0');
      const primerDia = `${year}-${month}-01`;
      const ultimoDiaNum = new Date(year, mesAnteriorDate.getMonth() + 1, 0).getDate();
      const ultimoDia = `${year}-${month}-${String(ultimoDiaNum).padStart(2, '0')}`;
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
    }
  }, [preset, hoy, onPeriodChange]);

  // Manejador de aplicación de fechas personalizadas
  const aplicarCustom = () => {
    if (!fechaInicio && !fechaFin) return;
    onPeriodChange?.({
      preset: 'CUSTOM',
      fechaInicio,
      fechaFin,
      label: `Personalizado (${fechaInicio || 'Inicio'} a ${fechaFin || 'Hoy'})`,
    });
  };

  // Renderizado de botones de preset e inputs de rango de fecha
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs space-y-3">
      {/* Botones de presets */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <div className="flex items-center gap-1.5 text-stone-500 text-xs font-bold shrink-0 mr-1">
          <Filter className="w-3.5 h-3.5 text-[#E65100]" />
          <span>Periodo:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          {PRESETS.map((p) => {
            const activo = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activo
                    ? 'bg-[#2C221E] text-white shadow-xs'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rango de fechas manual si está en modo personalizado */}
      {mostrarCustom && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-stone-100 animate-in fade-in">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border border-stone-300 rounded-xl focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20 outline-hidden"
              />
            </div>
            <span className="text-stone-400 text-xs">hasta</span>
            <div className="relative flex-1">
              <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs font-medium border border-stone-300 rounded-xl focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20 outline-hidden"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={aplicarCustom}
            className="px-4 py-1.5 rounded-xl bg-[#E65100] text-white text-xs font-bold hover:bg-[#cf4700] transition-colors cursor-pointer shrink-0"
          >
            Aplicar Rango
          </button>
        </div>
      )}
    </div>
  );
}
