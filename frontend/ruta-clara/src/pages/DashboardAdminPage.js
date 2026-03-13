import { Sidebar } from '../components/SidebarAdmin.js';
import { homePage } from './HomeAdminPage.js';
import { roomPage } from './RoomAdminPage.js';
import { inventoryPage } from './InventoryAdminPage.js';
import { chatPage } from './ChatAdminPage.js';

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