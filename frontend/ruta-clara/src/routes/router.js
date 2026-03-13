import { loginPage } from "../pages/LoginPage.js";
import { persistence } from "../util/persistence.js";
import { notFoundPage } from "../pages/NotFound.js";
import { scannerPage } from "../pages/ScanPage.js";
import { zonePage } from "../pages/ZonePage.js";
import { dashboardPage } from "../pages/DashboardPage.js";
import { cleaningReportPage } from "../pages/cleaningReportPage.js";

const routes = {
    "#/": loginPage(),
    "#/login": loginPage(),
    "#/scanner": scannerPage(),
    "#/zona": zonePage(),
    "#/dashboard":dashboardPage(),
    "#/cleaning-report": cleaningReportPage()
    
};

export const routerManager = async () => {
    const root = document.getElementById("root");
    const hash = window.location.hash || "#/login";

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
        // redirigir por rol: admins -> dashboard, otros -> scanner
        if (role === 'admin') {
            window.location.hash = "#/dashboard";
        } else {
            window.location.hash = "#/cleaning-report";
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

    // 3. DETECCIÓN DE RUTAS ESTÁTICAS
    const view = routes[hash];

    // 4. PROTECCIONES POR ROL (rutas estáticas)
    // - Operators no pueden acceder a dashboard
    // - Admins no pueden acceder a scanner ni a zona
    if (role === 'operator' && hash === '#/dashboard') {
        window.location.hash = '#/scanner'
        return
    }
    if (role === 'admin' && (hash === '#/scanner' || hash === '#/zona' || hash.startsWith('#/zone/'))) {
        window.location.hash = '#/dashboard'
        return
    }

    if (!view) {
        const notFound = notFoundPage();
        root.innerHTML = notFound.render();
        await notFound.loadRender();
        return;
    }

    // Renderizado normal para Login o Scanner
    root.innerHTML = view.render();
    await view.loadRender();
};