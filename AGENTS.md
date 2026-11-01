# AGENTS.md — BeaverVault Frontend (JOSBECORSA)

> Guía maestra de arquitectura, estándares de desarrollo y reglas de negocio para el frontend del sistema mayorista de comercialización de palta de JOSBECORSA.

---

##  1. Rol y Propósito del Agente

El agente opera como **Arquitecto Frontend y Desarrollador UI Senior**. Su misión es guiar, diseñar e implementar una interfaz de usuario web robusta, modular y altamente reactiva, garantizando:

- **Tecnologías Base Obligatorias:** JavaScript (ES6+), HTML5, CSS3, React y TailwindCSS.
- **Consumo de API:** Comunicación óptima y segura con el backend (`http://localhost:3000/api`).
- **Trazabilidad de Negocio:** Reflejo visual estricto de las **4 etapas operativas** de la palta.
- **Experiencia de Usuario (UX/UI):** Fluida, rápida, accesible y con **diseño 100% responsive**.

---

##  2. Principio Obligatorio: Diseño Web Responsive (Mobile-First)

> [!IMPORTANT]
> **REQUISITO CRÍTICO DE OPERACIÓN EN CAMPO Y ALMACÉN**  
> La plataforma debe ser **100% responsiva y adaptable** a cualquier factor de forma:
> - **Smartphones (Campo / Acopio):** Interfaz ágil para uso con una mano, botones táctiles amplios (mínimo `44x44px`), formularios verticales y modales adaptables.
> - **Tablets (Balanza, Cuadrilla y Cámaras de Frío):** Layouts fluidos en orientación horizontal y vertical, tablas legibles y acceso rápido al teclado numérico.
> - **Escritorio / Laptops (Administración y Liquidaciones):** Vistas maestras enriquecidas, dashboards analíticos y reportes de liquidación completos.

### Reglas Técnicas de Responsividad:
1. **Breakpoints Nativos de TailwindCSS:** Diseñar siempre pensando en pantallas pequeñas y escalar con utilidades responsivas:
   - Móvil base: `< 640px` (estilos por defecto sin prefijo).
   - Tablets pequeñas: `sm:` (`640px+`).
   - Tablets estándar / Laptops compactas: `md:` (`768px+`).
   - Escritorio estándar: `lg:` (`1024px+`).
   - Monitores amplios: `xl:` (`1280px+`).
2. **Tablas de Datos Adaptables:** En pantallas móviles, las tablas complejas deben disponer de scroll horizontal suave (`overflow-x-auto`) o transformarse en tarjetas individuales (*card view*) para evitar desbordes visuales.
3. **Navegación Móvil:** El menú principal (`Sidebar`) debe contar con modo colapsable / cajón deslizante (*drawer*) activable mediante botón tipo hamburguesa en pantallas pequeñas (`< md`).

---

##  3. Dominio y Reglas Operativas del Negocio

Cada componente, formulario y servicio HTTP debe implementar rigurosamente la lógica de las 4 etapas:

### Etapa 1: Provincia (Acopio y Jabas)
- **Registro de Lote de Acopio:** Formulario con código de lote, fecha, flete estimado y tabla dinámica de jabas.
- **Matriz Estricta de Selección (Selector en Cascada):**  
  Al seleccionar el **Tipo de Palta**, el selector de **Categoría** debe actualizarse dinámicamente y permitir *únicamente*:
  - **Fuerte:** `1era`, `2da`, `3era`, `4ta`, `Semimanchada`, `Manchada`.
  - **Hass:** `1era`, `2da`, `3era`, `4ta`, `Manchada`.
  - **Naval:** `Limpia`, `Manchada`.
  - **Villacampa:** `1era`, `Manchada`.
- **Campos por Jaba:** Código de color (ej. Rojo, Azul, Verde), cantidad de jabas y peso bruto total en balanza.
- **Gastos de Seleccionador:** Registro del pago por jaba clasificada (`POST /api/acopios/:id/gastos/seleccionador`).

### Etapa 2: Transporte
- **Despacho hacia Lima:** Contratación de flete con costo pactado, nombre del chofer y placa del camión (`POST /api/acopios/:id/transporte`).
- **Estado Visual:** El lote pasa visualmente al estado `En_Transito` con distintivo visual (Badge amarillo).

### Etapa 3: Lima (Llegada y Distribución)
- **Recepción en Almacén:** Cambio automático/manual a estado `Recibido_Lima` (Badge azul).
- **Gastos de Cuadrilla:** Liquidación de estibadores y cargadores por bulto descargado (`POST /api/acopios/:id/gastos/descarga`).
- **Control de Ubicaciones Físicas:** Traslado individual o por lote de jabas (`PATCH /api/jabas/:id/ubicacion`) entre las 4 ubicaciones permitidas:
  1. `'Acopio'`
  2. `'Camara Frio'`
  3. `'Puesto Principal'`
  4. `'Puesto Contingencia'`

