import urlApi from "./axiosConfig.js"

const maintenance_service = {
    // 1. Load Zone Map and Data
    get_zone_by_qr: async (qr_code) => {
        try {
            const response = await urlApi.get(`/maintenance/${qr_code}`)
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 2. Get damage catalog (Chair, Mouse, etc.) for Modal
    get_incidentes: async () => {
        try {
            const response = await urlApi.get(`/maintenance/incident-types`)
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 3. Send complete report (RPC)
    create_report: async (report_data) => {
        try {
            const response = await urlApi.post(`/maintenance/report`, report_data)
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 3b. Send maintenance report (alias for consistency)
    create_maintenance_report: async (report_data) => {
        try {
            const response = await urlApi.post(`/maintenance/report`, report_data)
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // 4. Get pending tasks with details
    get_pending_tasks: async () => {
        try {
            const response = await urlApi.get(`/maintenance/pending-tasks`)
            return response.data; // { tasks: [], total }
        } catch (error) {
            throw error;
        }
    },
    
    // 5. Get only pending tasks count (and quick metrics)
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

    // 6. Get recent inspections
    get_recent_inspections: async (limit = 10) => {
        try {
            const response = await urlApi.get(`/maintenance/inspections/recent?limit=${limit}`)
            return response.data || { inspections: [] }
        } catch (error) {
            console.warn('[maintenance_service] Error loading inspections:', error)
            return { inspections: [] }
        }
    },

    // 7. Get recent reports
    get_recent_reports: async (limit = 10) => {
        try {
            const response = await urlApi.get(`/maintenance/reports/recent?limit=${limit}`)
            return response.data || { reports: [] }
        } catch (error) {
            console.warn('[maintenance_service] Error loading reports:', error)
            return { reports: [] }
        }
    }
}

export default maintenance_service;