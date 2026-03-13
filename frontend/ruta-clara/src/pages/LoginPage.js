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
            const user = await loginService(emailInput.value, pinInput.value);
            
            
            persistence.saveSession(user); 
            
          
            window.location.hash = "#/cleaning-report"; 
            } catch (error) {
       
            errorMsg.textContent = error.message;
            errorMsg.style.display = 'block';
            }
            });
    
    
        }
   




})