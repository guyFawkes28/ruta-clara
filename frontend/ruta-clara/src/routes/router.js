import { LoginPage } from "../pages/LoginPage.js"
import { persistence } from "../utils/persistence.js"
import { NotFoundPage } from "../pages/NotFoundPage.js"
const routes = {
    "#/": LoginPage(),
    "#/login": LoginPage(),
    "#/scanner": ScannerPage()
};

export const routerManager = async () => {
    const root = document.getElementById("root")
    const hash = window.location.hash || "#/login"

    // Verificar si la ruta existe primero
    const view = routes[hash]

    if (!view) {
        // Si la ruta no está registrada, mostrar NotFound (no redirigir)
        const notFound = NotFoundPage()
        root.innerHTML = notFound.render()
        await notFound.loadRender()
        return
    }

    // 1. Validación activa
    const isAuth = persistence.isAuthentication();
    const user = persistence.getUser();

    if (!isAuth && hash !== "#/login") {
        // Si no está logueado y trata de entrar a una ruta protegida, lo mandamos al login
        window.location.hash = "#/login";
        return;
    }

    if (isAuth && hash === "#/login") {
        // Si ya está logueado y trata de ir al login, lo mandamos al scanner
        window.location.hash = "#/scanner";
        return;
    }

    if (hash === "#/" || hash === "") {
        window.location.hash = isAuth ? "#/scanner" : "#/login";
        return;
    }

 
    root.innerHTML = view.render();
    await view.loadRender();
};