// src/components/layout/Sidebar.jsx - Menú lateral corporativo BeaverVault (>= md)
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  Sprout,
  Truck,
  Building2,
  Warehouse,
  Scale,
  ShoppingBag,
  ReceiptText,
  BookOpenCheck,
  Settings,
} from 'lucide-react';
import beaverLogo from '../../assets/beavervault_logo.png';

const MENU_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
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
    label: 'Distribución Lima',
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

export function Sidebar({ onItemClick }) {
  const { empresaActiva, loadingEmpresa } = useAuth();

  return (
    <aside className="h-full flex flex-col bg-[#2C221E] text-stone-200 select-none">
      {/* Brand Header: Nombre de la Empresa y BeaverVault */}
      <div className="h-20 px-5 flex items-center gap-3 border-b border-stone-800/80 bg-black/20">
        <div className="w-10 h-10 rounded-xl bg-[#E65100] flex items-center justify-center p-1.5 shadow-md shrink-0">
          <img
            src={beaverLogo}
            alt="BeaverVault Logo"
            className="w-full h-full object-contain filter brightness-110"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="min-w-0">
          {loadingEmpresa && !empresaActiva ? (
            <div className="h-5 w-28 bg-stone-700/60 rounded animate-pulse mb-1" />
          ) : (
            <h1
              className="text-base font-extrabold text-white tracking-wider truncate"
              title={empresaActiva?.nombre || ''}
            >
              {empresaActiva?.nombre || 'Empresa'}
            </h1>
          )}
          <p className="text-[11px] text-[#E8D8C8] font-semibold tracking-wide uppercase truncate">
            BeaverVault
          </p>
        </div>
      </div>

      {/* Navigation Links */}
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
