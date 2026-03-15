import { loginPage } from "../pages/LoginPage.js"
import { persistence } from "../util/persistence.js"
import { notFoundPage } from "../pages/NotFound.js"
import { scannerPage } from "../pages/ScanPage.js"
import { zonePage } from "../pages/ZonePage.js"
import { dashboardPage } from "../pages/DashboardPage.js"
import { HomePage } from "../pages/HomePage.js"
import { HomeCleanerPage } from "../pages/HomeCleaner.js"
import { cleaningReportPage } from "../pages/cleanPage.js"
// Vistas bajo demanda
const routeFactories = {
    "#/": () => loginPage(),
    "#/login": () => loginPage(),
    "#/scanner": () => scannerPage(),
    "#/zona": () => zonePage(),
    "#/dashboard": () => dashboardPage(),
    "#/home": () => HomePage(),
    "#/home-cleaner": () => HomeCleanerPage(),
};

export const routerManager = async () => {
    console.log('[Router] routerManager ejecutado - hash actual:', window.location.hash)
    const root = document.getElementById("root");
    const hash = window.location.hash || "#/login";

    console.log('[Router] root elemento existe?', !!root)
    console.log('[Router] hash procesado:', hash)

    // Validar autenticación
    const isAuth = persistence.isAuthentication();

    // Obtener usuario y rol si hay sesión
    const user = isAuth ? persistence.getUser() : null
    const role = user?.rol ? String(user.rol).toLowerCase() : null

    if (!isAuth && hash !== "#/login") {
        window.location.hash = "#/login";
        return;
    }

    if (isAuth && (hash === "#/login" || hash === "#/" || hash === "")) {
        // Redirigir por rol
        if (role === 'admin') {
            window.location.hash = "#/dashboard";
        } else if (role === 'aseo' || role === 'cleaner') {
            window.location.hash = "#/home-cleaner";
        } else {
            window.location.hash = "#/home";
        }
        return;
    }

    // Rutas dinámicas: limpieza y zona por ID
    if (hash.startsWith("#/clean/")) {
        if (role === 'admin') { window.location.hash = '#/dashboard'; return }
        const id = hash.split("/")[2];
        const view = cleaningReportPage(id);
        root.innerHTML = view.render();
        await view.loadRender();
        return;
    }

    if (hash.startsWith("#/zone/")) {
        // Admin no entra a zona dinámica
        if (role === 'admin') {
            window.location.hash = '#/dashboard'
            return
        }
        const id = hash.split("/")[2];
        const view = zonePage(id);

        root.innerHTML = view.render();
        await view.loadRender();
        return;
    }

    // Rutas estáticas
    const factory = routeFactories[hash];

    // Protecciones por rol
    if (role === 'operator' && hash === '#/dashboard') {
        window.location.hash = '#/home'
        return
    }
    // Admin no deben acceder a home, scanner ni a rutas de zona
    if (role === 'admin' && (hash === '#/scanner' || hash === '#/zona' || hash === '#/home' || hash.startsWith('#/zone/'))) {
        window.location.hash = '#/dashboard'
        return
    }
    // Solo el admin puede acceder a dashboard, si no es admin redirigimos
    if ((role === 'aseo' || role === 'cleaner') && (hash === '#/dashboard' || hash === '#/home')) {
        window.location.hash = '#/home-cleaner'
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

    // Crear y renderizar la vista
    console.log('[Router] Creando vista para ruta:', hash)
    const view = factory();
    console.log('[Router] Vista creada, renderizando...')
    root.innerHTML = view.render();
    console.log('[Router] Vista renderizada, ejecutando loadRender...')
    await view.loadRender();
    console.log('[Router] Ruta completada:', hash)
};