// src/pages/acopio/AcopioList.jsx - Listado histórico y gestión de lotes de acopio BeaverVault
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { acopioService } from '../../services/acopioService';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { GastoSeleccionadorModal } from './GastoSeleccionadorModal';
import { AcopioDetalleModal } from './AcopioDetalleModal';
import { formatearFecha, formatearMoneda, formatearKilos } from '../../utils/formatters';
import {
  Sprout,
  Plus,
  Search,
  RefreshCw,
  DollarSign,
  Trash2,
  MapPin,
  User,
  Eye,
  Layers,
  UserCheck,
  Edit2,
} from 'lucide-react';

export function AcopioList() {
  const { empresaId } = useAuth();
  const [acopios, setAcopios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Control del modal de seleccionador
  const [selectedAcopio, setSelectedAcopio] = useState(null);
  const [modalSeleccionadorOpen, setModalSeleccionadorOpen] = useState(false);

  // Control del modal de detalle de lote y jabas
  const [detalleAcopio, setDetalleAcopio] = useState(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

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

  const handleEliminar = async (acopioId) => {
    if (!window.confirm('¿Está seguro de eliminar este lote de acopio y sus jabas asociadas?')) {
      return;
    }
    try {
      await acopioService.eliminarAcopio(acopioId);
      cargarAcopios();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar el lote');
    }
  };

  const handleAbrirSeleccionador = (acopio) => {
    setSelectedAcopio(acopio);
    setModalSeleccionadorOpen(true);
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

  return (
    <div className="space-y-6">
      {/* Cabecera de la vista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-100 text-[#E65100]">
              Acopio
            </span>
            <span className="text-xs text-stone-500 font-semibold">Provincia / Campo</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
            Lotes de Acopio y Jabas
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Registro inicial de fruta en campo, matriz de selección, fletes y liquidación a seleccionadores.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={cargarAcopios}
            disabled={loading}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shadow-xs"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#E65100]' : ''}`} />
          </button>

          <Link
            to="/acopio/nuevo"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#E65100] hover:bg-[#cf4700] text-white rounded-xl text-xs font-bold transition-all shadow-sm min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Lote en Campo</span>
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
                    <th className="px-5 py-3.5">Flete Pactado</th>
                    <th className="px-5 py-3.5">Estado</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {acopiosFiltrados.map((item) => {
                    const cantJabas =
                      item.totalJabas ||
                      item.jabas?.reduce((sum, j) => sum + (Number(j.cantidadJabas) || 0), 0) ||
                      0;
                    const pesoTotal =
                      item.totalPesoBruto ||
                      item.jabas?.reduce((sum, j) => sum + (Number(j.pesoBruto) || 0), 0) ||
                      0;
                    const gastoSel = item.gastos?.find((g) => g.tipoGasto === 'Seleccionador');

                    return (
                      <tr key={item.acopioId} className="hover:bg-stone-50/80 transition-colors">
                        <td className="px-5 py-4 font-bold text-[#2C221E]">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#E65100] shrink-0" />
                            <span>{item.origen}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-stone-700 font-medium">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                              <span>{item.encargadoLote}</span>
                            </div>
                            {gastoSel ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                                <UserCheck className="w-3 h-3 text-emerald-600" />
                                {gastoSel.nombreReceptor} ({formatearMoneda(gastoSel.montoTotal)})
                              </span>
                            ) : (
                              <span className="text-[10px] text-stone-400 font-normal italic">
                                Sin seleccionador
                              </span>
                            )}
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
                            <span className="text-[11px] font-bold text-[#E65100]">
                              {formatearKilos(pesoTotal)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 font-bold text-stone-800">
                          {formatearMoneda(item.fleteCosto || 0)}
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

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirSeleccionador(item)}
                              className={
                                gastoSel
                                  ? 'text-emerald-700 bg-emerald-50/60 border-emerald-200 hover:bg-emerald-100'
                                  : 'text-stone-700 hover:text-[#E65100] hover:border-orange-300'
                              }
                              title={gastoSel ? 'Modificar datos del seleccionador guardado' : 'Registrar pago a seleccionador'}
                            >
                              {gastoSel ? (
                                <>
                                  <Edit2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                  Modificar Sel.
                                </>
                              ) : (
                                <>
                                  <DollarSign className="w-3.5 h-3.5 mr-1 text-[#E65100]" />
                                  Seleccionador
                                </>
                              )}
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleEliminar(item.acopioId)}
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
          </div>

          {/* Vista de Tarjetas para Smartphones y Tablets Pequeñas (< md) */}
          <div className="md:hidden space-y-3">
            {acopiosFiltrados.map((item) => {
              const cantJabas =
                item.totalJabas ||
                item.jabas?.reduce((sum, j) => sum + (Number(j.cantidadJabas) || 0), 0) ||
                0;
              const pesoTotal =
                item.totalPesoBruto ||
                item.jabas?.reduce((sum, j) => sum + (Number(j.pesoBruto) || 0), 0) ||
                0;
              const gastoSel = item.gastos?.find((g) => g.tipoGasto === 'Seleccionador');

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

                  {/* Estado del Seleccionador */}
                  {gastoSel ? (
                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs flex items-center justify-between text-emerald-900">
                      <div className="flex items-center gap-1.5 font-bold">
                        <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Seleccionador: {gastoSel.nombreReceptor}</span>
                      </div>
                      <span className="font-extrabold text-emerald-800">
                        {formatearMoneda(gastoSel.montoTotal)}
                      </span>
                    </div>
                  ) : (
                    <div className="p-2 bg-stone-50 rounded-xl text-[11px] text-stone-400 italic">
                      Sin seleccionador registrado en este lote
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-xs bg-stone-50 p-2.5 rounded-xl border border-stone-100">
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
                      <span className="text-[10px] font-bold text-[#E65100]">
                        {formatearKilos(pesoTotal)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase font-bold block">
                        Flete
                      </span>
                      <span className="font-bold text-[#2C221E]">
                        {formatearMoneda(item.fleteCosto || 0)}
                      </span>
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

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAbrirSeleccionador(item)}
                      className={`flex-1 font-bold min-h-[44px] ${
                        gastoSel
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-300 hover:bg-emerald-100'
                          : 'text-[#E65100] border-orange-200 hover:bg-orange-50'
                      }`}
                    >
                      {gastoSel ? (
                        <>
                          <Edit2 className="w-4 h-4 mr-1 text-emerald-600" />
                          Modificar
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4 mr-1" />
                          Pago
                        </>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleEliminar(item.acopioId)}
                      className="p-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-stone-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal de Pago a Seleccionador */}
      <GastoSeleccionadorModal
        isOpen={modalSeleccionadorOpen}
        onClose={() => setModalSeleccionadorOpen(false)}
        acopio={selectedAcopio}
        gastoExistente={selectedAcopio?.gastos?.find((g) => g.tipoGasto === 'Seleccionador')}
        onSuccess={cargarAcopios}
      />

      {/* Modal de Detalle Completo de Jabas del Lote */}
      <AcopioDetalleModal
        isOpen={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        acopio={detalleAcopio}
      />
    </div>
  );
}
