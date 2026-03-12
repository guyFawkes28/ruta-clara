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

    const loginBtn = document.querySelector('.login-btn');
    const emailInput = document.getElementById('login-email');
    const pinInput = document.getElementById('login-pass');
    const errorMsg = document.getElementById('login-err');

    loginBtn.addEventListener('click', async () => {
        const email = emailInput.value;
        const pin = pinInput.value;

        try {
            // 1. Solo llamas al servicio. 
            // Él se encargará de hablar con el backend y GUARDAR la sesión.
            await loginService(email, pin);

            console.log("Login exitoso, redirigiendo...");

            // 2. La vista solo se encarga de la navegación
            window.location.hash = "#/scanner"; 
            
        } catch (error) {
            // 3. La vista solo se encarga de mostrar el error
            errorMsg.style.display = 'block';
            errorMsg.textContent = error.message;
        }
        })


    }



})