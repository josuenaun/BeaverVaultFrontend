// src/components/common/Badge.jsx - Insignias de estado operativas con paleta JOSBECORSA

const VARIANTES = {
  // Estados oficiales de Lote de Palta
  Acopio: 'bg-orange-50 text-[#E65100] border-orange-200 font-bold',
  En_Transito: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
  Recibido_Lima: 'bg-sky-50 text-[#0288D1] border-sky-300 font-bold',
  Liquidado: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
  Finalizado: 'bg-stone-100 text-[#2C221E] border-stone-300 font-bold',

  // Variantes generales del sistema
  primary: 'bg-[#E65100]/10 text-[#E65100] border-[#E65100]/30 font-bold',
  brand: 'bg-[#6D4C41]/10 text-[#6D4C41] border-[#6D4C41]/30 font-bold',
  secondary: 'bg-[#0288D1]/10 text-[#0288D1] border-[#0288D1]/30 font-bold',
  neutral: 'bg-stone-100 text-[#2C221E] border-stone-200 font-bold',
  kraft: 'bg-[#E8D8C8]/60 text-[#2C221E] border-[#E8D8C8] font-bold',
  danger: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
};

const LABELS = {
  Acopio: 'En Acopio',
  En_Transito: 'En Tránsito',
  Recibido_Lima: 'Recibido en Lima',
  Liquidado: 'Liquidado',
  Finalizado: 'Finalizado',
};

export function Badge({ variant = 'neutral', status, children, size = 'md', className = '' }) {
  const clave = status || variant;
  const clasesEstilo = VARIANTES[clave] || VARIANTES.neutral;
  const texto = children || (status && LABELS[status]) || status;

  const clasesTamano = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size] || 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide whitespace-nowrap shadow-2xs ${clasesTamano} ${clasesEstilo} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {texto}
    </span>
  );
}
