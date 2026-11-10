// src/pages/transporte/TransporteList.jsx - Gestión de transporte y despacho con paleta JOSBECORSA
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { acopioService } from '../../services/acopioService';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Spinner } from '../../components/common/Spinner';
import { Alert } from '../../components/common/Alert';
import { FleteModal } from './FleteModal';
import { Pagination } from '../../components/common/Pagination';
import { RefreshButton } from '../../components/common/RefreshButton';
import { formatearFecha, formatearMoneda } from '../../utils/formatters';
import {
  Truck,
  Search,
  MapPin,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export function TransporteList() {
  const { empresaId } = useAuth();
  const [acopios, setAcopios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedAcopio, setSelectedAcopio] = useState(null);
  const [modalFleteOpen, setModalFleteOpen] = useState(false);

  const cargarDatos = useCallback(async () => {
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
        'No se pudieron cargar los datos de transporte.'
      );
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleAbrirFlete = (acopio) => {
    setSelectedAcopio(acopio);
    setModalFleteOpen(true);
  };

  const acopiosFiltrados = acopios.filter((a) => {
    const texto = `${a.origen || ''} ${a.encargadoLote || ''} ${a.estado || ''}`.toLowerCase();
    return texto.includes(searchQuery.toLowerCase());
  });

  // Paginación (10 despachos por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const TAMANO_PAGINA = 10;

  useEffect(() => {
    setPaginaActual(1);
  }, [searchQuery]);

  const itemsPaginados = acopiosFiltrados.slice(
    (paginaActual - 1) * TAMANO_PAGINA,
    paginaActual * TAMANO_PAGINA
  );

  const lotesEnTransito = acopios.filter(
    (a) => a.estado === 'En Transito' || a.estado === 'En_Transito'
  ).length;
  const totalFleteInvertido = acopios.reduce(
    (acc, curr) => acc + (Number(curr.fleteCosto) || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#E8D8C8]/60 text-[#2C221E] border border-[#E8D8C8]">
              Transporte
            </span>
            <span className="text-xs text-stone-500 font-semibold">Logística Terrestre</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
            Transporte y Fletes hacia Lima
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Asignación de choferes, placas de camiones y monitoreo de lotes en tránsito a la capital.
          </p>
        </div>

        <RefreshButton
          onRefresh={cargarDatos}
          loading={loading}
          title="Recargar datos"
          className="self-start sm:self-auto"
        />
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Tarjetas de Métricas en Tonos Corporativos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Lotes en Tránsito
            </span>
            <p className="text-xl font-extrabold text-[#E65100] mt-0.5">
              {lotesEnTransito} {lotesEnTransito === 1 ? 'lote' : 'lotes'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#E65100] flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Total Invertido en Fletes
            </span>
            <p className="text-xl font-extrabold text-[#2C221E] mt-0.5">
              {formatearMoneda(totalFleteInvertido)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#6D4C41] text-white flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Total Lotes Registrados
            </span>
            <p className="text-xl font-extrabold text-[#2C221E] mt-0.5">
              {acopios.length} lotes
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#2C221E] text-white flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filtrar por origen, chofer o estado..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-xs bg-[#FAFAFC] border border-stone-200 rounded-xl focus:bg-white focus:border-[#E65100] focus:ring-2 focus:ring-[#E65100]/20 outline-hidden transition-all"
          />
        </div>
      </div>

      {/* Contenido */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 flex flex-col items-center justify-center text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-xs font-bold text-[#2C221E]">Cargando datos de transporte...</p>
        </div>
      ) : acopiosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-dashed border-stone-300 text-center max-w-lg mx-auto">
          <Truck className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-[#2C221E] mb-1">Sin lotes de transporte</h3>
          <p className="text-xs text-stone-500">
            No hay lotes disponibles para gestionar fletes.
          </p>
        </div>
      ) : (
        <>
          {/* Tabla Desktop */}
          <div className="hidden md:block bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFC] border-b border-stone-200 text-[#2C221E] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Origen del Lote</th>
                    <th className="px-5 py-3.5">Encargado</th>
                    <th className="px-5 py-3.5">Fecha Acopio</th>
                    <th className="px-5 py-3.5">Flete Pactado</th>
                    <th className="px-5 py-3.5">Estado de Viaje</th>
                    <th className="px-5 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {itemsPaginados.map((item) => {
                    const gastoTrans = item.gastos?.find((g) => g.tipoGasto === 'Transporte');
                    const tieneFlete = Number(item.fleteCosto) > 0 || Boolean(gastoTrans);

                    return (
                      <tr key={item.acopioId} className="hover:bg-[#FAFAFC]/80 transition-colors">
                        <td className="px-5 py-4 font-bold text-[#2C221E]">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-[#E65100] shrink-0" />
                            <div>
                              <span>{item.origen}</span>
                              {gastoTrans?.nombreReceptor && (
                                <p className="text-[10px] text-stone-500 font-semibold flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-stone-400" />
                                  {gastoTrans.nombreReceptor}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-stone-700 font-medium">
                          {item.encargadoLote}
                        </td>
                        <td className="px-5 py-4 text-stone-600">
                          {formatearFecha(item.fechaCompra)}
                        </td>
                        <td className="px-5 py-4 font-extrabold text-[#2C221E]">
                          {formatearMoneda(item.fleteCosto || 0)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge status={item.estado === 'En Transito' ? 'En_Transito' : item.estado} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Button
                            size="sm"
                            onClick={() => handleAbrirFlete(item)}
                            className="bg-[#E65100] hover:bg-[#cf4700] text-white font-bold"
                          >
                            <Truck className="w-3.5 h-3.5 mr-1.5" />
                            {tieneFlete ? 'Actualizar Flete' : 'Contratar Flete'}
                          </Button>
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

          {/* Cards Mobile */}
          <div className="md:hidden space-y-3">
            {itemsPaginados.map((item) => {
              const gastoTrans = item.gastos?.find((g) => g.tipoGasto === 'Transporte');
              const tieneFlete = Number(item.fleteCosto) > 0 || Boolean(gastoTrans);

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
                      <p className="text-xs text-stone-500 mt-0.5">
                        Encargado: {item.encargadoLote}
                      </p>
                      {gastoTrans?.nombreReceptor && (
                        <p className="text-xs text-amber-900 font-bold mt-1 flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-amber-700" />
                          Chofer: {gastoTrans.nombreReceptor}
                        </p>
                      )}
                    </div>
                    <Badge status={item.estado === 'En Transito' ? 'En_Transito' : item.estado} size="sm" />
                  </div>

                  <div className="flex items-center justify-between text-xs bg-[#FAFAFC] p-2.5 rounded-xl border border-stone-200">
                    <span className="text-stone-600 font-semibold">Costo de Flete:</span>
                    <span className="font-extrabold text-[#E65100] text-sm">
                      {formatearMoneda(item.fleteCosto || 0)}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleAbrirFlete(item)}
                    className="w-full bg-[#E65100] hover:bg-[#cf4700] text-white font-bold min-h-[44px]"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    {tieneFlete ? 'Actualizar Chofer / Flete' : 'Contratar Chofer / Flete'}
                  </Button>
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

      {/* Modal de Flete */}
      <FleteModal
        isOpen={modalFleteOpen}
        onClose={() => setModalFleteOpen(false)}
        acopio={selectedAcopio}
        onSuccess={cargarDatos}
      />
    </div>
  );
}
