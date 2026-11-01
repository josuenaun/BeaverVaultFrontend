// src/pages/auth/Login.jsx - Pantalla de inicio de sesión del sistema web BeaverVault
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import beavervaultLogo from '../../assets/beavervault_logo.png';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    correo: '',
    contrasena: '',
  });

  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.correo.trim()) {
      errors.correo = 'El correo electrónico es requerido';
    } else if (!emailRegex.test(formData.correo.trim())) {
      errors.correo = 'Ingrese un correo electrónico válido';
    }

    if (!formData.contrasena) {
      errors.contrasena = 'La contraseña es requerida';
    } else if (formData.contrasena.length < 4) {
      errors.contrasena = 'La contraseña debe tener al menos 4 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setServerError('');

    try {
      await login(formData.correo.trim(), formData.contrasena);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.detalles ||
        err.message ||
        'No se pudo conectar con el servidor. Verifique sus credenciales.';
      setServerError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C221E] flex flex-col justify-center py-10 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Resplandor decorativo ambiental */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#E65100]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#6D4C41]/35 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Encabezado: Logo BeaverVault destacado y título del sistema */}
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <img
              src={beavervaultLogo}
              alt="Logo BeaverVault"
              className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-[0_14px_28px_rgba(0,0,0,0.55)] transition-transform duration-300 hover:scale-105"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-sm">
            BeaverVault
          </h1>
        </div>

        {/* Tarjeta de Formulario de Inicio de Sesión */}
        <div className="mt-7 bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-stone-200">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[#2C221E]">Iniciar Sesión</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Ingrese con sus credenciales de operador o administrador
            </p>
          </div>

          {serverError && (
            <div className="mb-5">
              <Alert
                variant="error"
                title="Error de Autenticación"
                message={serverError}
                onClose={() => setServerError('')}
              />
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="correo"
              name="correo"
              type="email"
              label="Correo Electrónico"
              placeholder="admin@beavervault.com"
              icon={Mail}
              value={formData.correo}
              onChange={handleChange}
              error={formErrors.correo}
              disabled={loading}
              required
              autoComplete="email"
            />

            <Input
              id="contrasena"
              name="contrasena"
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              icon={Lock}
              value={formData.contrasena}
              onChange={handleChange}
              error={formErrors.contrasena}
              disabled={loading}
              required
              autoComplete="current-password"
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={loading}
                className="w-full text-base font-bold group cursor-pointer bg-[#E65100] hover:bg-[#cf4700] text-white shadow-md"
              >
                <span>Acceder al Sistema</span>
                {!loading && (
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}