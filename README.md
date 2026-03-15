# Ruta Clara

Hola, bienvenido a Ruta Clara. Este proyecto nació de la necesidad de hacer más eficiente el día a día de los equipos de limpieza y mantenimiento. Es una app web que combina una interfaz sencilla para los operarios con un backend sólido que usa IA para ayudar en las tareas.

## ¿Qué hace Ruta Clara?

La idea principal es facilitar la gestión de tareas de limpieza y mantenimiento. Los limpiadores pueden ver sus asignaciones, controlar el tiempo que pasan en cada una, reportar zonas, manejar inventarios y hasta chatear con el equipo. Todo con un toque de IA para resolver dudas rápidas.

### Funcionalidades clave
- **Tareas y ejecución**: Seguimiento en vivo de lo que hay que hacer, con timers para no perder el tiempo.
- **Protocolos de seguridad**: Recordatorios y checklists para SST (seguridad y salud en el trabajo).
- **Reportes por zonas**: Generar informes detallados de cada área trabajada.
- **Inventario**: Controlar qué hay disponible y mover cosas entre lugares.
- **Chat**: Comunicación directa entre el equipo.
- **IA integrada**: Usa OpenAI para ayudar con preguntas o sugerencias.
- **Dashboard**: Una vista general para supervisores, con métricas y estado de todo.
- **Mantenimiento**: Programar y trackear tareas preventivas.
- **Autenticación**: Login seguro con permisos según el rol.

## Tecnologías que usamos

Para el backend, apostamos por Node.js con Express para la API, PostgreSQL para datos estructurados y MongoDB para cosas más flexibles como chats. La IA viene de OpenAI.

En el frontend, JavaScript con Vue.js, Vite para desarrollo rápido, Bootstrap para que se vea bien en cualquier dispositivo, Axios para conectar con el backend y Socket.io para el chat en tiempo real.

## Instalación

### Prerrequisitos
- Node.js (versión 16 o superior)
- PostgreSQL
- MongoDB
- npm o yarn

### Backend
1. Navega a la carpeta `backend`:
   ```
   cd backend
   ```
2. Instala las dependencias:
   ```
   npm install
   ```
3. Configura las variables de entorno en un archivo
    ```
    .env

4. Ejecuta las migraciones de base de datos:
   ```
   npm run migrate
   ```
5. Inicia el servidor:
   ```
   npm run dev
   ```
 
### Frontend
1. Navega a la carpeta `frontend/ruta-clara`:
   ```
   cd frontend/ruta-clara
   ```
2. Instala las dependencias:
   ```
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```
   npm run dev
   ```

## Cómo usarlo

Abre el navegador en `http://localhost:3000` (o el puerto que configures). Loguéate, y desde el dashboard explora las secciones: tareas para trabajar, inventario para gestionar, chat para hablar, y reportes para ver lo hecho.

## Estructura del proyecto

Aquí va un mapa de cómo está organizado todo:

