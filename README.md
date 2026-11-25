# 🥑 JOSBECORSA — BeaverVault Frontend

> **Interfaz Web Integral de Gestión Mayorista: Acopio, Transporte, Distribución, Inventario en Kilos, Punto de Venta (POS) y Control de Fiados**  
> Desarrollado con **React 19**, **Vite 8**, **Tailwind CSS v4**, **React Router v7**, **Axios** y **SheetJS (`xlsx`)**.

[![React](https://img.shields.io/badge/React-19.x-61DAFB.svg?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF.svg?logo=vite&logoColor=white)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v4-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React Router](https://img.shields.io/badge/React%20Router-v7-CA4245.svg?logo=reactrouter&logoColor=white)](https://reactrouter.dev/)
[![Axios](https://img.shields.io/badge/Axios-1.20-5A29E4.svg)](https://axios-http.com/)
[![SheetJS](https://img.shields.io/badge/Export-Excel%20(.xlsx)%20%2F%20CSV-217346.svg)](https://sheetjs.com/)

---

## 📑 Tabla de Contenidos
1. [Descripción del Proyecto](#-1-descripción-del-proyecto)
2. [Flujo Operativo en la Interfaz](#-2-flujo-operativo-en-la-interfaz)
3. [Módulos y Rutas de la Aplicación](#-3-módulos-y-rutas-de-la-aplicación)
4. [Matriz de Clasificación y Paleta de Jabas](#-4-matriz-de-clasificación-y-paleta-de-jabas)
5. [Arquitectura del Frontend](#-5-arquitectura-del-frontend)
6. [Conexión con el Backend, Seguridad y Multi-Empresa](#-6-conexión-con-el-backend-seguridad-y-multi-empresa)
7. [Reportes y Exportación (Excel / CSV)](#-7-reportes-y-exportación-excel--csv)
8. [Identidad Visual y Diseño Responsivo](#-8-identidad-visual-y-diseño-responsivo)
9. [Instalación y Puesta en Marcha](#-9-instalación-y-puesta-en-marcha)
10. [Scripts Disponibles](#-10-scripts-disponibles)

---

## 🏢 1. Descripción del Proyecto

**BeaverVault Frontend** es la aplicación web de **JOSBECORSA S.A.C.** diseñada para operar de extremo a extremo la cadena mayorista de comercialización de palta en el Perú: desde la compra y clasificación por lotes en campo (provincia), pasando por el traslado y descarga en Lima, hasta la venta en balanza por kilogramos, el control de créditos (fiados) y el monitoreo financiero en tiempo real.

La interfaz está pensada para ser clara, rápida y usable tanto en **computadoras de escritorio** como en **dispositivos móviles** (gracias a su barra lateral adaptable y cajón móvil), permitiendo que administradores, encargados de acopio y vendedores operen con trazabilidad completa sin depender de hojas de cálculo manuales.

---

## 🔄 2. Flujo Operativo en la Interfaz

La aplicación guía al usuario a través del mismo ciclo operativo de 4 etapas implementado en el backend:

```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  ETAPA 1: PROVINCIA    │ ───► │  ETAPA 2: TRANSPORTE   │ ───► │    ETAPA 3: LIMA       │ ───► │   ETAPA 4: VENTAS      │
│  Acopio & Jabas        │      │  Gastos de Flete       │      │  Tablero & Reparto     │      │  Balanza POS & Fiados  │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘      └────────────────────────┘
```

1. **Acopio en Provincia (`/acopio`, `/acopio/nuevo`):** Registro de lotes con origen geográfico, responsable y armado de jabas asignando variedad, categoría, color distintivo, cantidad de bultos y peso bruto.
2. **Transporte y Gastos Operativos (`/gastos-operativos`):** Control centralizado de egresos de seleccionadores, flete terrestre (transporte), estibadores y cargadores vinculados a cada lote.
3. **Distribución en Lima (`/distribucion`):** Tablero Kanban para gestionar la llegada de lotes, mover jabas entre ubicaciones (`Camara Frio`, `Puesto Principal`, `Puesto Contingencia`), fraccionar jabas (`DividirJabaModal`) y transformar jabas a kilogramos netos.
4. **Inventario, Ventas POS y Fiados (`/inventario`, `/ventas`, `/paltas-vendidas`, `/fiados`):** Consulta de stock en kilos por puesto, terminal de Punto de Venta (POS) por pesaje en balanza, auditoría de ventas realizadas y gestión de cuentas por cobrar con abonos parciales.

---

## 🧭 3. Módulos y Rutas de la Aplicación

| Ruta | Módulo | Descripción Funcional |
| :--- | :--- | :--- |
| `/login` | **Inicio de Sesión** | Autenticación pública para SuperAdministradores y Usuarios operativos. |
| `/dashboard` | **Panel Principal** | KPIs financieros y operativos, filtros por periodo, gráficos de resumen y exportación a Excel/CSV. |
| `/acopio` | **Acopio en Provincia** | Listado histórico de lotes, detalle completo de jabas (`AcopioDetalleModal`) y gestión de compras. |
| `/acopio/nuevo` | **Nuevo Acopio** | Formulario de registro de lote y pesaje inicial de jabas clasificadas. |
| `/distribucion` | **Distribución en Lima** | Tablero Kanban por ubicación física, traslado de jabas, división proporcional y conversión a kilos. |
| `/inventario` | **Inventario por Puesto** | Monitoreo en tiempo real del stock disponible en kilogramos por puesto y variedad. |
| `/ventas` | **Ventas en Balanza (POS)** | Terminal mayorista para despachar palta por kilos netos, seleccionar método de pago o enviar a fiado. |
| `/paltas-vendidas` | **Paltas Vendidas** | Auditoría histórica de comprobantes, detalle de kilos despachados y actualización de método de pago. |
| `/gastos-operativos` | **Gastos Operativos** | Panel unificado para registrar, editar y auditar gastos de campo, transporte y descarga. *(La ruta `/transporte` redirige aquí).* |
| `/fiados` | **Control de Fiados** | Gestión de créditos otorgados, fechas de vencimiento, abonos parciales (`AbonoFiadoModal`) y liquidación. |
| `/configuracion` | **Configuración** *(Admin)* | Administración de Empresas (Multi-Tenant), Ubicaciones, Usuarios, Roles y SuperAdministradores. |

---

## 🥑 4. Matriz de Clasificación y Paleta de Jabas

Definidas en [`src/utils/constants.js`](src/utils/constants.js) para garantizar coherencia total con las reglas de dominio del backend y evitar errores de captura:

### Matriz de Variedades y Categorías
| Variedad de Palta | Categorías Permitidas |
| :--- | :--- |
| **Fuerte** | `1era`, `2da`, `3era`, `4ta`, `Semimanchada`, `Manchada` |
| **Hass** | `1era`, `2da`, `3era`, `4ta`, `Manchada` |
| **Naval** | `Limpia`, `Manchada` |
| **Villacampa** | `1era`, `Manchada` |

### Paleta Estándar de Colores de Jaba
Para facilitar la identificación visual rápida en campo y almacén, el sistema incluye 9 colores predefinidos:
- `Verde Campo` (`#10B981`), `Azul Real` (`#2563EB`), `Rojo Escarlata` (`#EF4444`), `Amarillo Cítrico` (`#F59E0B`), `Naranja Cosecha` (`#F97316`), `Negro Azabache` (`#1F2937`), `Blanco Puro` (`#F3F4F6`), `Morado Uva` (`#8B5CF6`) y `Turquesa` (`#06B6D4`).

---

## 🏛️ 5. Arquitectura del Frontend

El código fuente sigue una estructura modular por responsabilidades dentro de `src/`:

```
src/
├── assets/                      # Recursos estáticos (beavervault_logo.png)
├── components/                  # Componentes reutilizables de interfaz
│   ├── common/                  # Alert, Badge, Button, ConfirmModal, Input, Modal,
│   │                            # Pagination, PeriodFilter, ProtectedRoute, RefreshButton, Spinner
│   ├── forms/                   # Select y CascadeSelect (selectores dependientes)
│   └── layout/                  # MainLayout, Navbar, Sidebar, MobileDrawer
├── context/                     # Estado global de la aplicación
│   └── AuthContext.jsx          # Sesión JWT, usuario actual, empresa activa (Multi-Tenant) y roles
├── hooks/                       # Hooks personalizados
│   └── useAuth.js               # Acceso tipado/limpio al AuthContext
├── pages/                       # Vistas y modales organizados por módulo de negocio
│   ├── acopio/                  # AcopioList, AcopioCreate, AcopioDetalleModal
│   ├── auth/                    # Login
│   ├── configuracion/           # ConfiguracionView
│   ├── dashboard/               # Dashboard
│   ├── distribucion/            # DistribucionView, DividirJabaModal
│   ├── fiados/                  # FiadosList, AbonoFiadoModal
│   ├── gastos/                  # GastosOperativos, RegistrarGastoModal
│   ├── inventario/              # InventarioView
│   └── ventas/                  # PuntoVentaPOS, PaltasVendidasView
├── services/                    # Capa de comunicación HTTP y exportación
│   ├── api.js                   # Instancia Axios e interceptores JWT / 401
│   ├── authService.js           # Login y verificación de sesión
│   ├── acopioService.js         # Lotes y jabas
│   ├── distribucionService.js   # Descarga, traslados y división de jabas
│   ├── gastoService.js          # Gastos operativos
│   ├── inventarioService.js     # Stock en kilos por puesto/empresa
│   ├── ventaService.js          # Ventas POS, historial y fiados
│   ├── configService.js         # Empresas, ubicaciones, roles, usuarios y superadmins
│   └── exportService.js         # Generación de reportes Excel (.xlsx) y CSV
├── utils/                       # Utilidades y reglas compartidas
│   ├── constants.js             # Matriz de clasificación, ubicaciones e iconos, paleta de jabas
│   └── formatters.js            # Formateo de fechas, monedas (S/.) y pesos
├── App.jsx                      # Enrutador principal (React Router v7)
├── main.jsx                     # Punto de entrada React
└── index.css                    # Configuración Tailwind CSS v4 y variables de tema
```

---

## 🔒 6. Conexión con el Backend, Seguridad y Multi-Empresa

- **Cliente HTTP Centralizado ([`src/services/api.js`](src/services/api.js)):**
  - Lee la URL base desde `VITE_API_URL` (por defecto `/api`).
  - **Interceptor de Salida:** Inyecta automáticamente `Authorization: Bearer <token>` desde `localStorage` en cada petición.
  - **Interceptor de Respuesta:** Ante un código `401 Unauthorized`, limpia `token` y `user` de `localStorage` y redirige automáticamente a `/login`.
- **Proxy de Desarrollo ([`vite.config.js`](vite.config.js)):**
  - Redirige las peticiones `/api/*` hacia `http://localhost:3000` (el backend de BeaverVault), evitando problemas de CORS en desarrollo local.
- **Rutas Protegidas y Contexto Multi-Tenant:**
  - `ProtectedRoute` restringe el acceso a las vistas internas si no existe sesión válida.
  - `AuthContext` gestiona la empresa activa (`empresaId` persistida en `localStorage`) y sincroniza el catálogo de empresas y roles disponibles para el usuario autenticado.

---

## 📊 7. Reportes y Exportación (Excel / CSV)

El servicio [`src/services/exportService.js`](src/services/exportService.js) utiliza **SheetJS (`xlsx`)** para generar reportes contables descargables directamente desde el navegador (`Reporte_Financiero_BeaverVault_YYYY-MM-DD.xlsx`) sin sobrecargar al servidor.

El libro de Excel consolidado incluye **4 hojas de trabajo**:
1. **Resumen Ejecutivo:** Ingresos totales (`S/.`), gastos operativos (`S/.`), margen operativo neto, kilos vendidos, stock actual en Lima y conteo de transacciones.
2. **Detalle de Ventas:** Ticket, fecha/hora, puesto, vendedor, variedad, categoría, kilos vendidos, precio unitario, subtotal y método de pago.
3. **Gastos Operativos:** Fecha, tipo de gasto, beneficiario, lote vinculado, cantidad de jabas, tarifa por jaba, monto total y concepto.
4. **Inventario Actual:** Puesto/ubicación, tipo de ubicación, variedad, categoría y stock disponible (`kg`).

---

## 🎨 8. Identidad Visual y Diseño Responsivo

La interfaz implementa la paleta corporativa **BeaverVault** mediante variables CSS en [`src/index.css`](src/index.css) y utilidades de **Tailwind CSS v4**:

| Token | Color | Uso Principal |
| :--- | :--- | :--- |
| `--color-primary` | `#E65100` (Naranja Construcción) | Botones de acción principal (CTA), elemento activo en menú y acentos. |
| `--color-neutral-dark` | `#2C221E` (Marrón Carbón) | Sidebar, encabezados, textos principales y navegación. |
| `--color-brand-brown` | `#6D4C41` (Marrón Castor) | Detalles de marca y banners. |
| `--color-bg-base` | `#FAFAFC` (Blanco Marfil) | Fondo general de la aplicación. |
| `--color-kraft` | `#E8D8C8` (Beis Cartón / Kraft) | Subtítulos de marca y fondos neutros suaves. |
| `--color-cyan-tech` | `#0288D1` (Azul Cero) | Badges y detalles técnicos específicos. |

---

## 🚀 9. Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js:** Versión `20.x` o `22.x` LTS.
- **Gestor de paquetes:** `npm` (incluido con Node.js).
- **Backend en ejecución:** El servidor de **BeaverVault Backend** debe estar corriendo (por defecto en `http://localhost:3000`) para autenticar usuarios y consumir los endpoints.

### Paso a Paso

1. **Situarse en la carpeta del proyecto frontend:**
   ```bash
   cd BeaverVaultFrontend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno (`.env`):**  
   Copia el archivo de ejemplo [`.env.example`](.env.example) a `.env` en la raíz del proyecto:
   ```env
   # URL base de la API (con '/api' usa el proxy de Vite hacia http://localhost:3000)
   VITE_API_URL=/api
   ```
   > Si en producción o staging el backend está en otro dominio o puerto, reemplaza `/api` por la URL completa de la API (por ejemplo, `https://api.tudominio.com/api`).

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   *Vite iniciará la aplicación localmente (por defecto en `http://localhost:5173`) con Hot Module Replacement (HMR).*

---

## 🛠️ 10. Scripts Disponibles

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Levanta el servidor de desarrollo Vite con recarga instantánea (HMR) y proxy `/api` → `localhost:3000`. |
| `npm run build` | Genera el bundle optimizado de producción en la carpeta `dist/`. |
| `npm run preview` | Sirve localmente el contenido compilado de `dist/` para validar el build de producción. |
| `npm run lint` | Ejecuta ESLint sobre todo el proyecto para verificar calidad de código y reglas de React Hooks. |

---

### 👥 Equipo
Desarrollado para **JOSBECORSA S.A.C.** — Sistema BeaverVault Frontend.
