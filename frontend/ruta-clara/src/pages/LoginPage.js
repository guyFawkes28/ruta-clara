import { loginService } from "../api/auth.service.js"
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
              const user = await loginService(emailInput.value, pinInput.value)
              console.log('[LoginPage] Usuario autenticado:', user)
              
              persistence.saveSession(user)
              console.log('[LoginPage] Sesión guardada')
              console.log('[LoginPage] Autenticado según persistence:', persistence.isAuthentication())
              
                            const savedUser = user
                            const role = savedUser?.rol ? String(savedUser.rol).toLowerCase() : null
                            if (role === 'admin') {
                                console.log('[LoginPage] Rol admin detectado, redirigiendo a #/dashboard')
                                window.location.hash = '#/dashboard'
                            } else {
                                console.log('[LoginPage] Rol no-admin, redirigiendo a #/home')
                                window.location.hash = '#/home'
                            }
            } catch (error) {
              console.error('[LoginPage] Error durante login:', error)
              errorMsg.textContent = error.message || 'Error en la autenticación'
              errorMsg.style.display = 'block'
            }
            })
    
    
        }
   




})