```
ruta-clara/
├── backend/                          # Servidor backend
│   ├── app.js                        # Punto de entrada principal
│   ├── debug_execution.js            # Utilidades de debugging
│   ├── package.json                  # Dependencias backend
│   ├── migrations/                   # Scripts SQL para base de datos
│   │   ├── 001_add_duracion_fields.sql
│   │   └── add_duracion_fields.sql
│   └── src/
│       ├── config/                   # Configuración de bases de datos
│       │   ├── db.js                 # Configuración PostgreSQL
│       │   └── mongo.js              # Configuración MongoDB
│       ├── controllers/              # Lógica de negocio
│       │   ├── ai.controller.js      # Controlador IA
│       │   ├── auth.controller.js    # Controlador autenticación
│       │   ├── chat.controller.js    # Controlador chat
│       │   ├── cleaning.controller.js# Controlador limpieza
│       │   ├── execution.controller.js# Controlador ejecución tareas
│       │   ├── inventory.controller.js# Controlador inventario
│       │   ├── maintenance.controller.js# Controlador mantenimiento
│       │   └── transfer.controller.js# Controlador transferencias
│       ├── middlewares/              # Middlewares
│       │   └── auth.middleware.js    # Middleware de autenticación
│       ├── models/                   # Modelos de datos
│       │   ├── Chat.model.js         # Modelo chat
│       │   ├── Inventory.model.js    # Modelo inventario
│       │   ├── TaskExecution.model.js# Modelo ejecución tareas
│       │   └── Transfer.model.js     # Modelo transferencias
│       ├── routes/                   # Definición de rutas API
│       │   ├── ai.routes.js          # Rutas IA
│       │   ├── auth.routes.js        # Rutas autenticación
│       │   ├── chat.routes.js        # Rutas chat
│       │   ├── cleaning.routes.js    # Rutas limpieza
│       │   ├── execution.routes.js   # Rutas ejecución
│       │   ├── inventory.routes.js   # Rutas inventario
│       │   ├── maintenance.routes.js # Rutas mantenimiento
│       │   └── transfer.routes.js    # Rutas transferencias
│       └── services/                 # Servicios externos
│           └── openai.service.js     # Servicio OpenAI
└── frontend/                         # Interfaz frontend
    └── ruta-clara/
        ├── index.html                # Página principal
        ├── package.json              # Dependencias frontend
        ├── vite.config.js            # Configuración Vite
        └── src/
            ├── main.js               # Punto de entrada frontend
            ├── api/                  # Servicios API
            │   ├── ai.service.js     # Servicio IA
            │   ├── auth.service.js   # Servicio autenticación
            │   ├── axiosConfig.js    # Configuración Axios
            │   ├── chat.service.js   # Servicio chat
            │   ├── execution.service.js# Servicio ejecución
            │   ├── inventory.service.js# Servicio inventario
            │   ├── maintenance.service.js# Servicio mantenimiento
            │   ├── socket.js         # Configuración Socket.io
            │   └── transfer.service.js# Servicio transferencias
            ├── assets/               # Recursos estáticos
            │   ├── clean.css         # Estilos limpieza
            │   ├── dashboard.css     # Estilos dashboard
            │   ├── ruta-clara.css    # Estilos principales
            │   ├── style.css         # Estilos generales
            │   └── Boostrap/         # Framework Bootstrap
            │       ├── css/          # Hojas de estilo Bootstrap
            │       └── js/           # Scripts Bootstrap
            ├── components/           # Componentes reutilizables
            │   ├── BottomNav.js      # Navegación inferior
            │   ├── Header.js         # Cabecera
            │   ├── HomeHeader.js     # Cabecera página inicio
            │   ├── Modal.js          # Componente modal
            │   ├── ReportZone.js     # Reporte de zonas
            │   ├── Sidebar.js        # Barra lateral
            │   ├── SSTProtocol.js    # Protocolo SST
            │   └── TaskTimer.js      # Temporizador tareas
            ├── pages/                # Páginas de la aplicación
            │   ├── cleanPage.js      # Página limpieza
            │   ├── DashboardPage.js  # Dashboard
            │   ├── HomeCleaner.js    # Inicio limpiador
            │   ├── HomePage.js       # Página inicio
            │   ├── LoginPage.js      # Página login
            │   ├── NotFound.js       # Página 404
            │   ├── ScanPage.js       # Página escaneo
            │   └── ZonePage.js       # Página zonas
            ├── routes/               # Configuración rutas
            │   └── router.js         # Router principal
            └── util/                 # Utilidades
                ├── persistence.js    # Persistencia datos
                └── ux.js             # Utilidades UX
```

## Contribuir

Si te interesa ayudar, genial. Haz un fork, crea una rama para tu idea, haz commits claros y abre un PR. Estamos abiertos a mejoras.

## Créditos

Este proyecto lo desarrollaron Emmanuel Cifuentes, Camilo Mitnick, Valeria Taborda, Salvador Aponte y Juan José Guarín.

---

