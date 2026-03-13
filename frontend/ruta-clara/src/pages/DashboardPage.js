import { Sidebar } from '../components/Sidebar.js';
import { homePage } from './HomePage.js';
import { roomPage } from './RoomPage.js';
import { inventoryPage } from './InventoryPage.js';
import { chatPage } from './ChatPage.js';

const pageMap = {
  inicio: homePage,
  sala1: roomPage,
  inventario: inventoryPage,
  chat: chatPage
};

export const dashboardPage = () => {
  const renderSection = (sectionName = 'inicio') => {
    const pageFactory = pageMap[sectionName] || homePage;
    const page = pageFactory();
    const container = document.getElementById('main-view');

    if (!container) return;

    container.innerHTML = page.render();

    if (typeof page.loadRender === 'function') {
      page.loadRender();
    }
  };

  const sidebar = Sidebar({
    onNavigate: (sectionName) => {
      renderSection(sectionName);
    }
  });

  return {
    render: () => sidebar.render(),

    loadRender: () => {
      sidebar.loadRender();
      renderSection('inicio');
    }
  };
};