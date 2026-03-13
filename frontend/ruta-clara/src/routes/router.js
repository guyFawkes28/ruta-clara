import { notFoundPage } from "../pages/NotFound.js";
import { loginPage } from "../pages/LoginPage.js";
import { scannerPage } from "../pages/ScanPage.js";
import { zonePage } from "../pages/ZonePage.js";
import { chatPage } from "../pages/ChatAdminPage.js";
import { roomPage } from "../pages/RoomAdminPage.js";
import { dashboardPage } from "../pages/DashboardAdminPage.js";
import { persistence } from "../util/persistence.js";

const OMITIR_LOGIN_DEV = true;

const routes = {
    "#/": loginPage,
    "#/login": loginPage,
    "#/scanner": scannerPage,
    "#/chat": chatPage,
    "#/room": roomPage,
    "#/dashboard": dashboardPage
};

export const routerManager = async () => {
    const root = document.getElementById("root");
    const hash = window.location.hash || "#/";

    if (OMITIR_LOGIN_DEV && (hash === "#/" || hash === "#/login" || hash === "")) {
        window.location.hash = "#/dashboard";
        return;
    }

    const isAuth = persistence.isAuthentication();

    if (!OMITIR_LOGIN_DEV && !isAuth && hash !== "#/login") {
        window.location.hash = "#/login";
        return;
    }

    if (!OMITIR_LOGIN_DEV && isAuth && (hash === "#/login" || hash === "#/" || hash === "")) {
        window.location.hash = "#/scanner";
        return;
    }

    // 2. DETECCIÓN DE RUTA DINÁMICA (Zona con ID)
    // Si el hash empieza por #/zone/ (ej: #/zone/1)
    if (hash.startsWith("#/zone/")) {
        if (!OMITIR_LOGIN_DEV && !isAuth) {
            window.location.hash = "#/login";
            return;
        }

        const id = hash.split("/")[2]; // Extraemos el '1'
        const view = zonePage(id);     // Pasamos el ID a la página
        
        root.innerHTML = view.render();
        await view.loadRender();
        return; // Detenemos aquí la ejecución
    }

    // 3. DETECCIÓN DE RUTAS ESTÁTICAS
    const pageFactory = routes[hash];

    if (!pageFactory) {
        const notFound = notFoundPage();
        root.innerHTML = notFound.render();
        await notFound.loadRender();
        return;
    }

    const view = pageFactory();

    root.innerHTML = view.render();
    await view.loadRender();
};