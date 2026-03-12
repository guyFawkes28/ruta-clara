import urlApi from '../api/axiosConfig.js'


export const loginService = async (email,pin) => {

    try {

        const response = await urlApi.post('/auth/login',{email,pin})
        console.log(response)

        return response.data

    } catch (error) {

        const errorMessage = error.response?.data?.error || 'error en la conexion'

        throw new Error(errorMessage)
        
    }
    
}