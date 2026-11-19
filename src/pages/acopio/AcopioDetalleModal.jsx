// src/pages/acopio/AcopioDetalleModal.jsx - Ventana modal para visualizar el detalle completo de un lote de acopio y sus jabas
// ==========================================
// 1. Importaciones y Dependencias
// ==========================================
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { formatearFecha, formatearMoneda, formatearKilos } from '../../utils/formatters';
import {
  Layers,
  Scale,
  MapPin,
  User,
  Calendar,
  Truck,
  Package,
} from 'lucide-react';

// ==========================================
// 2. Componente Modal AcopioDetalleModal
// ==========================================
export function AcopioDetalleModal({ isOpen, onClose, acopio }) {
  if (!acopio) return null;

  // ----------------------------------------
  // 3. Cálculos de Totales y Promedios del Lote
  // ----------------------------------------
  const jabas = acopio.jabas || acopio._jabas || [];
  const totalJabas =
    acopio.totalJabas ||
    jabas.reduce((sum, j) => sum + (Number(j.cantidadJabas) || 0), 0);
  const totalPesoBruto =
    acopio.totalPesoBruto ||
    jabas.reduce((sum, j) => sum + (Number(j.pesoBruto) || 0), 0);
  const promedioLote = totalJabas > 0 ? (totalPesoBruto / totalJabas).toFixed(2) : '0.00';

  // ----------------------------------------
  // 4. Renderizado del Contenido del Modal
  // ----------------------------------------
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Lote de Acopio"
      subtitle={`Lote: ${acopio.origen || 'Origen no especificado'}`}
      icon={Package}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Ficha de Información General del Lote */}
        <div className="bg-[#FAFAFC] border border-stone-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
          <div>
            <span className="text-xs font-bold text-stone-500 block">
              Origen / Fundo
            </span>
            <p className="font-bold text-[#2C221E] flex items-center gap-1.5 mt-1 truncate">
              <MapPin className="w-4 h-4 text-[#E65100] shrink-0" />
              <span className="truncate">{acopio.origen}</span>
            </p>
          </div>

          <div>
            <span className="text-xs font-bold text-stone-500 block">
              Encargado
            </span>
            <p className="font-semibold text-stone-800 flex items-center gap-1.5 mt-1 truncate">
              <User className="w-4 h-4 text-stone-500 shrink-0" />
              <span className="truncate">{acopio.encargadoLote}</span>
            </p>
          </div>

          <div>
            <span className="text-xs font-bold text-stone-500 block">
              Fecha de Acopio
            </span>
            <p className="font-semibold text-stone-800 flex items-center gap-1.5 mt-1">
              <Calendar className="w-4 h-4 text-stone-500 shrink-0" />
              <span>{formatearFecha(acopio.fechaCompra)}</span>
            </p>
          </div>

          <div>
            <span className="text-xs font-bold text-stone-500 block">
              Estado Actual
            </span>
            <div className="mt-1">
              <Badge status={acopio.estado || 'Acopio'} size="sm" />
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas de Fruta en Balanza */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-stone-900 text-white rounded-xl flex flex-col justify-between shadow-xs">
            <span className="text-xs text-stone-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-[#E8D8C8]" />
              Total Jabas
            </span>
            <span className="text-2xl font-black mt-1 text-white">
              {totalJabas} <span className="text-xs font-normal text-stone-300">jabas</span>
            </span>
          </div>

          <div className="p-3.5 bg-orange-50 border border-orange-200 text-[#2C221E] rounded-xl flex flex-col justify-between shadow-xs">
            <span className="text-xs text-[#E65100] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#E65100]" />
              Peso Bruto Total
            </span>
            <span className="text-2xl font-black mt-1 text-[#E65100]">
              {formatearKilos(totalPesoBruto)}
            </span>
          </div>

          <div className="p-3.5 bg-stone-50 border border-stone-200 text-[#2C221E] rounded-xl flex flex-col justify-between shadow-xs">
            <span className="text-xs text-stone-600 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-stone-500" />
              Flete / Promedio
            </span>
            <div className="mt-1">
              <span className="text-sm font-black text-[#2C221E] block">
                {formatearMoneda(acopio.fleteCosto || 0)}
              </span>
              <span className="text-xs text-stone-500 font-medium">
                Prom. {promedioLote} kg/jaba
              </span>
            </div>
          </div>
        </div>

        {/* Tabla Detallada de Jabas Clasificadas */}
        <div className="space-y-2">
          <h4 className="text-xs sm:text-sm font-bold text-[#2C221E] uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#E65100]" />
            Jabas Clasificadas en Campo ({jabas.length} grupos)
          </h4>

          {jabas.length === 0 ? (
            <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-300">
              <Package className="w-8 h-8 text-stone-300 mx-auto mb-1.5" />
              <p className="text-sm font-bold text-stone-700">No hay detalle de jabas disponible</p>
              <p className="text-xs text-stone-500 mt-0.5">
                Este lote fue registrado sin grupos de jabas o aún no se han sincronizado.
              </p>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-stone-100 text-stone-700 font-bold uppercase tracking-wider border-b border-stone-200 sticky top-0">
                    <tr>
                      <th className="px-3.5 py-3">Variedad</th>
                      <th className="px-3.5 py-3">Categoría</th>
                      <th className="px-3.5 py-3">Color Jaba</th>
                      <th className="px-3.5 py-3 text-right">Cant. Jabas</th>
                      <th className="px-3.5 py-3 text-right">Peso Bruto</th>
                      <th className="px-3.5 py-3 text-right">Prom./Jaba</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {jabas.map((j, idx) => {
                      const cant = Number(j.cantidadJabas) || 1;
                      const peso = Number(j.pesoBruto) || 0;
                      const prom = (peso / cant).toFixed(2);
                      const colorHex = j.codigoColor || '#10B981';

                      return (
                        <tr key={j.jabaId || idx} className="hover:bg-stone-50 transition-colors">
                          <td className="px-3.5 py-3 font-bold text-[#2C221E]">
                            Palta {j.tipoPalta}
                          </td>
                          <td className="px-3.5 py-3 font-semibold text-stone-800">
                            {j.categoria}
                          </td>
                          <td className="px-3.5 py-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-stone-800 border border-stone-200 shadow-2xs">
                              <span
                                className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                                style={{ backgroundColor: colorHex }}
                              />
                              <span className="font-mono text-xs uppercase">{colorHex}</span>
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-right font-black text-[#2C221E]">
                            {cant}
                          </td>
                          <td className="px-3.5 py-3 text-right font-black text-[#E65100]">
                            {formatearKilos(peso)}
                          </td>
                          <td className="px-3.5 py-3 text-right text-stone-600 font-medium">
                            {prom} kg
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Botón de Cierre */}
        <div className="pt-3 border-t border-stone-200 flex justify-end">
          <Button variant="outline" onClick={onClose} className="min-h-11 px-6">
            Cerrar Detalle
          </Button>
        </div>
      </div>
    </Modal>
  );
}
