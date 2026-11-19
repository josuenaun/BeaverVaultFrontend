// src/components/common/Pagination.jsx - Paginador responsivo de listas y tablas de datos (10 elementos por página)
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

// ==========================================
// Componente de Paginación Accesible
// ==========================================
export function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  // Cálculo de páginas totales
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // No renderizar barra de paginación si cabe en una única página
  if (totalItems <= pageSize) {
    return null;
  }

  // Rango de índices actuales
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Cálculo del rango de números de página visibles
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Renderizado de la barra de paginación
  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 bg-white border-t border-stone-200 text-xs sm:text-sm ${className}`}
    >
      {/* Información del rango de registros */}
      <div className="text-stone-600 font-medium text-center sm:text-left">
        Mostrando <span className="font-extrabold text-[#2C221E]">{startItem}</span> a{' '}
        <span className="font-extrabold text-[#2C221E]">{endItem}</span> de{' '}
        <span className="font-extrabold text-[#2C221E]">{totalItems}</span> registros
      </div>

      {/* Controles de navegación de página */}
      <div className="flex items-center gap-1.5 select-none flex-wrap justify-center">
        {/* Ir a primera página */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center"
          title="Primera página"
          aria-label="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Ir a página anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center"
          title="Página anterior"
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Botones numéricos de página */}
        {getPageNumbers().map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            className={`min-h-[40px] min-w-[40px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              currentPage === pageNum
                ? 'bg-[#E65100] text-white shadow-xs'
                : 'border border-stone-300 text-stone-700 hover:bg-stone-100'
            }`}
            aria-current={currentPage === pageNum ? 'page' : undefined}
          >
            {pageNum}
          </button>
        ))}

        {/* Ir a página siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center"
          title="Página siguiente"
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Ir a última página */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="min-h-[40px] min-w-[40px] p-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center"
          title="Última página"
          aria-label="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
