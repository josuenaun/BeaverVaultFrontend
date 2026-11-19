// src/components/common/Badge.jsx - Insignias de estado operativo y etiquetas visuales BeaverVault

// ==========================================
// Estilos de variantes y estados del sistema
// ==========================================
const VARIANTES = {
  // Estados oficiales de lote de palta
  Acopio: 'bg-orange-50 text-[#E65100] border-orange-200 font-bold',
  En_Transito: 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
  Recibido_Lima: 'bg-sky-50 text-[#0288D1] border-sky-300 font-bold',
  Liquidado: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
  Finalizado: 'bg-stone-100 text-[#2C221E] border-stone-300 font-bold',

  // Variantes generales
  primary: 'bg-[#E65100]/10 text-[#E65100] border-[#E65100]/30 font-bold',
  brand: 'bg-[#6D4C41]/10 text-[#6D4C41] border-[#6D4C41]/30 font-bold',
  secondary: 'bg-[#0288D1]/10 text-[#0288D1] border-[#0288D1]/30 font-bold',
  neutral: 'bg-stone-100 text-[#2C221E] border-stone-200 font-bold',
  kraft: 'bg-[#E8D8C8]/60 text-[#2C221E] border-[#E8D8C8] font-bold',
  danger: 'bg-rose-50 text-rose-800 border-rose-200 font-bold',
};

// ==========================================
// Etiquetas legibles para estados de lote
// ==========================================
const LABELS = {
  Acopio: 'En Acopio',
  En_Transito: 'En Tránsito',
  Recibido_Lima: 'Recibido en Lima',
  Liquidado: 'Liquidado',
  Finalizado: 'Finalizado',
};

// ==========================================
// Componente Badge
// ==========================================
export function Badge({ variant = 'neutral', status, children, size = 'md', className = '' }) {
  const clave = status || variant;
  const clasesEstilo = VARIANTES[clave] || VARIANTES.neutral;
  const texto = children || (status && LABELS[status]) || status;

  // Escala de tamaños
  const clasesTamano = {
    sm: 'text-xs px-2.5 py-0.5 font-bold',
    md: 'text-xs sm:text-sm px-3 py-1 font-bold',
    lg: 'text-sm sm:text-base px-3.5 py-1.5 font-extrabold',
  }[size] || 'text-xs px-3 py-1 font-bold';

  // Renderizado del badge con punto indicador de estado
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border tracking-wide whitespace-nowrap shadow-2xs ${clasesTamano} ${clasesEstilo} ${className}`}
    >
      <span className="w-2 h-2 rounded-full bg-current opacity-90 shrink-0" />
      {texto}
    </span>
  );
}
