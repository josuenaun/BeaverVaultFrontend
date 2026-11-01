// src/components/layout/MainLayout.jsx - Layout envolvente responsive para la plataforma
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileDrawer } from './MobileDrawer';

export function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col md:flex-row antialiased text-[#2C221E]">
      {/* Sidebar fijo en escritorio */}
      <div className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0 z-40 shadow-xl border-r border-stone-800">
        <Sidebar />
      </div>

      {/* Drawer deslizante para dispositivos móviles */}
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Área de contenido principal con margen lateral en desktop */}
      <div className="md:pl-64 lg:pl-72 flex-1 flex flex-col min-w-0">
        <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-3 sm:p-5 lg:p-7 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
