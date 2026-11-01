// src/components/layout/MobileDrawer.jsx - Menú lateral deslizable para smartphones (< md)
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function MobileDrawer({ isOpen, onClose }) {
  // Manejo de tecla Escape y bloqueo de scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Fondo oscuro traslúcido con click para cerrar */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor del Drawer deslizante desde la izquierda */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[#2C221E] shadow-2xl z-10 flex flex-col transform transition-transform ease-out duration-200">
        {/* Botón de cierre superior */}
        <div className="absolute top-4 right-3 z-20">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reutilización del Sidebar pasando onClose para cerrar al navegar */}
        <div className="h-full flex-1 overflow-hidden">
          <Sidebar onItemClick={onClose} />
        </div>
      </div>
    </div>
  );
}
