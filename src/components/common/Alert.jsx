// src/components/common/Alert.jsx - Componente de alertas informativas, advertencias y mensajes de error
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

// ==========================================
// Componente de Alerta Accesible
// ==========================================
export function Alert({
  variant,
  type,
  title,
  message,
  onClose,
  className = '',
}) {
  // Retornar vacío si no hay mensaje ni título
  if (!message && !title) return null;

  // Clave de variante: 'error' | 'success' | 'warning' | 'info'
  const key = type || variant || 'error';

  // Configuración visual por tipo de alerta
  const config = {
    error: {
      bg: 'bg-rose-50 border-rose-200 text-rose-900',
      icon: AlertCircle,
      iconColor: 'text-rose-600',
    },
    success: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200 text-amber-900',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
    },
    info: {
      bg: 'bg-sky-50 border-sky-200 text-sky-900',
      icon: Info,
      iconColor: 'text-sky-600',
    },
  };

  const current = config[key] || config.error;
  const Icon = current.icon;

  // Renderizado del contenedor accesible con rol 'alert'
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-xl border text-sm shadow-2xs ${current.bg} ${className}`}
    >
      <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${current.iconColor}`} />
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-bold text-sm sm:text-base leading-tight mb-0.5">{title}</h4>}
        <div className="text-xs sm:text-sm font-medium leading-relaxed">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-1 -mr-1 -mt-1 rounded-lg hover:bg-black/5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Cerrar notificación"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
