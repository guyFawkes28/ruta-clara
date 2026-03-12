import axios from 'axios'



const urlApi = axios.create({
    baseURL: 'http://localhost:4000/api',
    withCredentials:true
})



export default urlApi