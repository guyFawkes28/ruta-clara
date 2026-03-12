import { loginPage } from "../pages/LoginPage.js";
import { persistence } from "../util/persistence.js";
import { notFoundPage } from "../pages/NotFound.js";
import { scannerPage } from "../pages/ScanPage.js";
import { zonePage } from "../pages/ZonePage.js";

const routes = {
    "#/": loginPage(),
    "#/login": loginPage(),
    "#/scanner": scannerPage(),
    
};

export const routerManager = async () => {
    const root = document.getElementById("root");
    const hash = window.location.hash || "#/login";

    // 1. VALIDACIÓN DE AUTENTICACIÓN (Lo primero siempre)
    const isAuth = persistence.isAuthentication();

    if (!isAuth && hash !== "#/login") {
        window.location.hash = "#/login";
        return;
    }

    if (isAuth && (hash === "#/login" || hash === "#/" || hash === "")) {
        window.location.hash = "#/scanner";
        return;
    }

    // 2. DETECCIÓN DE RUTA DINÁMICA (Zona con ID)
    // Si el hash empieza por #/zone/ (ej: #/zone/1)
    if (hash.startsWith("#/zone/")) {
        const id = hash.split("/")[2]; // Extraemos el '1'
        const view = zonePage(id);     // Pasamos el ID a la página
        
        root.innerHTML = view.render();
        await view.loadRender();
        return; // Detenemos aquí la ejecución
    }

    // 3. DETECCIÓN DE RUTAS ESTÁTICAS
    const view = routes[hash];

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