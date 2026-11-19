// src/components/layout/Navbar.jsx - Barra superior con indicador de empresa activa, datos del usuario y cierre de sesión
import { Menu, LogOut, Building, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// ==========================================
// Componente Navbar
// ==========================================
export function Navbar({ onOpenMobileMenu }) {
  // Consumo del estado global de autenticación
  const {
    user,
    logout,
    empresaId,
    setEmpresaId,
    empresaActiva,
    empresas,
    rolNombre,
    loadingEmpresa,
  } = useAuth();

  // Manejador del selector de empresa (para administradores con múltiples empresas)
  const handleEmpresaChange = (e) => {
    setEmpresaId(e.target.value);
  };

  // Renderizado de la barra superior
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200 h-16 shrink-0 shadow-xs">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* ---------------------------------------- */}
        {/* Lado izquierdo: Botón móvil y Empresa    */}
        {/* ---------------------------------------- */}
        <div className="flex items-center gap-3">
          {/* Botón hamburguesa para dispositivos móviles */}
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-[#2C221E] hover:bg-stone-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Selector de empresa o insignia de la empresa actual */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#E65100] flex items-center justify-center shrink-0">
              <Building className="w-4 h-4" />
            </div>

            {empresas.length > 1 ? (
              <div className="relative">
                <select
                  value={empresaId || ''}
                  onChange={handleEmpresaChange}
                  className="text-xs font-bold text-[#2C221E] bg-[#FAFAFC] border border-stone-200 rounded-lg py-1 pl-2.5 pr-7 focus:ring-2 focus:ring-[#E65100]/30 outline-hidden appearance-none cursor-pointer"
                >
                  {empresas.map((emp) => {
                    const id = emp.empresaId || emp.id;
                    return (
                      <option key={id} value={id}>
                        {emp.nombre}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <div className="leading-tight">
                <p className="text-xs font-extrabold text-[#2C221E] truncate max-w-[150px] sm:max-w-[200px]">
                  {loadingEmpresa ? 'Cargando...' : empresaActiva?.nombre || 'Empresa Principal'}
                </p>
                <p className="text-[10px] text-stone-600 font-semibold uppercase tracking-wider">
                  Tenant Activo
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ---------------------------------------- */}
        {/* Lado derecho: Usuario y Cerrar Sesión   */}
        {/* ---------------------------------------- */}
        <div className="flex items-center gap-3">
          {/* Identificación del usuario y su rol */}
          <div className="hidden sm:flex flex-col items-end leading-tight text-right">
            <span className="text-xs font-bold text-[#2C221E]">
              {user?.nombre || user?.correo?.split('@')[0] || 'Usuario'}
            </span>
            <span className="text-[10px] text-[#E65100] font-extrabold uppercase tracking-wide">
              {rolNombre}
            </span>
          </div>

          <div className="w-9 h-9 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-600">
            <User className="w-4 h-4" />
          </div>

          {/* Botón de cierre de sesión */}
          <button
            type="button"
            onClick={logout}
            className="p-2 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
