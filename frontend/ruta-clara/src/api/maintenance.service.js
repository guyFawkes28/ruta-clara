import urlApi from "./axiosConfig.js"

const maintenanceService = {
    
    getZoneByQR: async (qrCode) => {
        try {
            const response = await urlApi.get(`/maintenance/${qrCode}`)
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error("Error de red")
        }
    },

  
    createReport: async (reportData) => {
        try {
         
            const response = await urlApi.post(`/maintenance/report`, reportData)
            return response.data;
        } catch (error) {
            throw error.response ? error.response.data : new Error("Error al guardar")
        }
    }
}

export default maintenanceService;