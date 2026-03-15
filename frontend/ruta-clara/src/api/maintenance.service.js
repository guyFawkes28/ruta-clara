import urlApi from "./axiosConfig.js"

const maintenance_service = {
    // 1. Carga el mapa de la zona y su informacion
    get_zone_by_qr: async (qr_code) => {
        try {
            const response = await urlApi.get(`/maintenance/${qr_code}`)
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 2. Obtiene el catalogo de incidencias para el modal
    get_incidentes: async () => {
        try {
            const response = await urlApi.get(`/maintenance/incident-types`)
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 3. Envia el reporte completo
    create_report: async (report_data) => {
        try {
            const response = await urlApi.post(`/maintenance/report`, report_data)
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 3b. Alias para mantener consistencia en el nombre del metodo
    create_maintenance_report: async (report_data) => {
        try {
            const response = await urlApi.post(`/maintenance/report`, report_data)
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 4. Obtiene tareas pendientes con detalle
    get_pending_tasks: async () => {
        try {
            const response = await urlApi.get(`/maintenance/pending-tasks`)
            return response.data; // { tasks: [], total }
        } catch (error) {
            throw error;
        }
    },
    
    // 5. Obtiene solo el total de pendientes y metricas rapidas
    get_pending_count: async () => {
        try {
            const response = await urlApi.get(`/maintenance/pending-tasks`);
            const data = response.data;
            const pending = data?.total ?? (Array.isArray(data?.tasks) ? data.tasks.length : 0);
            const completed_today = data?.completed_today ?? 0;
            return { pending, completed_today };
        } catch (error) {
            throw error;
        }
    },

    // 6. Obtiene las inspecciones recientes
    get_recent_inspections: async (limit = 10) => {
        try {
            const response = await urlApi.get(`/maintenance/inspections/recent?limit=${limit}`)
            return response.data || { inspections: [] }
        } catch (error) {
            console.warn('[maintenance_service] Error al cargar inspecciones:', error)
            return { inspections: [] }
        }
    },

    // 7. Obtiene los reportes recientes
    get_recent_reports: async (limit = 10) => {
        try {
            const response = await urlApi.get(`/maintenance/reports/recent?limit=${limit}`)
            return response.data || { reports: [] }
        } catch (error) {
            console.warn('[maintenance_service] Error al cargar reportes:', error)
            return { reports: [] }
        }
    }
}

export default maintenance_service;