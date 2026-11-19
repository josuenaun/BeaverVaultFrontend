// src/components/common/Input.jsx - Campo de entrada de texto controlado con soporte para contraseña e íconos
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// ==========================================
// Componente Input Reutilizable
// ==========================================
export function Input({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  icon: Icon,
  disabled = false,
  required = false,
  className = '',
  ...props
}) {
  // Estado local para alternar visibilidad de contraseña
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const inputId = id || name;

  // Renderizado del campo y mensajes de error
  return (
    <div className={`w-full ${className}`}>
      {/* Etiqueta del campo */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs sm:text-sm font-bold text-[#2C221E] mb-1.5"
        >
          {label} {required && <span className="text-[#E65100]">*</span>}
        </label>
      )}

      {/* Contenedor relativo del input */}
      <div className="relative rounded-xl shadow-xs">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Icon className="h-5 w-5 text-stone-400" aria-hidden="true" />
          </div>
        )}
        <input
          id={inputId}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          placeholder={placeholder}
          className={`block w-full rounded-xl border text-sm sm:text-base transition-all h-11 sm:h-12 ${
            Icon ? 'pl-11' : 'pl-3.5'
          } ${isPassword ? 'pr-11' : 'pr-3.5'} ${
            error
              ? 'border-rose-400 bg-rose-50/20 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-3 focus:ring-rose-200 outline-hidden'
              : 'border-stone-300 bg-white text-[#2C221E] placeholder-stone-400 hover:border-stone-400 focus:border-[#E65100] focus:ring-3 focus:ring-[#E65100]/25 outline-hidden'
          } disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed`}
          {...props}
        />

        {/* Botón para mostrar / ocultar contraseña */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-stone-400 hover:text-[#2C221E] focus:outline-hidden cursor-pointer"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      {/* Mensaje de validación / error */}
      {error && (
        <p className="mt-1.5 text-xs text-rose-600 font-semibold" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
