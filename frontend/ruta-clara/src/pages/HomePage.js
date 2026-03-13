import { persistence } from '../util/persistence.js';

export const homePage = () => ({
  render: () => `
    <div>
      <h1 id="home-title">Inicio</h1>
      <p id="home-welcome">Bienvenido a el Inicio de la aplicación.</p>
    </div>
  `,

  loadRender: () => {
    const welcome = document.getElementById('home-welcome');
    const user = persistence.getUser();
    const name = user && (user.nombre || user.name) ? (user.nombre || user.name) : 'Yull';
    if (welcome) welcome.textContent = `Bienvenido, ${name}`;
  }
});