import { login_service } from "../api/auth.service.js"
import { persistence } from "../util/persistence.js"

export const loginPage = () => ({

    render: () => {

        return `<div id="login-screen">
            <div class="login-logo">Ruta<em>Clara</em></div>
                <div class="login-sub">Sistema Gestion de Mantenimiento · Riwi</div>
            <div class="login-card">
             <div class="login-field">
                <label class="login-lbl">Correo Electronico</label>
                <input class="login-inp" id="login-email" type="email">
            </div>
            <div class="login-field">
                <label class="login-lbl">Pin</label>
                <input class="login-inp" id="login-pass" type="password" placeholder="****">
            </div>
            <div class="login-field">
      
            </div>
            <button class="login-btn">Ingresar</button>
            <div class="login-err" id="login-err">Correo o Pin incorrectos</div>
        </div>
        </div>
`
    },

        loadRender: ()=>{
    
            const loginBtn = document.querySelector('.login-btn')
            const emailInput = document.getElementById('login-email')
            const pinInput = document.getElementById('login-pass')
            const errorMsg = document.getElementById('login-err')
    
           loginBtn.addEventListener('click', async () => {
    
            try {
              console.log('[LoginPage] Iniciando login con:', emailInput.value)
              const user = await login_service(emailInput.value, pinInput.value)
              console.log('[LoginPage] Usuario autenticado:', user)
              
                            // Guardar la sesión y delegar la redirección al router
                            // Algunas APIs devuelven { data: {...} }, así que preferimos esa forma si existe
                            const toSave = user?.data ?? user
                            persistence.saveSession(toSave)
                            console.log('[LoginPage] Sesión guardada:', toSave)
                            // Redirigimos al enrutador para que él decida según rol
                            window.location.hash = '#/'
            } catch (error) {
              console.error('[LoginPage] Error durante login:', error)
              errorMsg.textContent = error.message || 'Error en la autenticación'
              errorMsg.style.display = 'block'
            }
            })
    
    
        }
   




})