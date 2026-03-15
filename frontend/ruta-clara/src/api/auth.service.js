import urlApi from '../api/axiosConfig.js'


export const login_service = async (email, pin) => {

    try {

        const response = await urlApi.post('/auth/login', {email, pin})
        console.log(response)

        return response.data

    } catch (error) {

        const error_message = error.response?.data?.error || 'connection error'

        throw new Error(error_message)
        
    }
    
}