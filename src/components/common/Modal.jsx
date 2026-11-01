// src/components/common/Modal.jsx - Diálogo modal accesible y responsive
import { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
  showClose = true,
}) {
  // Manejo de tecla Escape y bloqueo de scroll de fondo
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollBarWidth}px`;

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
    >
      {/* Backdrop clickeable */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Contenedor Modal: En móvil se posiciona como modal inferior (bottom sheet), en desktop como card centrado */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-stone-200 overflow-hidden transform transition-all flex flex-col max-h-[92vh] sm:max-h-[88vh] z-10 animate-in fade-in duration-200`}
      >
        {/* Cabecera del modal */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#2C221E] leading-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 -mr-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Cuerpo del modal con scroll interno suave */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 text-sm text-stone-700">
          {children}
        </div>
      </div>
    </div>
  );
}
