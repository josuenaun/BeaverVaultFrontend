// src/components/forms/CascadeSelect.jsx - Selector en cascada estricto para Tipo y Categoría de Palta
import { useEffect, useMemo } from 'react';
import { Select } from './Select';
import { MATRIZ_CLASIFICACION, TIPOS_PALTA } from '../../utils/constants';

export function CascadeSelect({
  tipo,
  categoria,
  onTipoChange,
  onCategoriaChange,
  tipoError,
  categoriaError,
  disabled = false,
  required = true,
  layout = 'grid', // 'grid' | 'inline' | 'stacked'
}) {
  const categoriasDisponibles = useMemo(
    () => (tipo ? MATRIZ_CLASIFICACION[tipo] || [] : []),
    [tipo]
  );

  // Reset de categoría si el tipo cambia y la categoría ya no es válida para ese tipo
  useEffect(() => {
    if (tipo && categoria && !categoriasDisponibles.includes(categoria)) {
      onCategoriaChange?.('');
    }
  }, [tipo, categoria, categoriasDisponibles, onCategoriaChange]);

  const handleTipo = (e) => {
    const nuevoTipo = e.target.value;
    onTipoChange?.(nuevoTipo);
    // Limpiar categoría si cambia el tipo
    onCategoriaChange?.('');
  };

  const handleCategoria = (e) => {
    onCategoriaChange?.(e.target.value);
  };

  const wrapperClass =
    layout === 'grid'
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4'
      : layout === 'inline'
      ? 'flex flex-col sm:flex-row gap-3 sm:gap-4 items-start'
      : 'flex flex-col gap-3';

  return (
    <div className={wrapperClass}>
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

      <Select
        label="Categoría / Calidad"
        name="categoriaPalta"
        value={categoria || ''}
        onChange={handleCategoria}
        options={categoriasDisponibles}
        placeholder={tipo ? 'Seleccione Calidad...' : 'Primero seleccione un tipo'}
        error={categoriaError}
        disabled={disabled || !tipo || categoriasDisponibles.length === 0}
        required={required}
        helperText={tipo ? `${categoriasDisponibles.length} calidades disponibles para ${tipo}` : ''}
      />
    </div>
  );
}
