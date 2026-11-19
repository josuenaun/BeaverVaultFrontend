// src/components/forms/CascadeSelect.jsx - Selector encadenado estricto para Variedad y Categoría de Palta
import { useEffect, useMemo } from 'react';
import { Select } from './Select';
import { MATRIZ_CLASIFICACION, TIPOS_PALTA } from '../../utils/constants';

// ==========================================
// Componente CascadeSelect
// ==========================================
export function CascadeSelect({
  tipo,
  categoria,
  onTipoChange,
  onCategoriaChange,
  tipoError,
  categoriaError,
  disabled = false,
  required = true,
  layout = 'grid',
}) {
  // Categorías válidas calculadas a partir de la variedad seleccionada
  const categoriasDisponibles = useMemo(
    () => (tipo ? MATRIZ_CLASIFICACION[tipo] || [] : []),
    [tipo]
  );

  // Efecto: resetear categoría si cambia el tipo y la anterior ya no es válida
  useEffect(() => {
    if (tipo && categoria && !categoriasDisponibles.includes(categoria)) {
      onCategoriaChange?.('');
    }
  }, [tipo, categoria, categoriasDisponibles, onCategoriaChange]);

  // Manejador del cambio de variedad de palta
  const handleTipo = (e) => {
    const nuevoTipo = e.target.value;
    onTipoChange?.(nuevoTipo);
    onCategoriaChange?.('');
  };

  // Manejador del cambio de categoría / calidad
  const handleCategoria = (e) => {
    onCategoriaChange?.(e.target.value);
  };

  // Disposición visual: grid, en línea o apilado
  const wrapperClass =
    layout === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'
      : layout === 'inline'
      ? 'flex flex-col sm:flex-row gap-3 sm:gap-4 items-start'
      : 'flex flex-col gap-3';

  // Renderizado de ambos selects dependientes
  return (
    <div className={wrapperClass}>
      {/* Selector de Variedad */}
      <Select
        label="Tipo de Palta"
        name="tipoPalta"
        value={tipo || ''}
        onChange={handleTipo}
        options={TIPOS_PALTA}
        placeholder="Seleccione Variedad..."
        error={tipoError}
        disabled={disabled}
        required={required}
      />

      {/* Selector de Categoría / Calidad dependiente */}
      <Select
        label="Categoría / Calidad"
        name="categoria"
        value={categoria || ''}
        onChange={handleCategoria}
        options={categoriasDisponibles}
        placeholder={tipo ? 'Seleccione Calidad...' : 'Primero elija Tipo...'}
        error={categoriaError}
        disabled={disabled || !tipo}
        required={required}
      />
    </div>
  );
}
