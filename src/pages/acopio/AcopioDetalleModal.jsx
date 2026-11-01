// src/pages/acopio/AcopioDetalleModal.jsx - Vista detallada del lote de acopio y sus jabas BeaverVault
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

export function AcopioDetalleModal({ isOpen, onClose, acopio }) {
  if (!acopio) return null;

  const jabas = acopio.jabas || acopio._jabas || [];
  const totalJabas =
    acopio.totalJabas ||
    jabas.reduce((sum, j) => sum + (Number(j.cantidadJabas) || 0), 0);
  const totalPesoBruto =
    acopio.totalPesoBruto ||
    jabas.reduce((sum, j) => sum + (Number(j.pesoBruto) || 0), 0);
  const promedioLote = totalJabas > 0 ? (totalPesoBruto / totalJabas).toFixed(2) : '0.00';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Lote de Acopio"
      subtitle={`Lote: ${acopio.origen || 'Origen no especificado'}`}
    >
      <div className="space-y-5">
        {/* Ficha de Información General del Lote */}
        <div className="bg-[#FAFAFC] border border-stone-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
              Origen / Fundo
            </span>
            <p className="font-bold text-[#2C221E] flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#E65100] shrink-0" />
              {acopio.origen}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
              Encargado
            </span>
            <p className="font-medium text-stone-700 flex items-center gap-1 mt-0.5 truncate">
              <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              {acopio.encargadoLote}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
              Fecha de Acopio
            </span>
            <p className="font-medium text-stone-700 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              {formatearFecha(acopio.fechaCompra)}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
              Estado Actual
            </span>
            <div className="mt-1">
              <Badge status={acopio.estado || 'Acopio'} size="sm" />
            </div>
          </div>
        </div>

        {/* Tarjetas de Métricas de Fruta en Balanza */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-stone-900 text-white rounded-xl flex flex-col justify-between shadow-xs">
            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#E8D8C8]" />
              Total Jabas
            </span>
            <span className="text-xl font-black mt-1 text-white">
              {totalJabas} <span className="text-xs font-normal text-stone-400">jabas</span>
            </span>
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200 text-[#2C221E] rounded-xl flex flex-col justify-between shadow-xs">
            <span className="text-[10px] text-[#E65100] font-bold uppercase tracking-wider flex items-center gap-1">
              <Scale className="w-3 h-3 text-[#E65100]" />
              Peso Bruto Total
            </span>
            <span className="text-xl font-black mt-1 text-[#E65100]">
              {formatearKilos(totalPesoBruto)}
            </span>
          </div>

          <div className="p-3 bg-stone-50 border border-stone-200 text-[#2C221E] rounded-xl flex flex-col justify-between shadow-xs">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <Truck className="w-3 h-3 text-stone-400" />
              Flete / Promedio
            </span>
            <div className="mt-1">
              <span className="text-xs font-bold text-[#2C221E] block">
                {formatearMoneda(acopio.fleteCosto || 0)}
              </span>
              <span className="text-[10px] text-stone-500">
                Prom. {promedioLote} kg/jaba
              </span>
            </div>
          </div>
        </div>

        {/* Tabla Detallada de Jabas Clasificadas */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#2C221E] uppercase tracking-wider flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#E65100]" />
            Jabas Clasificadas en Campo ({jabas.length} grupos)
          </h4>

          {jabas.length === 0 ? (
            <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-300">
              <Package className="w-8 h-8 text-stone-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-stone-600">No hay detalle de jabas disponible</p>
              <p className="text-[11px] text-stone-400">
                Este lote fue registrado sin grupos de jabas o aún no se han sincronizado.
              </p>
            </div>
          ) : (
            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200 sticky top-0">
                    <tr>
                      <th className="px-3.5 py-2.5">Variedad</th>
                      <th className="px-3.5 py-2.5">Categoría</th>
                      <th className="px-3.5 py-2.5">Color Jaba</th>
                      <th className="px-3.5 py-2.5 text-right">Cant. Jabas</th>
                      <th className="px-3.5 py-2.5 text-right">Peso Bruto</th>
                      <th className="px-3.5 py-2.5 text-right">Prom./Jaba</th>
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
                          <td className="px-3.5 py-2.5 font-bold text-[#2C221E]">
                            {j.tipoPalta}
                          </td>
                          <td className="px-3.5 py-2.5 font-medium text-stone-700">
                            {j.categoria}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-stone-800 border border-stone-200 shadow-2xs">
                              <span
                                className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                                style={{ backgroundColor: colorHex }}
                              />
                              <span className="font-mono text-[10px] uppercase">{colorHex}</span>
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-black text-[#2C221E]">
                            {cant}
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-bold text-[#E65100]">
                            {formatearKilos(peso)}
                          </td>
                          <td className="px-3.5 py-2.5 text-right text-stone-500 font-medium">
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
        <div className="pt-2 flex justify-end">
          <Button variant="outline" onClick={onClose} className="min-h-[44px]">
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
