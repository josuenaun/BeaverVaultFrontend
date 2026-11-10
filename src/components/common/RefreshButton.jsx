// src/components/common/RefreshButton.jsx - Botón interactivo de actualización con animación de giro continuo
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export function RefreshButton({
  onRefresh,
  loading = false,
  label = null,
  className = '',
  title = 'Actualizar datos',
}) {
  const [girando, setGirando] = useState(false);

  const handleClick = async () => {
    if (girando || loading) return;
    setGirando(true);
    // Garantiza al menos 750ms de giro visible para que el usuario sienta la respuesta táctil
    const promesaGiroMinimo = new Promise((resolve) => setTimeout(resolve, 750));
    try {
      if (onRefresh) {
        await Promise.all([Promise.resolve(onRefresh()), promesaGiroMinimo]);
      } else {
        await promesaGiroMinimo;
      }
    } catch {
      await promesaGiroMinimo;
    } finally {
      setGirando(false);
    }
  };

  const estaAnimando = girando || loading;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={estaAnimando}
      className={`inline-flex items-center justify-center gap-2 p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed select-none ${className}`}
      title={title}
      aria-label={title}
    >
      <RefreshCw
        className={`w-4 h-4 transition-transform ${
          estaAnimando ? 'animate-spin text-[#E65100]' : 'text-stone-500'
        }`}
      />
      {label && <span className="text-xs font-bold">{label}</span>}
    </button>
  );
}
