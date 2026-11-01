// src/pages/acopio/AcopioCreate.jsx - Pantalla completa táctil para nuevo lote de acopio y jabas en campo BeaverVault
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { acopioService } from '../../services/acopioService';
import { CascadeSelect } from '../../components/forms/CascadeSelect';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { PALETA_COLORES_JABA } from '../../utils/constants';
import { formatearKilos, obtenerFechaHoyPeru } from '../../utils/formatters';
import {
  ArrowLeft,
  Plus,
  Trash2,
  PackageCheck,
  Scale,
  MapPin,
  Layers,
  Palette,
  Pipette,
} from 'lucide-react';

export function AcopioCreate() {
  const navigate = useNavigate();
  const { user, empresaId } = useAuth();

  // Fecha actual calculada en la zona horaria de Perú (America/Lima UTC-5)
  const fechaHoyPeru = obtenerFechaHoyPeru();

  // Datos generales del lote
  const [encargadoLote, setEncargadoLote] = useState(user?.nombre || '');
  const [origen, setOrigen] = useState('');
  const [fechaCompra, setFechaCompra] = useState(fechaHoyPeru);

  // Formulario temporal de grupo de jaba
  const [tipoPalta, setTipoPalta] = useState('');
  const [categoria, setCategoria] = useState('');
  const [codigoColor, setCodigoColor] = useState('#10B981'); // Verde por defecto en HEX
  const [cantidadJabas, setCantidadJabas] = useState('');
  const [pesoBruto, setPesoBruto] = useState('');

  // Lista dinámica de grupos de jabas
  const [jabas, setJabas] = useState([]);

  // Estados de control UI
  const [itemError, setItemError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  // Totales acumulados
  const totalJabas = jabas.reduce((acc, curr) => acc + curr.cantidadJabas, 0);
  const totalPesoBruto = jabas.reduce((acc, curr) => acc + curr.pesoBruto, 0);
  const pesoPromedioJaba = totalJabas > 0 ? (totalPesoBruto / totalJabas).toFixed(2) : '0.00';

  // Agregar grupo de jabas a la tabla
  const handleAgregarJaba = (e) => {
    e.preventDefault();
    setItemError('');

    if (!tipoPalta) {
      setItemError('Seleccione el tipo de palta.');
      return;
    }
    if (!categoria) {
      setItemError('Seleccione la categoría correspondiente a la variedad.');
      return;
    }
    if (!codigoColor || !codigoColor.trim()) {
      setItemError('Seleccione o ingrese un código de color para la jaba.');
      return;
    }

    const cant = parseInt(cantidadJabas, 10);
    const peso = parseFloat(pesoBruto);

    if (isNaN(cant) || cant <= 0) {
      setItemError('La cantidad de jabas debe ser un número entero mayor a 0.');
      return;
    }
    if (isNaN(peso) || peso <= 0) {
      setItemError('El peso bruto debe ser mayor a 0 kg.');
      return;
    }

    const nuevaFila = {
      id: Math.random().toString(36).substring(2, 9),
      tipoPalta,
      categoria,
      codigoColor: codigoColor.trim().toUpperCase(),
      cantidadJabas: cant,
      pesoBruto: peso,
    };

    setJabas((prev) => [...prev, nuevaFila]);

    // Limpiar campos de pesaje para agilizar la siguiente jaba
    setCantidadJabas('');
    setPesoBruto('');
  };

  const handleEliminarJaba = (id) => {
    setJabas((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!encargadoLote.trim()) {
      setFormError('El encargado del lote es obligatorio.');
      return;
    }
    if (!origen.trim()) {
      setFormError('El origen / valle de procedencia es obligatorio.');
      return;
    }
    if (!fechaCompra) {
      setFormError('La fecha de compra o acopio es obligatoria.');
      return;
    }
    // Bloqueo estricto de fechas futuras
    if (fechaCompra > fechaHoyPeru) {
      setFormError('No se permite registrar compras con fecha futura.');
      return;
    }
    if (jabas.length === 0) {
      setFormError('Debe agregar al menos un grupo de jabas al lote.');
      return;
    }
    if (!empresaId) {
      setFormError('No se encontró una empresa activa asociada a la sesión.');
      return;
    }

    const creadoPorUsuarioId =
      user?.usuarioId ||
      user?.superAdminId ||
      '00000000-0000-0000-0000-000000000000';

    const payload = {
      empresaId,
      encargadoLote: encargadoLote.trim(),
      fechaCompra,
      origen: origen.trim(),
      creadoPorUsuarioId,
      jabas: jabas.map((j) => ({
        tipoPalta: j.tipoPalta,
        categoria: j.categoria,
        codigoColor: j.codigoColor,
        cantidadJabas: j.cantidadJabas,
        pesoBruto: j.pesoBruto,
      })),
    };

    try {
      setLoading(true);
      await acopioService.crearAcopio(payload);
      navigate('/acopio', { replace: true });
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.response?.data?.detalles ||
        'Error al registrar el lote de acopio en el servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Barra superior de navegación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/acopio"
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Volver al listado"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-orange-100 text-[#E65100]">
                Etapa 1: Provincia
              </span>
              <span className="text-xs text-stone-500 font-semibold">Balanza de Campo</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
              Nuevo Lote de Acopio
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate('/acopio')}
            disabled={loading}
            className="min-h-[44px]"
          >
            Cancelar
          </Button>
        </div>
      </div>

      {formError && <Alert type="error" message={formError} onClose={() => setFormError('')} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda / Central: Formulario de Cabecera y Carga de Jabas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Datos Generales del Lote */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-[#2C221E] uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
              <MapPin className="w-4 h-4 text-[#E65100]" />
              1. Datos de Origen y Encargado
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Origen / Fundo"
                name="origen"
                value={origen}
                onChange={(e) => setOrigen(e.target.value)}
                placeholder="Ej. Huaral - Fundo Santa Rosa"
                required
              />

              <Input
                label="Encargado del Lote"
                name="encargadoLote"
                value={encargadoLote}
                onChange={(e) => setEncargadoLote(e.target.value)}
                placeholder="Ej. Carlos Gómez"
                required
              />

              <Input
                label="Fecha de Compra (Perú)"
                name="fechaCompra"
                type="date"
                value={fechaCompra}
                max={fechaHoyPeru}
                onChange={(e) => setFechaCompra(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Card 2: Ingreso Rápido de Grupos de Jabas */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-[#2C221E] uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#E65100]" />
                2. Clasificación y Pesaje en Balanza
              </h2>
              <span className="text-xs text-stone-500 font-semibold">
                Matriz de Clasificación
              </span>
            </div>

            {itemError && <Alert type="warning" message={itemError} onClose={() => setItemError('')} />}

            <form onSubmit={handleAgregarJaba} className="space-y-4">
              {/* Selector en Cascada de Palta y Categoría */}
              <CascadeSelect
                tipo={tipoPalta}
                categoria={categoria}
                onTipoChange={setTipoPalta}
                onCategoriaChange={setCategoria}
              />

              {/* Selector de Color HEX con Paleta Visual */}
              <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#2C221E] uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#E65100]" />
                    Color de Jaba (Paleta & HEX)
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full border border-stone-300 shadow-xs"
                      style={{ backgroundColor: codigoColor }}
                    />
                    <span className="text-xs font-mono font-bold text-stone-700 uppercase">
                      {codigoColor}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {PALETA_COLORES_JABA.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setCodigoColor(c.hex)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-xs ${
                        codigoColor.toUpperCase() === c.hex.toUpperCase()
                          ? 'border-[#2C221E] ring-2 ring-[#E65100] scale-110'
                          : 'border-white'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={`${c.nombre} (${c.hex})`}
                    />
                  ))}

                  {/* Selector libre nativo */}
                  <label
                    className="relative w-8 h-8 rounded-full border-2 border-dashed border-stone-400 hover:border-[#E65100] flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
                    title="Elegir color personalizado"
                  >
                    <input
                      type="color"
                      value={codigoColor.startsWith('#') ? codigoColor : '#10B981'}
                      onChange={(e) => setCodigoColor(e.target.value.toUpperCase())}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    />
                    <Pipette className="w-4 h-4 text-stone-600" />
                  </label>

                  {/* Entrada manual de código HEX */}
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="text-xs text-stone-400 font-mono">HEX:</span>
                    <input
                      type="text"
                      maxLength={7}
                      value={codigoColor}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (!val.startsWith('#') && val.length > 0) val = '#' + val;
                        setCodigoColor(val.toUpperCase());
                      }}
                      placeholder="#10B981"
                      className="w-24 h-8 px-2 text-xs font-mono uppercase bg-white border border-stone-300 rounded-lg outline-hidden focus:border-[#E65100] focus:ring-1 focus:ring-[#E65100]"
                    />
                  </div>
                </div>
              </div>

              {/* Cantidad de jabas y peso bruto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Cantidad de Jabas"
                  name="cantidadJabas"
                  type="number"
                  min="1"
                  step="1"
                  value={cantidadJabas}
                  onChange={(e) => setCantidadJabas(e.target.value)}
                  placeholder="Ej. 15"
                  required
                />

                <Input
                  label="Peso Bruto Total (kg)"
                  name="pesoBruto"
                  type="number"
                  min="0.1"
                  step="0.01"
                  value={pesoBruto}
                  onChange={(e) => setPesoBruto(e.target.value)}
                  placeholder="Ej. 312.50"
                  required
                />
              </div>

              {/* Botón táctil grande para agregar a la tabla */}
              <button
                type="submit"
                className="w-full h-12 bg-stone-900 hover:bg-[#E65100] text-white font-bold text-sm rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                Agregar Grupo de Jabas al Lote
              </button>
            </form>
          </div>

          {/* Card 3: Tabla Dinámica de Jabas Agregadas */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h2 className="text-sm font-bold text-[#2C221E] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#6D4C41]" />
                3. Detalle de Jabas en el Lote ({jabas.length} grupos)
              </h2>
            </div>

            {jabas.length === 0 ? (
              <div className="text-center py-10 bg-stone-50 rounded-xl border border-dashed border-stone-300">
                <Scale className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-stone-600">No hay jabas añadidas todavía</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Complete los datos de pesaje arriba y presione &quot;Agregar Grupo de Jabas&quot;.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      <th className="px-3.5 py-3">Variedad</th>
                      <th className="px-3.5 py-3">Categoría</th>
                      <th className="px-3.5 py-3">Color</th>
                      <th className="px-3.5 py-3 text-right">Cant. Jabas</th>
                      <th className="px-3.5 py-3 text-right">Peso Bruto</th>
                      <th className="px-3.5 py-3 text-right">Prom./Jaba</th>
                      <th className="px-3.5 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {jabas.map((item) => (
                      <tr key={item.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-3.5 py-3 font-bold text-[#2C221E]">
                          {item.tipoPalta}
                        </td>
                        <td className="px-3.5 py-3 font-semibold text-stone-700">
                          {item.categoria}
                        </td>
                        <td className="px-3.5 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-stone-800 border border-stone-200 shadow-2xs">
                            <span
                              className="w-3 h-3 rounded-full border border-black/15 shrink-0"
                              style={{ backgroundColor: item.codigoColor }}
                            />
                            <span className="font-mono text-[10px]">{item.codigoColor}</span>
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-right font-extrabold text-[#2C221E]">
                          {item.cantidadJabas}
                        </td>
                        <td className="px-3.5 py-3 text-right font-bold text-[#E65100]">
                          {formatearKilos(item.pesoBruto)}
                        </td>
                        <td className="px-3.5 py-3 text-right text-stone-500 font-medium">
                          {(item.pesoBruto / item.cantidadJabas).toFixed(2)} kg
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleEliminarJaba(item.id)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] inline-flex items-center justify-center cursor-pointer"
                            title="Eliminar este grupo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Tarjeta de Resumen en Tiempo Real */}
        <div className="space-y-6">
          <div className="bg-[#2C221E] text-white rounded-2xl p-6 shadow-md border border-stone-800 space-y-5 sticky top-24">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8D8C8]">
                  Resumen de Pesaje
                </span>
                <h3 className="text-base font-extrabold text-white">Totales en Balanza</h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#E65100] flex items-center justify-center text-white shadow-xs">
                <Scale className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900/80 border border-stone-800">
                <span className="text-stone-400 font-medium">Total de Jabas:</span>
                <span className="text-lg font-black text-white">{totalJabas} jabas</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900/80 border border-stone-800">
                <span className="text-stone-400 font-medium">Peso Bruto Total:</span>
                <span className="text-xl font-black text-[#E65100]">
                  {formatearKilos(totalPesoBruto)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-stone-900/80 border border-stone-800">
                <span className="text-stone-400 font-medium">Promedio por Jaba:</span>
                <span className="text-sm font-bold text-[#E8D8C8]">{pesoPromedioJaba} kg/jaba</span>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={jabas.length === 0}
              className="w-full bg-[#E65100] hover:bg-[#cf4700] text-white font-extrabold h-12 text-sm shadow-md min-h-[48px]"
            >
              <PackageCheck className="w-5 h-5 mr-2" />
              Confirmar y Guardar Lote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
