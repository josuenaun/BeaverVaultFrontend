// src/components/common/Pagination.jsx - Componente de paginación responsivo BeaverVault (10 items/página)
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (totalItems <= pageSize) {
    return null; // No renderizar barra si cabe en una sola página
  }

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generar rango de números de página visibles
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

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-stone-200 text-xs ${className}`}
    >
      {/* Información del rango de registros */}
      <div className="text-stone-500 font-medium text-center sm:text-left">
        Mostrando <span className="font-bold text-[#2C221E]">{startItem}</span> a{' '}
        <span className="font-bold text-[#2C221E]">{endItem}</span> de{' '}
        <span className="font-bold text-[#2C221E]">{totalItems}</span> registros
      </div>

      {/* Controles de Navegación */}
      <div className="flex items-center gap-1 select-none">
        {/* Primera página */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Página anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Números de página */}
        <div className="flex items-center gap-1">
          {getPageNumbers().map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => onPageChange(num)}
              className={`min-w-[32px] h-8 px-2 rounded-lg font-bold text-xs transition-all ${
                currentPage === num
                  ? 'bg-[#E65100] text-white shadow-xs'
                  : 'border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Página siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Última página */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
