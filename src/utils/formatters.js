// src/utils/formatters.js - Formato de moneda peruana, pesos en kilogramos y fechas
export const formatearMoneda = (monto) => {
  const numero = Number(monto) || 0;
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(numero);
};

export const formatearKilos = (peso) => {
  const numero = Number(peso) || 0;
  return `${numero.toFixed(2)} kg`;
};

export const formatearFecha = (fecha) => {
  if (!fecha) return '-';
  try {
    // 1. Si viene como string
    if (typeof fecha === 'string') {
      const match = fecha.match(/^(\d{4})-(\d{2})-(\d{2})/);
      // Si es formato solo fecha YYYY-MM-DD o tiene medianoche UTC T00:00:00 (evitar retroceso por UTC-5)
      if (match && (fecha.length === 10 || fecha.includes('T00:00:00') || fecha.includes(' 00:00:00'))) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
    }
    // 2. Si viene como objeto Date que está en medianoche UTC
    if (fecha instanceof Date) {
      if (fecha.getUTCHours() === 0 && fecha.getUTCMinutes() === 0 && fecha.getUTCSeconds() === 0) {
        const day = String(fecha.getUTCDate()).padStart(2, '0');
        const month = String(fecha.getUTCMonth() + 1).padStart(2, '0');
        const year = fecha.getUTCFullYear();
        return `${day}/${month}/${year}`;
      }
    }
    // 3. Para timestamps reales (como ventas o auditorías), convertir al huso de Perú
    return new Intl.DateTimeFormat('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(fecha));
  } catch {
    return String(fecha);
  }
};

/**
 * Obtener la fecha actual en Perú (America/Lima UTC-5) en formato YYYY-MM-DD
 */
export const obtenerFechaHoyPeru = () => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

/**
 * Convierte un código de color (hexadecimal o nombre) a un estilo pastel suave
 * para la sección de background sin saturar la vista, garantizando legibilidad corporativa.
 * @param {string} codigoColor
 * @returns {{ backgroundColor: string, borderColor: string, color: string, dotColor: string }}
 */
export const obtenerEstiloPastel = (codigoColor) => {
  if (!codigoColor) {
    return {
      backgroundColor: '#F8FAFC',
      borderColor: '#E2E8F0',
      color: '#2C221E',
      dotColor: '#94A3B8',
    };
  }

  const str = String(codigoColor).trim();
  const lower = str.toLowerCase();

  // Mapeo por palabras clave comunes en español
  const mapaColores = {
    verde: { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', dot: '#22C55E' },
    azul: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', dot: '#3B82F6' },
    rojo: { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', dot: '#EF4444' },
    amarillo: { bg: '#FEFCE8', border: '#FEF08A', text: '#854D0E', dot: '#EAB308' },
    naranja: { bg: '#FFF7ED', border: '#FED7AA', text: '#9A3412', dot: '#F97316' },
    morado: { bg: '#FAF5FF', border: '#E9D5FF', text: '#6B21A8', dot: '#A855F7' },
    turquesa: { bg: '#ECFEFF', border: '#A5F3FC', text: '#155E75', dot: '#06B6D4' },
    negro: { bg: '#F8FAFC', border: '#E2E8F0', text: '#1E293B', dot: '#334155' },
    blanco: { bg: '#FFFFFF', border: '#E2E8F0', text: '#334155', dot: '#CBD5E1' },
  };

  for (const [key, val] of Object.entries(mapaColores)) {
    if (lower.includes(key)) {
      return {
        backgroundColor: val.bg,
        borderColor: val.border,
        color: val.text,
        dotColor: val.dot,
      };
    }
  }

  // Procesamiento de colores Hexadecimales (#RGB o #RRGGBB)
  if (str.startsWith('#')) {
    let hex = str.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        return {
          backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
          borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`,
          color: '#2C221E',
          dotColor: str,
        };
      }
    }
  }

  return {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    color: '#2C221E',
    dotColor: '#94A3B8',
  };
};
