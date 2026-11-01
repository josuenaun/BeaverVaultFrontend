// src/components/layout/Navbar.jsx - Barra superior de navegación y estado de empresa BeaverVault
import { Menu, LogOut, Building, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function Navbar({ onOpenMobileMenu }) {
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

  const handleEmpresaChange = (e) => {
    setEmpresaId(e.target.value);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-stone-200 h-16 shrink-0 shadow-xs">
      <div className="h-full px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Lado izquierdo: Botón hamburguesa móvil + Identificador de Empresa */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 text-[#2C221E] hover:bg-stone-100 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Badge o Selector de Empresa desde el backend */}
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
                <span className="text-[10px] uppercase font-bold text-stone-500 block tracking-wider">
                  Empresa Activa
                </span>
                {loadingEmpresa && !empresaActiva ? (
                  <div className="h-4 w-24 bg-stone-200 rounded animate-pulse mt-0.5" />
                ) : (
                  <span
                    className="text-xs font-bold text-[#2C221E] truncate max-w-[160px] sm:max-w-xs block"
                    title={empresaActiva?.nombre || ''}
                  >
                    {empresaActiva?.nombre || 'Empresa'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Lado derecho: Usuario y Logout unificados en Marrón Carbón #2C221E */}
        <div className="flex items-center gap-3">
          {/* Avatar e información del usuario con rol exacto del backend */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#2C221E] text-[#E8D8C8] flex items-center justify-center font-bold text-xs shadow-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-xs font-bold text-[#2C221E] truncate max-w-[140px]">
                {user?.nombre || user?.correo || 'Usuario'}
              </p>
              <span className="text-[10px] font-bold text-[#2C221E]/80 uppercase tracking-wider">
                {rolNombre}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-stone-200 mx-1 hidden sm:block" />

          {/* Botón Salir */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-stone-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-all min-h-[44px] cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
}
