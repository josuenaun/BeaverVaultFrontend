// src/components/common/Spinner.jsx - Indicador visual animado de carga para procesos en segundo plano

// ==========================================
// Componente Spinner Accesible
// ==========================================
export function Spinner({ size = 'md', className = '' }) {
  // Clases dimensionales de spinner
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-5 h-5 border-2',
    lg: 'w-8 h-8 border-3',
  };

  const selectedSize = sizes[size] || sizes.md;

  // Renderizado del elemento circular giratorio
  return (
    <div
      role="status"
      className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${selectedSize} ${className}`}
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
