// src/components/layout/Sidebar.jsx - Menú lateral de navegación principal con enlaces a todos los módulos operativos
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Building2,
  Warehouse,
  Scale,
  ShoppingBag,
  ReceiptText,
  BookOpenCheck,
  Settings,
} from 'lucide-react';
import beaverLogo from '../../assets/beavervault_logo.png';

// ==========================================
// Configuración de rutas y módulos del menú
// ==========================================
const MENU_ITEMS = [
  {
    to: '/dashboard',
    label: 'Panel Principal',
    icon: LayoutDashboard,
    badge: null,
  },
  {
    to: '/acopio',
    label: 'Acopio en Provincia',
    icon: Sprout,
    badge: null,
  },
  {
    to: '/distribucion',
    label: 'Distribución en Lima',
    icon: Building2,
    badge: null,
  },
  {
    to: '/inventario',
    label: 'Inventario por Puesto',
    icon: Warehouse,
    badge: null,
  },
  {
    to: '/ventas',
    label: 'Ventas en Balanza',
    icon: Scale,
    badge: null,
  },
  {
    to: '/paltas-vendidas',
    label: 'Paltas Vendidas',
    icon: ShoppingBag,
    badge: null,
  },
  {
    to: '/gastos-operativos',
    label: 'Gastos Operativos',
    icon: ReceiptText,
    badge: null,
  },
  {
    to: '/fiados',
    label: 'Control de Fiados',
    icon: BookOpenCheck,
    badge: null,
  },
  {
    to: '/configuracion',
    label: 'Configuración',
    icon: Settings,
    badge: 'Admin',
  },
];

// ==========================================
// Componente Sidebar
// ==========================================
export function Sidebar({ onItemClick }) {
  // Renderizado del menú lateral
  return (
    <aside className="h-full flex flex-col bg-[#2C221E] text-stone-200 select-none">
      {/* ---------------------------------------- */}
      {/* Cabecera del Sidebar con Logo e Identidad*/}
      {/* ---------------------------------------- */}
      <div className="h-20 sm:h-22 px-4 py-3 flex items-center gap-3.5 border-b border-stone-800/80">
        <div className="shrink-0 flex items-center justify-center">
          <img
            src={beaverLogo}
            alt="BeaverVault Logo"
            className="w-14 h-14 sm:w-16 sm:h-16 object-contain filter drop-shadow-md transition-transform duration-200 hover:scale-105"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            BeaverVault
          </h1>
          <p className="text-xs font-semibold text-[#E8D8C8]/80 tracking-wide mt-0.5">
            Sistema Mayorista
          </p>
        </div>
      </div>

      {/* ---------------------------------------- */}
      {/* Lista de navegación interactiva          */}
      {/* ---------------------------------------- */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[#E8D8C8]/70">
          Módulos Operativos
        </div>

        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onItemClick}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-150 min-h-[44px] ${
                  isActive
                    ? 'bg-[#E65100] text-white shadow-md shadow-orange-950/40 font-bold'
                    : 'text-stone-300 hover:bg-[#3D302A] hover:text-white'
                }`
              }
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/30 tracking-wider shrink-0 text-[#E8D8C8]">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
