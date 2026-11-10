// src/pages/configuracion/ConfiguracionView.jsx - Panel de configuración maestro (Tenants, Ubicaciones, Usuarios, Roles)
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { configService } from '../../services/configService';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/forms/Select';
import { Alert } from '../../components/common/Alert';
import { Spinner } from '../../components/common/Spinner';
import { Modal } from '../../components/common/Modal';
import { RefreshButton } from '../../components/common/RefreshButton';
import { UBICACIONES } from '../../utils/constants';
import {
  Building,
  MapPin,
  Users,
  ShieldCheck,
  UserCog,
  Plus,
} from 'lucide-react';

export function ConfiguracionView() {
  const { empresaId } = useAuth();
  const [activeTab, setActiveTab] = useState('empresas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Estados de datos
  const [empresas, setEmpresas] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [superAdmins, setSuperAdmins] = useState([]);

  // Estados de modales
  const [modalEmpresaOpen, setModalEmpresaOpen] = useState(false);
  const [nombreEmpresa, setNombreEmpresa] = useState('');

  const [modalUbicacionOpen, setModalUbicacionOpen] = useState(false);
  const [nombreUbicacion, setNombreUbicacion] = useState('');
  const [tipoUbicacion, setTipoUbicacion] = useState('Puesto Principal');

  const [modalUsuarioOpen, setModalUsuarioOpen] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [correoUsuario, setCorreoUsuario] = useState('');
  const [contrasenaUsuario, setContrasenaUsuario] = useState('');
  const [rolUsuarioId, setRolUsuarioId] = useState('');

  const [modalRolOpen, setModalRolOpen] = useState(false);
  const [nombreRol, setNombreRol] = useState('');
  const [descRol, setDescRol] = useState('');

  const [saving, setSaving] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [empData, rolData, saData] = await Promise.all([
        configService.listarEmpresas(),
        configService.listarRoles(),
        configService.listarSuperAdmins(),
      ]);
      setEmpresas(empData);
      setRoles(rolData);
      setSuperAdmins(saData);

      if (empresaId) {
        const [ubData, usData] = await Promise.all([
          configService.listarUbicaciones(empresaId),
          configService.listarUsuarios(empresaId),
        ]);
        setUbicaciones(ubData);
        setUsuarios(usData);
      }
    } catch (err) {
      setError('Error al sincronizar datos de configuración: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Manejador crear empresa
  const handleCrearEmpresa = async (e) => {
    e.preventDefault();
    if (!nombreEmpresa.trim()) return;
    try {
      setSaving(true);
      await configService.crearEmpresa({ nombre: nombreEmpresa.trim() });
      setSuccess('Empresa creada correctamente');
      setModalEmpresaOpen(false);
      setNombreEmpresa('');
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear empresa');
    } finally {
      setSaving(false);
    }
  };

  // Manejador crear ubicación
  const handleCrearUbicacion = async (e) => {
    e.preventDefault();
    if (!nombreUbicacion.trim() || !empresaId) return;
    try {
      setSaving(true);
      await configService.crearUbicacion({
        empresaId,
        nombre: nombreUbicacion.trim(),
        tipo: tipoUbicacion,
      });
      setSuccess('Ubicación agregada correctamente');
      setModalUbicacionOpen(false);
      setNombreUbicacion('');
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear ubicación');
    } finally {
      setSaving(false);
    }
  };

  // Manejador crear usuario
  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    if (!nombreUsuario.trim() || !correoUsuario.trim() || !contrasenaUsuario || !rolUsuarioId) {
      setError('Complete todos los campos del usuario.');
      return;
    }
    try {
      setSaving(true);
      await configService.crearUsuario({
        empresaId,
        rolId: rolUsuarioId,
        nombre: nombreUsuario.trim(),
        correo: correoUsuario.trim(),
        contrasena: contrasenaUsuario,
      });
      setSuccess('Usuario registrado con éxito');
      setModalUsuarioOpen(false);
      setNombreUsuario('');
      setCorreoUsuario('');
      setContrasenaUsuario('');
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar usuario');
    } finally {
      setSaving(false);
    }
  };

  // Manejador crear rol
  const handleCrearRol = async (e) => {
    e.preventDefault();
    if (!nombreRol.trim()) return;
    try {
      setSaving(true);
      await configService.crearRol({
        nombre: nombreRol.trim(),
        descripcion: descRol.trim() || null,
      });
      setSuccess('Rol creado exitosamente');
      setModalRolOpen(false);
      setNombreRol('');
      setDescRol('');
      cargarDatos();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear rol');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: 'empresas', label: 'Empresas', icon: Building, count: empresas.length },
    { id: 'ubicaciones', label: 'Puestos y Almacenes', icon: MapPin, count: ubicaciones.length },
    { id: 'usuarios', label: 'Usuarios', icon: Users, count: usuarios.length },
    { id: 'roles', label: 'Roles y Permisos', icon: ShieldCheck, count: roles.length },
    { id: 'superadmins', label: 'Super Administradores', icon: UserCog, count: superAdmins.length },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-stone-100 text-stone-700 border border-stone-200">
              Administración
            </span>
            <span className="text-xs text-stone-500 font-semibold">Parámetros del Sistema</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#2C221E] tracking-tight">
            Configuración del Sistema
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Administración de empresas, puestos de venta, accesos de usuarios y roles autorizados.
          </p>
        </div>

        <RefreshButton
          onRefresh={cargarDatos}
          loading={loading}
          title="Recargar configuración"
          className="self-start sm:self-auto"
        />
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

      {/* Barra de pestañas */}
      <div className="flex gap-1.5 p-1 rounded-2xl bg-stone-100 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap min-h-[42px] cursor-pointer ${
                active
                  ? 'bg-white text-[#2C221E] shadow-xs'
                  : 'text-stone-500 hover:text-stone-800 hover:bg-stone-200/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#E65100]' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                active ? 'bg-orange-100 text-[#E65100]' : 'bg-stone-200 text-stone-600'
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contenido según pestaña */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 border border-stone-200 flex flex-col items-center justify-center text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-xs font-bold text-stone-600">Cargando parámetros...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-5">
          {/* 1. EMPRESAS */}
          {activeTab === 'empresas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-[#2C221E]">Empresas Registradas</h3>
                <Button
                  size="sm"
                  onClick={() => setModalEmpresaOpen(true)}
                  className="bg-[#E65100] hover:bg-[#cf4700] text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> Nueva Empresa
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {empresas.map((emp) => (
                  <div key={emp.empresaId || emp.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 text-[#E65100] flex items-center justify-center font-bold">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#2C221E]">{emp.nombre}</p>
                        <span className="text-[10px] text-stone-400">ID: {emp.empresaId || emp.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. UBICACIONES */}
          {activeTab === 'ubicaciones' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-[#2C221E]">Puntos Físicos y Almacenes</h3>
                <Button
                  size="sm"
                  onClick={() => setModalUbicacionOpen(true)}
                  className="bg-[#E65100] hover:bg-[#cf4700] text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> Nueva Ubicación
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {ubicaciones.map((ub) => (
                  <div key={ub.ubicacionId} className="p-4 rounded-xl border border-stone-200 bg-[#FAFAFC] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E8D8C8]/60 text-[#2C221E] border border-[#E8D8C8]">
                        {ub.tipo}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-[#2C221E]">{ub.nombre}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. USUARIOS */}
          {activeTab === 'usuarios' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-[#2C221E]">Usuarios del Personal</h3>
                <Button
                  size="sm"
                  onClick={() => setModalUsuarioOpen(true)}
                  className="bg-[#E65100] hover:bg-[#cf4700] text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> Nuevo Usuario
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {usuarios.map((usr) => (
                  <div key={usr.usuarioId} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#2C221E] text-white flex items-center justify-center font-bold text-xs">
                        {usr.nombre?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#2C221E]">{usr.nombre}</p>
                        <p className="text-[11px] text-stone-500">{usr.correo}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. ROLES */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-[#2C221E]">Roles de Autorización</h3>
                <Button
                  size="sm"
                  onClick={() => setModalRolOpen(true)}
                  className="bg-[#E65100] hover:bg-[#cf4700] text-white"
                >
                  <Plus className="w-4 h-4 mr-1" /> Nuevo Rol
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {roles.map((rol) => (
                  <div key={rol.rolId} className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1">
                    <p className="text-xs font-bold text-[#2C221E]">{rol.nombre}</p>
                    <p className="text-[11px] text-stone-500">{rol.descripcion || 'Sin descripción'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. SUPER ADMINS */}
          {activeTab === 'superadmins' && (
            <div className="space-y-4">
              <div className="border-b border-stone-100 pb-3">
                <h3 className="text-sm font-bold text-[#2C221E]">Cuentas Super Administrador</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {superAdmins.map((sa) => (
                  <div key={sa.superAdminId} className="p-4 rounded-xl border border-stone-200 bg-[#FAFAFC] flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#2C221E] text-[#E8D8C8] flex items-center justify-center font-bold">
                      <UserCog className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#2C221E]">{sa.nombre}</p>
                      <p className="text-[11px] text-stone-500">{sa.correo}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modales de Creación */}
      <Modal
        isOpen={modalEmpresaOpen}
        onClose={() => setModalEmpresaOpen(false)}
        title="Crear Nueva Empresa (Tenant)"
      >
        <form onSubmit={handleCrearEmpresa} className="space-y-4">
          <Input
            label="Razón Social / Nombre"
            name="nombreEmpresa"
            value={nombreEmpresa}
            onChange={(e) => setNombreEmpresa(e.target.value)}
            placeholder="Ej. JOSBECORSA PALTA SAC"
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalEmpresaOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="bg-[#E65100] text-white">
              Guardar Empresa
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalUbicacionOpen}
        onClose={() => setModalUbicacionOpen(false)}
        title="Agregar Punto / Ubicación"
      >
        <form onSubmit={handleCrearUbicacion} className="space-y-4">
          <Input
            label="Nombre Descriptivo"
            name="nombreUbicacion"
            value={nombreUbicacion}
            onChange={(e) => setNombreUbicacion(e.target.value)}
            placeholder="Ej. Puesto 14 - Mercado Santa Anita"
            required
          />
          <Select
            label="Tipo Oficial de Ubicación"
            name="tipoUbicacion"
            value={tipoUbicacion}
            onChange={(e) => setTipoUbicacion(e.target.value)}
            options={UBICACIONES}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalUbicacionOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="bg-[#E65100] text-white">
              Guardar Ubicación
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalUsuarioOpen}
        onClose={() => setModalUsuarioOpen(false)}
        title="Registrar Usuario Operativo"
      >
        <form onSubmit={handleCrearUsuario} className="space-y-4">
          <Input
            label="Nombre Completo"
            name="nombreUsuario"
            value={nombreUsuario}
            onChange={(e) => setNombreUsuario(e.target.value)}
            placeholder="Ej. Mario Rivera"
            required
          />
          <Input
            label="Correo Electrónico"
            name="correoUsuario"
            type="email"
            value={correoUsuario}
            onChange={(e) => setCorreoUsuario(e.target.value)}
            placeholder="mario@josbecorsa.com"
            required
          />
          <Input
            label="Contraseña de Acceso"
            name="contrasenaUsuario"
            type="password"
            value={contrasenaUsuario}
            onChange={(e) => setContrasenaUsuario(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />
          <Select
            label="Rol Asignado"
            name="rolUsuarioId"
            value={rolUsuarioId}
            onChange={(e) => setRolUsuarioId(e.target.value)}
            options={roles.map((r) => ({ value: r.rolId, label: r.nombre }))}
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalUsuarioOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="bg-[#E65100] text-white">
              Guardar Usuario
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={modalRolOpen}
        onClose={() => setModalRolOpen(false)}
        title="Crear Rol de Seguridad"
      >
        <form onSubmit={handleCrearRol} className="space-y-4">
          <Input
            label="Nombre del Rol"
            name="nombreRol"
            value={nombreRol}
            onChange={(e) => setNombreRol(e.target.value)}
            placeholder="Ej. Operador de Balanza"
            required
          />
          <Input
            label="Descripción"
            name="descRol"
            value={descRol}
            onChange={(e) => setDescRol(e.target.value)}
            placeholder="Permite acceso exclusivo al módulo de pesaje y ventas"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setModalRolOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving} className="bg-[#E65100] text-white">
              Guardar Rol
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
