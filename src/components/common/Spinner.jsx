// src/components/common/Spinner.jsx - Indicador de carga accesible
export function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const selectedSize = sizes[size] || sizes.md;

  return (
    <div
      role="status"
      className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${selectedSize} ${className}`}
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
