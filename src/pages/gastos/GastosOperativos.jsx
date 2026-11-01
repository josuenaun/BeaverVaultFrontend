// src/pages/gastos/GastosOperativos.jsx - Panel de monitoreo y edición de Gastos Operativos BeaverVault
import { useState, useEffect, useCallback, useId } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { gastoService } from '../../services/gastoService';
import { acopioService } from '../../services/acopioService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { Modal } from '../../components/common/Modal';
import { formatearMoneda, formatearFecha } from '../../utils/formatters';
import {
  ReceiptText,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Truck,
  UserCheck,
  PackageCheck,
  Edit2,
  Trash2,
  MapPin,
} from 'lucide-react';

const TIPOS_FILTRO = [
  { id: 'TODOS', label: 'Todos los Gastos' },
  { id: 'Seleccionador', label: 'Seleccionadores (Campo)' },
  { id: 'Transporte', label: 'Fletes (Transporte)' },
  { id: 'Descarga', label: 'Descarga (Lima)' },
];

export function GastosOperativos() {
  const { empresaId } = useAuth();
  const conceptoEditId = useId();

  const [gastos, setGastos] = useState([]);
  const [acopios, setAcopios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [filtroAcopio, setFiltroAcopio] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal de edición de gasto
  const [gastoAEditar, setGastoAEditar] = useState(null);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [editNombre, setEditNombre] = useState('');
  const [editCantidad, setEditCantidad] = useState('');
  const [editTarifa, setEditTarifa] = useState('');
  const [editConcepto, setEditConcepto] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const cargarDatos = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      setError('');
      const [listaGastos, listaAcopios] = await Promise.all([
        gastoService.listarGastosPorEmpresa(empresaId),
        acopioService.listarAcopios(empresaId),
      ]);
      setGastos(listaGastos);
      setAcopios(listaAcopios);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'No se pudieron cargar los gastos operativos.'
      );
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Abrir modal de edición para un gasto
  const handleAbrirEditar = (gasto) => {
    setGastoAEditar(gasto);
    setEditNombre(gasto.nombreReceptor || '');
    setEditCantidad(gasto.cantidadJabas !== null && gasto.cantidadJabas !== undefined ? String(gasto.cantidadJabas) : '');
    setEditTarifa(gasto.tarifaPorJaba !== null && gasto.tarifaPorJaba !== undefined ? String(gasto.tarifaPorJaba) : '');
    setEditConcepto(gasto.concepto || '');
    setEditError('');
    setModalEditOpen(true);
  };

  // Guardar cambios (Sobrescribir registro en DB)
  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!gastoAEditar?.gastoId) return;

    if (!editNombre.trim()) {
      setEditError('Ingrese el nombre del receptor/chofer.');
      return;
    }

    const cant = Number(editCantidad) || 0;
    const tarifa = Number(editTarifa) || 0;

    // Obtener el lote para validar tope de jabas si aplica
    const acopioAsociado = acopios.find((a) => a.acopioId === gastoAEditar.acopioId);
    const totalJabasAcopio =
      acopioAsociado?.totalJabas ||
      acopioAsociado?.jabas?.reduce((s, j) => s + (Number(j.cantidadJabas) || 0), 0) ||
      0;

    // Regla de Negocio: Para gastos por jaba, la cantidad no puede superar el acopio
    if (gastoAEditar.tipoGasto !== 'Transporte' && totalJabasAcopio > 0 && cant > totalJabasAcopio) {
      setEditError(
        `La cantidad de jabas (${cant}) no puede ser mayor a las jabas registradas en el acopio (${totalJabasAcopio} jabas).`
      );
      return;
    }

    let montoCalculado = gastoAEditar.montoTotal;
    if (cant > 0 && tarifa > 0) {
      montoCalculado = Number((cant * tarifa).toFixed(2));
    } else if (tarifa > 0 && cant === 0) {
      montoCalculado = tarifa;
    }

    try {
      setEditLoading(true);
      setEditError('');
      await gastoService.actualizarGasto(gastoAEditar.gastoId, {
        nombreReceptor: editNombre.trim(),
        cantidadJabas: cant > 0 ? cant : null,
        tarifaPorJaba: tarifa > 0 ? tarifa : null,
        montoTotal: montoCalculado,
        concepto: editConcepto.trim(),
      });

      setModalEditOpen(false);
      cargarDatos();
    } catch (err) {
      setEditError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Error al actualizar el gasto operativo'
      );
    } finally {
      setEditLoading(false);
    }
  };

  const handleEliminarGasto = async (gastoId) => {
    if (!window.confirm('¿Está seguro de eliminar este registro de gasto operativo?')) {
      return;
    }
    try {
      await gastoService.eliminarGasto(gastoId);
      cargarDatos();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar el gasto');
    }
  };

  // Filtrado reactivo en memoria
  const gastosFiltrados = gastos.filter((g) => {
    // Filtro por tipo
    if (filtroTipo === 'Seleccionador' && g.tipoGasto !== 'Seleccionador') return false;
    if (filtroTipo === 'Transporte' && g.tipoGasto !== 'Transporte') return false;
    if (filtroTipo === 'Descarga' && g.tipoGasto !== 'Estibador' && g.tipoGasto !== 'Cargador') return false;

    // Filtro por acopio
    if (filtroAcopio && g.acopioId !== filtroAcopio) return false;

    // Filtro por texto
    const txt = `${g.nombreReceptor || ''} ${g.concepto || ''} ${g.tipoGasto || ''} ${g.acopioOrigen || ''} ${g.acopioEncargado || ''}`.toLowerCase();
    return txt.includes(searchQuery.toLowerCase());
  });

  // Métricas acumuladas
  const totalInvertido = gastos.reduce((sum, g) => sum + (Number(g.montoTotal) || 0), 0);
  const totalSeleccionador = gastos
    .filter((g) => g.tipoGasto === 'Seleccionador')
    .reduce((sum, g) => sum + (Number(g.montoTotal) || 0), 0);
  const totalTransporte = gastos
    .filter((g) => g.tipoGasto === 'Transporte')
    .reduce((sum, g) => sum + (Number(g.montoTotal) || 0), 0);
  const totalDescarga = gastos
    .filter((g) => g.tipoGasto === 'Estibador' || g.tipoGasto === 'Cargador')
    .reduce((sum, g) => sum + (Number(g.montoTotal) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#E8D8C8]/70 text-[#2C221E] border border-[#E8D8C8]">
              Finanzas Operativas
            </span>
            <span className="text-xs text-stone-500 font-semibold">Trazabilidad de Gastos</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
            Monitoreo de Gastos Operativos
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Liquidación ordenada de Seleccionadores (Campo), Fletes (Transporte) y Cuadrilla de Descarga (Lima).
          </p>
        </div>

        <button
          type="button"
          onClick={cargarDatos}
          disabled={loading}
          className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shadow-xs self-start sm:self-auto"
          title="Recargar gastos"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#E65100]' : ''}`} />
        </button>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Tarjetas de Métricas Ejecutivas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Total Invertido
            </span>
            <p className="text-xl font-extrabold text-[#E65100] mt-0.5">
              {formatearMoneda(totalInvertido)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E65100] flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Seleccionadores
            </span>
            <p className="text-xl font-extrabold text-[#2C221E] mt-0.5">
              {formatearMoneda(totalSeleccionador)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Fletes a Lima
            </span>
            <p className="text-xl font-extrabold text-[#2C221E] mt-0.5">
              {formatearMoneda(totalTransporte)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Descarga / Cuadrilla
            </span>
            <p className="text-xl font-extrabold text-[#2C221E] mt-0.5">
              {formatearMoneda(totalDescarga)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center font-bold">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Pestañas y Filtros */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3">
        {/* Pestañas de tipo de gasto */}
        <div className="flex rounded-xl bg-stone-100 p-1 overflow-x-auto gap-1">
          {TIPOS_FILTRO.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroTipo(tab.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filtroTipo === tab.id
                  ? 'bg-white text-[#2C221E] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Buscador y selector de acopio */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por receptor, chofer o concepto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 text-xs bg-[#FAFAFC] border border-stone-200 rounded-xl focus:bg-white focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20 outline-hidden transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-stone-400 shrink-0 hidden sm:block" />
            <select
              value={filtroAcopio}
              onChange={(e) => setFiltroAcopio(e.target.value)}
              className="h-11 px-3 text-xs bg-[#FAFAFC] border border-stone-200 rounded-xl focus:bg-white focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20 outline-hidden transition-all w-full sm:w-60"
            >
              <option value="">Todos los Acopios / Lotes</option>
              {acopios.map((a) => (
                <option key={a.acopioId} value={a.acopioId}>
                  {a.origen} ({formatearFecha(a.fechaCompra)})
                </option>
              ))}
            </select>
            <span className="text-xs font-bold text-stone-500 whitespace-nowrap hidden md:inline">
              {gastosFiltrados.length} registros
            </span>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 flex flex-col items-center justify-center text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-xs font-bold text-[#2C221E]">Cargando gastos operativos...</p>
        </div>
      ) : gastosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-dashed border-stone-300 text-center max-w-lg mx-auto">
          <ReceiptText className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#2C221E] mb-1">Sin gastos registrados</h3>
          <p className="text-xs text-stone-500">
            {searchQuery || filtroAcopio || filtroTipo !== 'TODOS'
              ? 'No hay registros que coincidan con los filtros aplicados.'
              : 'Aún no se han liquidado pagos para seleccionadores, fletes ni estibadores.'}
          </p>
        </div>
      ) : (
        <>
          {/* Tabla para Desktop (>= md) */}
          <div className="hidden md:block bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFC] border-b border-stone-200 text-[#2C221E] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Tipo de Gasto</th>
                    <th className="px-5 py-3.5">Receptor / Responsable</th>
                    <th className="px-5 py-3.5">Lote de Acopio</th>
                    <th className="px-5 py-3.5">Jabas & Tarifa</th>
                    <th className="px-5 py-3.5">Monto Total</th>
                    <th className="px-5 py-3.5">Fecha</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {gastosFiltrados.map((g) => {
                    const esSel = g.tipoGasto === 'Seleccionador';
                    const esTrans = g.tipoGasto === 'Transporte';

                    return (
                      <tr key={g.gastoId} className="hover:bg-[#FAFAFC]/80 transition-colors">
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                              esSel
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : esTrans
                                ? 'bg-amber-50 text-amber-900 border-amber-200'
                                : 'bg-sky-50 text-sky-800 border-sky-200'
                            }`}
                          >
                            {esSel ? (
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : esTrans ? (
                              <Truck className="w-3.5 h-3.5 text-amber-700" />
                            ) : (
                              <PackageCheck className="w-3.5 h-3.5 text-sky-600" />
                            )}
                            {g.tipoGasto}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold text-[#2C221E]">
                          <div>
                            <p>{g.nombreReceptor}</p>
                            <p className="text-[11px] text-stone-500 font-normal truncate max-w-xs">
                              {g.concepto}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-stone-700">
                          {g.acopioOrigen ? (
                            <div className="flex items-center gap-1.5 font-semibold">
                              <MapPin className="w-3.5 h-3.5 text-[#E65100]" />
                              <span>{g.acopioOrigen}</span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">No asociado</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-stone-600">
                          {g.cantidadJabas ? (
                            <div>
                              <span className="font-extrabold text-[#2C221E]">
                                {g.cantidadJabas} jabas
                              </span>
                              {g.tarifaPorJaba && (
                                <span className="text-[10px] block text-stone-500">
                                  @ {formatearMoneda(g.tarifaPorJaba)}/jaba
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-black text-sm text-[#E65100]">
                          {formatearMoneda(g.montoTotal)}
                        </td>
                        <td className="px-5 py-4 text-stone-600">
                          {formatearFecha(g.fechaCreacion)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAbrirEditar(g)}
                              className="text-stone-700 hover:text-[#E65100] hover:border-orange-300 font-bold"
                              title="Modificar / Actualizar este gasto"
                            >
                              <Edit2 className="w-3.5 h-3.5 mr-1 text-[#E65100]" />
                              Modificar
                            </Button>

                            <button
                              type="button"
                              onClick={() => handleEliminarGasto(g.gastoId)}
                              className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar registro"
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

          {/* Cards para Mobile (< md) */}
          <div className="md:hidden space-y-3">
            {gastosFiltrados.map((g) => {
              const esSel = g.tipoGasto === 'Seleccionador';
              const esTrans = g.tipoGasto === 'Transporte';

              return (
                <div
                  key={g.gastoId}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                          esSel
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : esTrans
                            ? 'bg-amber-50 text-amber-900 border-amber-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}
                      >
                        {g.tipoGasto}
                      </span>
                      <h4 className="text-sm font-bold text-[#2C221E] mt-1">
                        {g.nombreReceptor}
                      </h4>
                      <p className="text-xs text-stone-500">{g.concepto}</p>
                    </div>

                    <span className="text-base font-extrabold text-[#E65100]">
                      {formatearMoneda(g.montoTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs bg-[#FAFAFC] p-2.5 rounded-xl border border-stone-200">
                    <span className="text-stone-600 flex items-center gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-[#E65100]" />
                      {g.acopioOrigen || 'Sin Acopio'}
                    </span>
                    {g.cantidadJabas && (
                      <span className="font-bold text-[#2C221E]">
                        {g.cantidadJabas} jabas {g.tarifaPorJaba ? `@ S/. ${g.tarifaPorJaba}` : ''}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      onClick={() => handleAbrirEditar(g)}
                      className="flex-1 bg-[#E65100] hover:bg-[#cf4700] text-white font-bold min-h-[44px]"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Modificar Gasto
                    </Button>

                    <button
                      type="button"
                      onClick={() => handleEliminarGasto(g.gastoId)}
                      className="p-2.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-stone-200 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
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

      {/* Modal para Editar / Modificar Gasto Guardado */}
      <Modal
        isOpen={modalEditOpen}
        onClose={() => setModalEditOpen(false)}
        title="Modificar Gasto Operativo"
        subtitle={`Tipo: ${gastoAEditar?.tipoGasto || ''} • Acopio: ${gastoAEditar?.acopioOrigen || '-'}`}
      >
        <form onSubmit={handleGuardarEdicion} className="space-y-4">
          {editError && <Alert type="error" message={editError} onClose={() => setEditError('')} />}

          <Input
            label="Receptor / Chofer / Responsable"
            name="editNombre"
            value={editNombre}
            onChange={(e) => setEditNombre(e.target.value)}
            required
          />

          {gastoAEditar?.tipoGasto !== 'Transporte' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Cantidad de Jabas"
                name="editCantidad"
                type="number"
                min="1"
                step="1"
                value={editCantidad}
                onChange={(e) => setEditCantidad(e.target.value)}
                required
              />

              <Input
                label="Tarifa por Jaba (S/.)"
                name="editTarifa"
                type="number"
                min="0.01"
                step="0.01"
                value={editTarifa}
                onChange={(e) => setEditTarifa(e.target.value)}
                required
              />
            </div>
          ) : (
            <Input
              label="Costo Total Flete (S/.)"
              name="editTarifa"
              type="number"
              min="0.01"
              step="0.01"
              value={editTarifa}
              onChange={(e) => setEditTarifa(e.target.value)}
              required
            />
          )}

          <div>
            <label
              htmlFor={conceptoEditId}
              className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider mb-1.5"
            >
              Concepto / Observaciones
            </label>
            <input
              id={conceptoEditId}
              type="text"
              value={editConcepto}
              onChange={(e) => setEditConcepto(e.target.value)}
              className="w-full h-11 px-3.5 py-2 text-sm text-[#2C221E] bg-white border border-stone-300 rounded-xl shadow-xs outline-hidden focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20"
            />
          </div>

          <div className="pt-2 flex flex-col-reverse sm:flex-row gap-2.5 justify-end">
            <Button
              variant="outline"
              onClick={() => setModalEditOpen(false)}
              disabled={editLoading}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={editLoading}
              className="w-full sm:w-auto bg-[#E65100] hover:bg-[#cf4700] text-white min-h-[44px]"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
