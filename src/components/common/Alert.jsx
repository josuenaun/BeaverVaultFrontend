// src/components/common/Alert.jsx - Componente de alertas y notificaciones
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export function Alert({
  variant = 'error',
  title,
  message,
  onClose,
  className = '',
}) {
  if (!message && !title) return null;

  const config = {
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      icon: AlertCircle,
      iconColor: 'text-rose-500',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-500',
    },
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-800',
      icon: Info,
      iconColor: 'text-sky-500',
    },
  };

  const current = config[variant] || config.error;
  const Icon = current.icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 rounded-lg border text-sm ${current.bg} ${className}`}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1">
        {title && <h4 className="font-semibold">{title}</h4>}
        <div className="text-xs sm:text-sm font-normal">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 focus:outline-none"
          aria-label="Cerrar alerta"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
