// src/App.jsx - Enrutador y proveedores principales con MainLayout
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/dashboard/Dashboard';
import { AcopioList } from './pages/acopio/AcopioList';
import { AcopioCreate } from './pages/acopio/AcopioCreate';
import { TransporteList } from './pages/transporte/TransporteList';
import { DistribucionView } from './pages/distribucion/DistribucionView';
import { InventarioView } from './pages/inventario/InventarioView';
import { PuntoVentaPOS } from './pages/ventas/PuntoVentaPOS';
import { GastosOperativos } from './pages/gastos/GastosOperativos';
import { FiadosList } from './pages/fiados/FiadosList';
import { ConfiguracionView } from './pages/configuracion/ConfiguracionView';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Ruta pública de Login */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas dentro del MainLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Etapa 1: Acopio */}
            <Route path="acopio" element={<AcopioList />} />
            <Route path="acopio/nuevo" element={<AcopioCreate />} />

            {/* Etapa 2: Transporte */}
            <Route path="transporte" element={<TransporteList />} />

            {/* Etapa 3: Distribución */}
            <Route path="distribucion" element={<DistribucionView />} />

            {/* Inventario por Puesto */}
            <Route path="inventario" element={<InventarioView />} />

            {/* Etapa 4: Ventas POS */}
            <Route path="ventas" element={<PuntoVentaPOS />} />
            
            {/* Gastos Operativos */}
            <Route path="gastos-operativos" element={<GastosOperativos />} />

            {/* Fiados */}
            <Route path="fiados" element={<FiadosList />} />

            {/* Configuración */}
            <Route path="configuracion" element={<ConfiguracionView />} />
          </Route>

          {/* Redirecciones automáticas */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
