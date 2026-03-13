import { notFoundPage } from "../pages/NotFound.js";
import { scannerPage } from "../pages/ScanPage.js";
import { zonePage } from "../pages/ZonePage.js";
import { chatPage } from "../pages/ChatPage.js";
import { roomPage } from "../pages/RoomPage.js";
import { dashboardPage } from "../pages/DashboardPage.js";

const routes = {
    "#/": dashboardPage(),
    "#/login": dashboardPage(),
    "#/scanner": scannerPage(),
    "#/chat": chatPage(),
    "#/room": roomPage(),
    "#/dashboard": dashboardPage()
};

export const routerManager = async () => {
    const root = document.getElementById("root");
    const hash = window.location.hash || "#/";

    // Vista temporal para desarrollo:
    // se comenta la validación de autenticación para poder visualizar
    // directamente el sidebar y las vistas internas sin pasar por login.
    // const isAuth = persistence.isAuthentication();
    //
    // if (!isAuth && hash !== "#/login") {
    //     window.location.hash = "#/login";
    //     return;
    // }
    //
    // if (isAuth && (hash === "#/login" || hash === "#/" || hash === "")) {
    //     window.location.hash = "#/scanner";
    //     return;
    // }

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