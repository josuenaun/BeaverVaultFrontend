// src/components/common/Button.jsx - Botón reutilizable con paleta corporativa JOSBECORSA
import { Spinner } from './Spinner';

export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all outline-hidden cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none';

  const variants = {
    // Primario: Naranja Construcción #E65100
    primary:
      'bg-[#E65100] text-white hover:bg-[#cf4700] focus:ring-2 focus:ring-[#E65100]/40 shadow-xs active:scale-[0.98]',
    // Secundario: Marrón Carbón #2C221E
    secondary:
      'bg-[#2C221E] text-white hover:bg-[#3D302A] focus:ring-2 focus:ring-[#2C221E]/30 active:scale-[0.98]',
    // Identidad Marca: Marrón Castor #6D4C41
    brand:
      'bg-[#6D4C41] text-white hover:bg-[#5D3F35] focus:ring-2 focus:ring-[#6D4C41]/30 active:scale-[0.98]',
    // Outline: Fondo Blanco / Marfil con borde y texto #2C221E
    outline:
      'border border-stone-300 bg-white text-[#2C221E] hover:bg-[#FAFAFC] hover:border-stone-400 focus:ring-2 focus:ring-[#E65100]/20',
    // Danger: Rojo
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 focus:ring-2 focus:ring-rose-400 active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    md: 'px-4 py-2.5 text-xs sm:text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-sm sm:text-base min-h-[48px]',
  };

  const currentVariant = variants[variant] || variants.primary;
  const currentSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${currentVariant} ${currentSize} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {children}
    </button>
  );
}
