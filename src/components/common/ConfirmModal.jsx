// src/components/common/ConfirmModal.jsx - Ventana emergente interactiva de confirmación (reemplaza window.confirm)
import { Modal } from './Modal';
import { AlertTriangle, Trash2, CheckCircle2, Info } from 'lucide-react';

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Está seguro de continuar?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'success' | 'info'
  loading = false,
}) {
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      maxWidth="max-w-md"
      showClose={!loading}
    >
      <div className="space-y-4 pt-1">
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-2xs shrink-0 ${conf.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-extrabold text-[#2C221E] tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 min-h-[42px]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 min-h-[42px] flex items-center justify-center gap-2 ${conf.btnConfirm}`}
          >
            {loading && <span className="w-3.5 h-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
