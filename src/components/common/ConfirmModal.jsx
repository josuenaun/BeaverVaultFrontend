// src/components/common/ConfirmModal.jsx - Diálogo modal de confirmación de acciones críticas o irreversibles
import { Modal } from './Modal';
import { AlertTriangle, Trash2, CheckCircle2, Info } from 'lucide-react';

// ==========================================
// Componente de Confirmación Modal
// ==========================================
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Está seguro de continuar?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}) {
  // Configuraciones de ícono y botones según variante
  const configs = {
    danger: {
      icon: Trash2,
      iconBg: 'bg-rose-100 text-rose-700 border-rose-200',
      btnConfirm: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/10',
    },
    warning: {
      icon: AlertTriangle,
      iconBg: 'bg-amber-100 text-amber-800 border-amber-200',
      btnConfirm: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-900/10',
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      btnConfirm: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/10',
    },
    info: {
      icon: Info,
      iconBg: 'bg-sky-100 text-sky-800 border-sky-200',
      btnConfirm: 'bg-[#E65100] hover:bg-[#cf4700] text-white shadow-orange-900/10',
    },
  };

  const conf = configs[variant] || configs.danger;
  const Icon = conf.icon;

  // Renderizado del modal y botones de acción
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      maxWidth="max-w-md"
      showClose={!loading}
    >
      <div className="space-y-4 pt-1">
        {/* Cabecera con ícono de advertencia */}
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-2xl border shrink-0 ${conf.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#2C221E] leading-snug">
              {title}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Botones de confirmar y cancelar */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer disabled:opacity-50 min-h-[44px] shadow-sm active:scale-95 flex items-center justify-center gap-2 ${conf.btnConfirm}`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
