// src/components/common/Input.jsx - Input controlado con paleta corporativa JOSBECORSA
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const inputId = id || name;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-[#E65100]">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-xs">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <Icon className="h-4 w-4 text-stone-400" aria-hidden="true" />
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
          className={`block w-full rounded-xl border text-xs sm:text-sm transition-all h-11
            ${Icon ? 'pl-10' : 'pl-3.5'}
            ${isPassword ? 'pr-10' : 'pr-3.5'}
            py-2
            ${
              error
                ? 'border-rose-400 text-rose-900 placeholder-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : 'border-stone-300 text-[#2C221E] bg-white placeholder-stone-400 focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20'
            }
            outline-hidden
            disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-stone-400 hover:text-stone-700 min-h-[44px] min-w-[44px] justify-center cursor-pointer"
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