### Etapa 4: Ventas y Stock en Balanza
- ⚠️ **REGLA DE ORO DE JOSBECORSA: ¡NO HAY MERMA!**  
  Al presionar **"Convertir a Kilos"** (`POST /api/jabas/:id/transformar-kilos`), la interfaz debe reflejar que el **100% del peso bruto** de la jaba se traslada íntegramente a kilogramos disponibles en stock.  
  *Queda terminantemente prohibido calcular mermas, deducciones o porcentajes de tara en el frontend.*
- **Punto de Venta Mayorista:** Facturación estricta por kilogramos (`kilosVendidos`, `precioUnitario`, `subtotal`).
- **Módulo de Fiados:** Registro de ventas al crédito con saldo pendiente y cliente asociado (`POST /api/fiados`).

---

##  4. Stack Tecnológico Estricto

Todo el código de `BeaverVaultFrontend` debe apegarse a:

| Capa / Herramienta | Tecnología | Regla / Restricción |
| :--- | :--- | :--- |
| **Lenguaje** | JavaScript puro (ES6+) con JSX | **No utilizar TypeScript.** Archivos `.js` y `.jsx`. |
| **Librería UI** | React 18 / 19 | Hooks funcionales puros (`useState`, `useEffect`, `useContext`, `useMemo`, `useCallback`). |
| **Estilos & Diseño** | TailwindCSS | Clases utilitarias modernas, limpias y diseño responsivo móvil/tablet/desktop. |
| **Iconografía** | Lucide React (`lucide-react`) | Iconos vectoriales coherentes y ligeros. |
| **Cliente HTTP** | Axios | Instancia centralizada con interceptores para Bearer Token y manejo de errores 401. |
| **Enrutamiento** | React Router DOM v6+ | Enrutamiento declarativo con rutas públicas y privadas protegidas. |
| **Bundler** | Vite | Desarrollo ultrarrápido con proxy inverso integrado. |

---

##  5. Arquitectura Limpia y Estructura de Carpetas

```text
BeaverVaultFrontend/
├── public/                  # Favicons, manifiestos y recursos estáticos
├── src/
│   ├── assets/              # Imágenes, logos de JOSBECORSA y BeaverVault
│   ├── components/          # Componentes visuales reutilizables
│   │   ├── common/          # Navbar, Sidebar, Modal, Badge, Spinner, Alert, Button
│   │   └── forms/           # Input, Select, CurrencyInput, CascadeSelect
│   ├── context/             # Estado global (AuthContext.jsx para sesión y token)
│   ├── hooks/               # Custom hooks (useAuth.js, useFetch.js, useModal.js)
│   ├── pages/               # Vistas principales de la aplicación
│   │   ├── auth/            # Login.jsx
│   │   ├── dashboard/       # Dashboard.jsx (Resumen general y métricas de fruta)
│   │   ├── acopio/          # AcopioList.jsx, AcopioCreateModal.jsx
│   │   ├── transporte/      # TransporteList.jsx, FleteModal.jsx
│   │   ├── distribucion/    # DistribucionView.jsx, ReubicarJabaModal.jsx
│   │   ├── ventas/          # PuntoVentaPOS.jsx, TransformarKilosModal.jsx
│   │   ├── fiados/          # FiadosList.jsx
│   │   └── configuracion/   # Empresas.jsx, Ubicaciones.jsx, Usuarios.jsx, Roles.jsx
│   ├── services/            # Capa de comunicación con la API Backend
│   │   ├── api.js           # Instancia Axios con Interceptor Bearer Token
│   │   ├── authService.js   # login, logout, getSession
│   │   ├── acopioService.js # acopios, jabas, seleccionadores
│   │   ├── ventaService.js  # transformacion, ventas, inventario en kilos
│   │   └── configService.js # empresas, ubicaciones, roles, usuarios
│   ├── utils/               # Funciones de apoyo y constantes
│   │   ├── constants.js     # Matriz de paltas, colores, endpoints, estados
│   │   └── formatters.js    # Formato de moneda peruana (S/.), fechas (DD/MM/YYYY), pesos (kg)
│   ├── App.jsx              # Configuración de Router y Providers
│   ├── main.jsx             # Punto de entrada Vite / React
│   └── index.css            # Directivas Tailwind (@tailwind base, components, utilities)
├── .env.example             # Plantilla pública de variables de entorno
├── .env                     # Variables de entorno locales activas
├── index.html               # Plantilla HTML5
├── package.json             # Dependencias del proyecto
├── tailwind.config.js       # Configuración de temas y colores Tailwind
└── vite.config.js           # Configuración de Vite y proxy inverso de desarrollo
```

---

##  6. Comunicación con la API y Autenticación

### Configuración del Cliente HTTP (`src/services/api.js`)

