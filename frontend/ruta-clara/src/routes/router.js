import { loginPage } from "../pages/LoginPage.js"
import { persistence } from "../util/persistence.js"
import { notFoundPage } from "../pages/NotFound.js"
import { scannerPage } from "../pages/ScanPage.js"
import { zonePage } from "../pages/ZonePage.js"
import { dashboardPage } from "../pages/DashboardPage.js"
import { HomePage } from "../pages/HomePage.js"

// Factory pattern: no se ejecutan hasta que se llamen
const routeFactories = {
    "#/": () => loginPage(),
    "#/login": () => loginPage(),
    "#/scanner": () => scannerPage(),
    "#/zona": () => zonePage(),
    "#/dashboard": () => dashboardPage(),
    "#/home": () => HomePage(),
};

export const routerManager = async () => {
    console.log('[Router] routerManager ejecutado - hash actual:', window.location.hash)
    const root = document.getElementById("root");
    const hash = window.location.hash || "#/login";

    console.log('[Router] root elemento existe?', !!root)
    console.log('[Router] hash procesado:', hash)

    // 1. VALIDACIÓN DE AUTENTICACIÓN (Lo primero siempre)
    const isAuth = persistence.isAuthentication();

    // obtener usuario y rol (si está autenticado)
    const user = isAuth ? persistence.getUser() : null
    const role = user?.rol ? String(user.rol).toLowerCase() : null

    if (!isAuth && hash !== "#/login") {
        window.location.hash = "#/login";
        return;
    }

    if (isAuth && (hash === "#/login" || hash === "#/" || hash === "")) {
        // redirigir por rol: admins -> dashboard, otros -> home
        if (role === 'admin') {
            window.location.hash = "#/dashboard";
        } else {
            window.location.hash = "#/home";
        }
        return;
    }

    // 2. DETECCIÓN DE RUTA DINÁMICA (Zona con ID)
    // Si el hash empieza por #/zone/ (ej: #/zone/1)
    if (hash.startsWith("#/zone/")) {
        // Bloqueo para admins (no deben acceder a zona dinámica)
        if (role === 'admin') {
            window.location.hash = '#/dashboard'
            return
        }
        const id = hash.split("/")[2]; // Extraemos el '1'
        const view = zonePage(id);     // Pasamos el ID a la página

        root.innerHTML = view.render();
        await view.loadRender();
        return; // Detenemos aquí la ejecución
    }

    // 3. DETECCIÓN DE RUTAS ESTÁTICAS - Crear la vista bajo demanda
    const factory = routeFactories[hash];

    // 4. PROTECCIONES POR ROL (rutas estáticas)
    // - Operators no pueden acceder a dashboard
    // - Admins no pueden acceder a scanner ni a zona
    if (role === 'operator' && hash === '#/dashboard') {
        window.location.hash = '#/home'
        return
    }
    // Admins no deben acceder a home, scanner ni a rutas de zona
    if (role === 'admin' && (hash === '#/scanner' || hash === '#/zona' || hash === '#/home' || hash.startsWith('#/zone/'))) {
        window.location.hash = '#/dashboard'
        return
    }

    console.log("Cargando la ruta:", hash);
    console.log('[Router] isAuth:', isAuth, 'role:', role);

    if (!factory) {
        console.log('[Router] Ruta no encontrada:', hash)
        const notFound = notFoundPage();
        root.innerHTML = notFound.render();
        await notFound.loadRender();
        return;
    }

    // Crear la vista bajo demanda y renderizarla
    console.log('[Router] Creando vista para ruta:', hash)
    const view = factory();
    console.log('[Router] Vista creada, renderizando...')
    root.innerHTML = view.render();
    console.log('[Router] Vista renderizada, ejecutando loadRender...')
    await view.loadRender();
    console.log('[Router] Ruta completada:', hash)
};