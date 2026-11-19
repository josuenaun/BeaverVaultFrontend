// src/components/common/Modal.jsx - Ventana modal accesible con cierre en Escape, bloqueo de scroll y diseño responsivo
import { useEffect } from 'react';
import { X } from 'lucide-react';

// ==========================================
// Componente Modal Accesible
// ==========================================
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  maxWidth = 'max-w-xl',
  showClose = true,
}) {
  // Manejo de tecla Escape y bloqueo de desplazamiento del documento
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

  // Renderizado del diálogo modal centrado o en bottom-sheet móvil
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-200"
    >
      {/* Fondo oscuro para cerrar al hacer clic afuera */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Contenedor principal de la tarjeta modal */}
      <div
        className={`relative w-full ${maxWidth} bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-stone-200 overflow-hidden transform transition-all flex flex-col max-h-[92vh] sm:max-h-[88vh] z-10 animate-in fade-in duration-200`}
      >
        {/* Cabecera del modal */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/90 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E65100] border border-orange-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-[#2C221E] leading-tight truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-stone-500 font-medium truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {showClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-[#2C221E] hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 -mr-2"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Cuerpo desplazable del modal */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