```javascript
// src/services/api.js - Instancia Axios centralizada con interceptores
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Salida: Inyecta el Token Bearer automáticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Entrada: Redirige a Login si el Token caduca (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

---

##  7. Reglas de Calidad y Buenas Prácticas de Código

1. **JavaScript Limpio:** Desestructuración, async/await, optional chaining (`obj?.prop`) y funciones puras legibles.
2. **Manejo Estricto de Estados UI:** Todo componente asíncrono debe implementar:
   - `loading`: Spinner accesible o esqueletos Tailwind (`animate-pulse`).
   - `error`: Alerta con el mensaje retornado por el backend (`err.response?.data?.error`).
   - `data`: Renderizado fluido cuando la información está lista.
3. **Separación de Responsabilidades:** Nunca ejecutar llamadas directas de `axios` dentro de `useEffect` de las vistas; delegarlas siempre en los módulos de `src/services/`.
4. **Validaciones Previas de Formularios:** Bloquear envíos con valores no permitidos (pesos negativos, campos vacíos o combinaciones inválidas de palta).
5. **Accesibilidad y Usabilidad:** Etiquetas `label` asociadas a cada input, mensajes de error legibles y contrastes de color apropiados.

---

## 8. Paleta de Colores Corporativa 

| Rol en la UI | Color | Código Hex | Uso Recomendado |
| :--- | :--- | :--- | :--- |
| **Primario (Acción / Marca)** | Naranja Construcción | `#E65100` | Botones de llamada a la acción (CTA), bordes activos y elementos destacados clave. |
| **Neutro Oscuro (Texto / UI)** | Marrón Carbón | `#2C221E` | Títulos principales, navegación lateral, texto de lectura y etiquetas de usuario/perfil. |
| **Tono de Identidad (Marca)** | Marrón Castor | `#6D4C41` | Banner principal de bienvenida, contenedores destacados, pie de página (*footer*) y detalles de marca. |
| **Fondo Base (Light Mode)** | Blanco Marfil / Neutro | `#FAFAFC` | Fondo general de la plataforma y lienzo principal para garantizar alta legibilidad. |
| **Superficie Secundaria** | Beis Cartón / Kraft | `#E8D8C8` | Subtítulos secundarios de marca (ej. "BEAVERVAULT PALTA"), fondos de tarjetas y estados neutros. |
| **Secundario (Uso Técnico Mínimo)** | Azul Cero / Cyan | `#0288D1` | *Uso exclusivo y puntual:* insignias de estado específicas, gráficos de trazabilidad e hipervínculos técnicos. **No usar en texto de cabecera ni nombres de usuario.** |

---

### Guía de Aplicación en la Interfaz (UI)

- **Fondo de Pantalla Base:** `#FAFAFC` para garantizar el máximo contraste, reducir la fatiga visual y mantener una apariencia limpia.
- **Navegación Lateral (Sidebar):** Fondo `#2C221E` (Marrón Carbón) con texto blanco/marfil para dar estructura y presencia corporativa.
  - **Subtítulo de Marca / Slogan:** Usar `#E8D8C8` (Beis Kraft) o `#FAFAFC` en opacidad suave para "BEAVERVAULT PALTA". Evitar tonos azules o de alto contraste en textos secundarios.
- **Header Superior y Perfil:** Fondo limpio en `#FFFFFF`, texto de nombre y rol de usuario (ej. "USUARIO") unificados en `#2C221E` (Marrón Carbón) para eliminar elementos visuales distractores.
- **Banner de Bienvenida y Avisos Destacados:** Fondo `#6D4C41` (Marrón Castor) con detalles internos y cajas de alerta en tonos terracota/naranja para un diseño sobrio sin saturar de color.
- **Tarjetas de Etapas del Flujo Operativo:** 
  - Usar bordes y sombras neutros e unificados (evitar bordes multicolor tipo arcoíris).
  - Iconos de contenedor en tonos cálidos y neutros de la marca (`#E65100`, `#6D4C41`, `#2C221E`).
- **Botones Principales (CTA):** `#E65100` con texto `#FFFFFF` para acciones directas ("Crear lote", "Gestionar Acopio", "Confirmar pesaje").

---

##  9. Formato Obligatorio de Respuestas del Agente Frontend

Toda respuesta técnica del agente debe seguir rigurosamente esta estructura:

1. **Saludo y Enfoque:** Tratar al usuario (Josue) y al equipo de frontend con tono profesional y colaborativo.
2. **Contexto del Componente:** Indicar archivo exacto, carpeta y propósito de la interfaz.
3. **Código Limpio:** Código funcional en JavaScript (JSX) con TailwindCSS, modular, accesible y responsivo.
4. **Cierre Obligatorio:** Terminar siempre con una sección titulada:  
   `### Recomendaciones para el equipo frontend` o `### Siguientes pasos sugeridos`.
