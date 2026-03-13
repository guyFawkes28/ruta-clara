import urlApi from "./axiosConfig.js"

const maintenanceService = {
    // 1. Cargar Mapa y Datos de la Zona
    getZoneByQR: async (qrCode) => {
        try {
            const response = await urlApi.get(`/maintenance/${qrCode}`)
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 2. Traer el catálogo de daños (Silla, Mouse, etc.) para el Modal
    getIncidencias: async () => {
        try {
            const response = await urlApi.get(`/maintenance/incidencias`)
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 3. Enviar el reporte completo (RPC)
    createReport: async (reportData) => {
        try {
            const response = await urlApi.post(`/maintenance/reportar`, reportData)
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 4. Obtener las tareas pendientes con detalles
    getPendingTasks: async () => {
        try {
            const response = await urlApi.get(`/maintenance/pendientes`)
            return response.data; // { tareas: [], total }
        } catch (error) {
            throw error;
        }
    }
}

export default maintenanceService;