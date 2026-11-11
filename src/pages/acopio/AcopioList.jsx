// src/pages/acopio/AcopioList.jsx - Listado histórico y gestión de lotes de acopio BeaverVault
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { acopioService } from '../../services/acopioService';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { AcopioDetalleModal } from './AcopioDetalleModal';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { RefreshButton } from '../../components/common/RefreshButton';
import { Pagination } from '../../components/common/Pagination';
import { formatearFecha, formatearKilos } from '../../utils/formatters';
import {
  Sprout,
  Plus,
  Search,
  Trash2,
  MapPin,
  User,
  Eye,
  Layers,
} from 'lucide-react';

export function AcopioList() {
  const { empresaId } = useAuth();
  const [acopios, setAcopios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Control del modal de detalle de lote y jabas
  const [detalleAcopio, setDetalleAcopio] = useState(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  // Modal interactivo de confirmación para eliminar lote (sin window.confirm)
  const [loteAEliminar, setLoteAEliminar] = useState(null);
  const [eliminandoLote, setEliminandoLote] = useState(false);

  const cargarAcopios = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      setError('');
      const data = await acopioService.listarAcopios(empresaId);
      setAcopios(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'No se pudieron cargar los lotes de acopio desde el servidor.'
      );
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarAcopios();
  }, [cargarAcopios]);

  const handleConfirmarEliminar = async () => {
    if (!loteAEliminar?.acopioId) return;
    try {
      setEliminandoLote(true);
      await acopioService.eliminarAcopio(loteAEliminar.acopioId);
      setLoteAEliminar(null);
      await cargarAcopios();
    } catch (err) {
      setError(err?.response?.data?.message || 'Error al eliminar el lote de acopio.');
    } finally {
      setEliminandoLote(false);
    }
  };

  const handleAbrirDetalle = (acopio) => {
    setDetalleAcopio(acopio);
    setModalDetalleOpen(true);
  };

  // Filtrado reactivo en memoria
  const acopiosFiltrados = acopios.filter((a) => {
    const texto = `${a.origen || ''} ${a.encargadoLote || ''} ${a.estado || ''}`.toLowerCase();
    return texto.includes(searchQuery.toLowerCase());
  });

  // Paginación (10 lotes por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const TAMANO_PAGINA = 10;

  useEffect(() => {
    setPaginaActual(1);
  }, [searchQuery]);

  const itemsPaginados = acopiosFiltrados.slice(
    (paginaActual - 1) * TAMANO_PAGINA,
    paginaActual * TAMANO_PAGINA
  );

  return (
    <div className="space-y-6">
      {/* Cabecera de la vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-100 text-[#E65100]">
              Acopio
            </span>
            <span className="text-xs text-stone-500 font-semibold">Provincia / Campo</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
            Lotes de Acopio
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro inicial de compra en campo y control de pesaje de jabas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <RefreshButton
            onRefresh={cargarAcopios}
            loading={loading}
            title="Recargar lotes"
          />

          <Link
            to="/acopio/nuevo"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E65100] hover:bg-[#cf4700] text-white rounded-xl text-xs font-bold transition-all shadow-sm min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Lote</span>
          </Link>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Barra de búsqueda y filtros */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por fundo, encargado o estado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20 outline-hidden transition-all"
          />
        </div>

        <span className="text-xs font-bold text-stone-500 self-end sm:self-center">
          {acopiosFiltrados.length} {acopiosFiltrados.length === 1 ? 'lote registrado' : 'lotes registrados'}
        </span>
      </div>

      {/* Estado de carga */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 flex flex-col items-center justify-center text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-xs font-bold text-stone-600">Cargando lotes de acopio...</p>
        </div>
      ) : acopiosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-dashed border-stone-300 text-center max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-[#E65100] flex items-center justify-center mx-auto mb-3">
            <Sprout className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#2C221E] mb-1">No se encontraron lotes</h3>
          <p className="text-xs text-stone-500 mb-5">
            {searchQuery
              ? 'No hay lotes que coincidan con el término de búsqueda ingresado.'
              : 'Aún no se han registrado lotes de palta en provincia para esta empresa.'}
          </p>
          <Link
            to="/acopio/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E65100] text-white text-xs font-bold rounded-xl hover:bg-[#cf4700] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Primer Lote
          </Link>
        </div>
      ) : (
        <>
          {/* Vista de Tabla para Escritorio (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Fundo / Origen</th>
                    <th className="px-5 py-3.5">Encargado</th>
                    <th className="px-5 py-3.5">Fecha Acopio</th>
                    <th className="px-5 py-3.5">Jabas & Kilos</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {itemsPaginados.map((item) => {
                    const cantJabas =
                      item.totalJabas ||
                      item.jabas?.reduce((sum, j) => sum + (Number(j.cantidadJabas) || 0), 0) ||
                      0;
                    const pesoTotal =
                      item.totalPesoBruto ||
                      item.jabas?.reduce((sum, j) => sum + (Number(j.pesoBruto) || 0), 0) ||
                      0;
                    const pesoRestante =
                      item.totalPesoActual !== undefined
                        ? item.totalPesoActual
                        : item.jabas?.reduce((sum, j) => sum + (Number(j.pesoActual !== undefined ? j.pesoActual : j.pesoBruto) || 0), 0) ?? pesoTotal;

                    return (
                      <tr key={item.acopioId} className="hover:bg-stone-50/80 transition-colors">
                        <td className="px-5 py-4 font-bold text-[#2C221E]">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#E65100] shrink-0" />
                            <span>{item.origen}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-stone-700 font-medium">
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span>{item.encargadoLote}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-stone-600">
                          {formatearFecha(item.fechaCompra)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="leading-tight">
                            <span className="font-extrabold text-[#2C221E] text-xs flex items-center gap-1">
                              <Layers className="w-3 h-3 text-stone-400" />
                              {cantJabas} jabas
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-bold text-[#E65100]">
                                {formatearKilos(pesoRestante)}
                              </span>
                              {pesoTotal > pesoRestante && (
                                <span className="text-[10px] text-stone-400 font-semibold" title="Total inicial recibido">
                                  / {formatearKilos(pesoTotal)}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge status={item.estado || 'Acopio'} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirDetalle(item)}
                              className="text-stone-700 hover:text-stone-900 hover:bg-stone-100 hover:border-stone-300"
                              title="Ver detalle completo de jabas"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1 text-[#2C221E]" />
                              Detalle
                            </Button>

                            <button
                              type="button"
                              onClick={() => setLoteAEliminar(item)}
                              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar lote"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Paginación Desktop */}
            <Pagination
              currentPage={paginaActual}
              totalItems={acopiosFiltrados.length}
              pageSize={TAMANO_PAGINA}
              onPageChange={setPaginaActual}
            />
          </div>

          {/* Vista de Tarjetas para Smartphones y Tablets Pequeñas (< md) */}
          <div className="md:hidden space-y-3">
            {itemsPaginados.map((item) => {
              const cantJabas =
                item.totalJabas ||
                item.jabas?.reduce((sum, j) => sum + (Number(j.cantidadJabas) || 0), 0) ||
                0;
              const pesoTotal =
                item.totalPesoBruto ||
                item.jabas?.reduce((sum, j) => sum + (Number(j.pesoBruto) || 0), 0) ||
                0;
              const pesoRestante =
                item.totalPesoActual !== undefined
                  ? item.totalPesoActual
                  : item.jabas?.reduce((sum, j) => sum + (Number(j.pesoActual !== undefined ? j.pesoActual : j.pesoBruto) || 0), 0) ?? pesoTotal;

              return (
                <div
                  key={item.acopioId}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-[#2C221E] flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-[#E65100]" />
                        {item.origen}
                      </h3>
                      <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-stone-400" />
                        {item.encargadoLote}
                      </p>
                    </div>
                    <Badge status={item.estado || 'Acopio'} size="sm" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">
                        Fecha
                      </span>
                      <span className="font-semibold text-stone-700">
                        {formatearFecha(item.fechaCompra)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">
                        Jabas / Peso
                      </span>
                      <span className="font-extrabold text-[#2C221E] block">
                        {cantJabas} jabas
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-bold text-[#E65100]">
                          {formatearKilos(pesoRestante)}
                        </span>
                        {pesoTotal > pesoRestante && (
                          <span className="text-[9px] text-stone-400 font-medium">
                            / {formatearKilos(pesoTotal)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAbrirDetalle(item)}
                      className="flex-1 text-[#2C221E] border-stone-300 hover:bg-stone-50 font-bold min-h-[44px]"
                    >
                      <Eye className="w-4 h-4 mr-1 text-[#2C221E]" />
                      Detalle
                    </Button>

                    <button
                      type="button"
                      onClick={() => setLoteAEliminar(item)}
                      className="p-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-stone-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {/* Paginación Mobile */}
            <Pagination
              currentPage={paginaActual}
              totalItems={acopiosFiltrados.length}
              pageSize={TAMANO_PAGINA}
              onPageChange={setPaginaActual}
              className="rounded-2xl"
            />
          </div>
        </>
      )}

      {/* Modal de Detalle Completo de Jabas del Lote */}
      <AcopioDetalleModal
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        acopio={detalleAcopio}
      />

      {/* Modal interactivo de Confirmación para Eliminar Lote */}
      <ConfirmModal
        isOpen={!!loteAEliminar}
        onClose={() => setLoteAEliminar(null)}
        onConfirm={handleConfirmarEliminar}
        title="¿Eliminar este lote de acopio?"
        message={`Se eliminará el lote de "${loteAEliminar?.origen || 'origen'}" (Encargado: ${loteAEliminar?.encargadoLote || '-'}) y todas sus jabas asociadas. Esta acción no se puede deshacer.`}
        confirmText="Eliminar Lote"
        cancelText="Cancelar"
        variant="danger"
        loading={eliminandoLote}
      />
    </div>
  );
}
