// src/components/forms/Select.jsx - Campo desplegable accesible con estilos corporativos BeaverVault
import { forwardRef } from 'react';

// ==========================================
// Componente Select Reutilizable
// ==========================================
export const Select = forwardRef(function Select(
  {
    label,
    name,
    value,
    onChange,
    options = [],
    placeholder = 'Seleccione una opción...',
    error,
    helperText,
    disabled = false,
    required = false,
    className = '',
    ...props
  },
  ref
) {
  // Renderizado del elemento select con flecha personalizada
  return (
    <div className="w-full">
      {/* Etiqueta del campo */}
      {label && (
        <label htmlFor={name} className="block text-xs sm:text-sm font-bold text-[#2C221E] mb-1.5">
          {label} {required && <span className="text-[#E65100]">*</span>}
        </label>
      )}

      {/* Contenedor relativo del select */}
      <div className="relative">
        <select
          ref={ref}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full h-11 sm:h-12 px-3.5 py-2 text-sm sm:text-base text-[#2C221E] bg-white border rounded-xl shadow-xs transition-all outline-hidden appearance-none cursor-pointer disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed ${
            error
              ? 'border-rose-400 focus:border-rose-500 focus:ring-3 focus:ring-rose-200'
              : 'border-stone-300 hover:border-stone-400 focus:border-[#E65100] focus:ring-3 focus:ring-[#E65100]/25'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={String(val)} value={val}>
                {lbl}
              </option>
            );
          })}
        </select>

        {/* Flecha indicadora desplegable */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-stone-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Mensajes de error y texto de ayuda */}
      {error && <p className="mt-1.5 text-xs text-rose-600 font-semibold">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-stone-500">{helperText}</p>}
    </div>
  );
});
