// src/components/common/Button.jsx - Botón interactivo accesible con soporte para íconos y estados de carga
import { Spinner } from './Spinner';

// ==========================================
// Componente de Botón Reutilizable
// ==========================================
export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) {
  // Clases base para accesibilidad, cursor y transición
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all outline-hidden cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none gap-2';

  // Variantes temáticas corporativas BeaverVault
  const variants = {
    primary:
      'bg-[#E65100] text-white hover:bg-[#cf4700] focus:ring-3 focus:ring-[#E65100]/30 shadow-xs active:scale-[0.98]',
    secondary:
      'bg-[#2C221E] text-white hover:bg-[#3D302A] focus:ring-3 focus:ring-[#2C221E]/25 shadow-xs active:scale-[0.98]',
    brand:
      'bg-[#6D4C41] text-white hover:bg-[#5D3F35] focus:ring-3 focus:ring-[#6D4C41]/25 shadow-xs active:scale-[0.98]',
    outline:
      'border border-stone-300 bg-white text-[#2C221E] hover:bg-[#FAFAFC] hover:border-stone-400 focus:ring-3 focus:ring-[#E65100]/20 shadow-2xs active:scale-[0.98]',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-3 focus:ring-rose-400 shadow-xs active:scale-[0.98]',
  };

  // Tamaños y áreas táctiles mínimas recomendadas
  const sizes = {
    sm: 'px-3.5 py-2 text-xs sm:text-sm min-h-[40px]',
    md: 'px-4.5 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-sm sm:text-base min-h-[48px] sm:min-h-[52px]',
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  // Renderizado del botón interactivo
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${currentVariant} ${currentSize} ${className}`}
      {...props}
    >
      {loading ? (
        <Spinner size="sm" className="mr-1" />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
