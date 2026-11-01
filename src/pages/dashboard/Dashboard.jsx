// src/pages/dashboard/Dashboard.jsx - Panel de control corporativo BeaverVault
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Sprout,
  Truck,
  Building2,
  Scale,
  ArrowRight,
  Package,
} from 'lucide-react';

const ETAPAS_ACCIONES = [
  {
    etapa: 'Etapa 1',
    titulo: 'Acopio en Provincia',
    descripcion: 'Registro de lotes de campo, matriz en cascada de paltas y pago a seleccionadores.',
    to: '/acopio',
    accionTexto: 'Gestionar Acopio',
    icon: Sprout,
    iconoBg: 'bg-[#E65100] text-white',
  },
  {
    etapa: 'Etapa 2',
    titulo: 'Transporte a Lima',
    descripcion: 'Contratación de fletes, asignación de chofer y placa, y monitoreo en tránsito.',
    to: '/transporte',
    accionTexto: 'Ver Fletes',
    icon: Truck,
    iconoBg: 'bg-[#6D4C41] text-white',
  },
  {
    etapa: 'Etapa 3',
    titulo: 'Distribución en Lima',
    descripcion: 'Recepción en almacén, pago a cuadrilla y traslado físico entre cámaras y puestos.',
    to: '/distribucion',
    accionTexto: 'Tablero Kanban',
    icon: Building2,
    iconoBg: 'bg-[#2C221E] text-white',
  },
  {
    etapa: 'Etapa 4',
    titulo: 'Ventas y Balanza (POS)',
    descripcion: 'Conversión 1:1 a kilos, venta táctil mayorista y control de fiados.',
    to: '/ventas',
    accionTexto: 'Abrir POS Balanza',
    icon: Scale,
    iconoBg: 'bg-[#E65100] text-white',
  },
];

export function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Banner Principal de Bienvenida: Fondo Marrón Castor #6D4C41 */}
      <div className="bg-[#6D4C41] text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden border border-[#5D3F35]">
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Bienvenido, {user?.nombre || user?.correo || 'Operador'}
          </h1>
          <p className="mt-2 text-[#E8D8C8] text-xs sm:text-sm leading-relaxed">
            Plataforma integral de trazabilidad para comercialización mayorista.
            Seleccione el módulo correspondiente a la etapa operativa de su cuadrilla o almacén.
          </p>
        </div>
      </div>

      {/* Grid de las 4 Etapas Operativas: Bordes y sombras unificadas neutras, sin multicolor */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-[#2C221E] flex items-center gap-2">
            <Package className="w-5 h-5 text-[#E65100]" />
            Etapas del Flujo Operativo
          </h2>
          <span className="text-xs text-stone-500 font-semibold">Trazabilidad Total</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ETAPAS_ACCIONES.map((modulo) => {
            const Icon = modulo.icon;
            return (
              <div
                key={modulo.etapa}
                className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs hover:shadow-md hover:border-stone-300 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                      {modulo.etapa}
                    </span>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${modulo.iconoBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[#2C221E] mb-1.5">
                    {modulo.titulo}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed mb-4">
                    {modulo.descripcion}
                  </p>
                </div>

                <Link
                  to={modulo.to}
                  className="inline-flex items-center justify-between w-full px-3.5 py-2.5 bg-[#FAFAFC] hover:bg-[#E65100] text-[#2C221E] hover:text-white border border-stone-200 hover:border-[#E65100] rounded-xl text-xs font-bold transition-all group min-h-[44px]"
                >
                  <span>{modulo.accionTexto}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
