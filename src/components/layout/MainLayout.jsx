// src/components/layout/MainLayout.jsx - Estructura envolvente de la aplicación con barra lateral fija y navegación responsive
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileDrawer } from './MobileDrawer';

// ==========================================
// Componente de Layout Principal
// ==========================================
export function MainLayout() {
  // Estado para controlar apertura del menú móvil
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Renderizado del layout responsivo
  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col md:flex-row antialiased text-[#2C221E]">
      {/* ---------------------------------------- */}
      {/* Menú lateral fijo en escritorio (md+)    */}
      {/* ---------------------------------------- */}
      <div className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 z-40 shadow-xl border-r border-stone-800">
        <Sidebar />
      </div>

      {/* ---------------------------------------- */}
      {/* Cajón deslizable para móviles (< md)     */}
      {/* ---------------------------------------- */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* ---------------------------------------- */}
      {/* Área de contenido y cabecera superior    */}
      {/* ---------------------------------------- */}
      <div className="md:pl-64 lg:pl-72 flex-1 flex flex-col min-w-0">
        {/* Barra superior de navegación */}
        <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Contenedor dinámico donde se montan las páginas hijas */}
        <main className="flex-1 p-3 sm:p-5 lg:p-7 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
