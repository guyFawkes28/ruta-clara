import { routerManager } from "./routes/router.js";

window.addEventListener("hashchange",routerManager)
window.addEventListener("load",routerManager)