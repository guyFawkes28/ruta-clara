// Inventario: patrón consistente con otras páginas (render + loadRender)
export const inventoryPage = () => ({
    render: () => `
  <div class="container-fluid p-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h3 mb-0">Inventario</h1>
        <p class="text-muted">Gestión de materiales y stock</p>
      </div>
      <button id="openAddMaterialBtn" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#addMaterialModal">
        <i class="bi bi-plus-lg"></i> Añadir Material
      </button>
    </div>

    <div class="card shadow-sm border-0">
      <div class="card-body p-0">
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="bg-light text-muted">
              <tr>
                <th class="ps-4">Material</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th class="text-end pe-4">Acciones</th>
              </tr>
            </thead>
            <tbody id="inventory-list"></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <div class="modal fade" id="addMaterialModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header bg-dark text-white">
          <h5 class="modal-title">Registrar / Editar Material</h5>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body p-4">
          <form id="materialForm">
            <input type="hidden" name="itemId" value="">
            <div class="mb-3">
              <label class="form-label">Nombre</label>
              <input name="nombre" type="text" class="form-control" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Categoría</label>
              <input name="categoria" type="text" class="form-control" placeholder="Ej. Redes" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Cantidad</label>
              <input name="cantidad" type="number" min="0" class="form-control" value="0" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Descripción (opcional)</label>
              <textarea name="descripcion" class="form-control" rows="2"></textarea>
            </div>
            <button type="submit" class="btn btn-success w-100">Guardar</button>
          </form>
        </div>
      </div>
    </div>
  </div>
  `,

    loadRender: () => {
      // --- Estado interno ---
      let simpleItems = [{ id: 1, nombre: 'Bombilla LED', categoria: 'Iluminación', cantidad: 3, descripcion: '' }];
      let simpleId = 2;

      // --- Función auxiliar para pintar la tabla ---
      function renderList() {
        const tbody = document.getElementById('inventory-list');
        if (!tbody) return;
        let html = '';
        for (let i = 0; i < simpleItems.length; i++) {
          const it = simpleItems[i];
          html += '<tr data-id="' + it.id + '">'
            + '<td class="ps-4 fw-bold">' + it.nombre + '</td>'
            + '<td>' + it.categoria + '</td>'
            + '<td>' + Number(it.cantidad) + ' disponibles</td>'
            + '<td class="text-end pe-4">'
            + '<button class="btn btn-sm btn-outline-secondary me-1 btn-edit" data-id="' + it.id + '">Editar</button>'
            + '<button class="btn btn-sm btn-outline-danger btn-delete" data-id="' + it.id + '">Eliminar</button>'
            + '</td></tr>';
        }
        tbody.innerHTML = html;
      }

      // --- Selectores del DOM ---
      const form = document.getElementById('materialForm');
      const modalEl = document.getElementById('addMaterialModal');
      const bsModal = (window.bootstrap && modalEl) ? new bootstrap.Modal(modalEl) : null;

      // Pintar lista inicial
      renderList();

      // --- Event Listeners ---

      // Guardar (nuevo o editar)
      if (form) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          const id = form.itemId.value;
          const nombre = form.nombre.value.trim();
          const categoria = form.categoria.value.trim();
          const cantidad = Number(form.cantidad.value) || 0;
          const descripcion = form.descripcion.value.trim();

          if (id) {
            for (let i = 0; i < simpleItems.length; i++) {
              if (simpleItems[i].id == Number(id)) {
                simpleItems[i].nombre = nombre;
                simpleItems[i].categoria = categoria;
                simpleItems[i].cantidad = cantidad;
                simpleItems[i].descripcion = descripcion;
                break;
              }
            }
          } else {
            simpleItems.unshift({ id: simpleId++, nombre, categoria, cantidad, descripcion });
          }
          renderList();
          form.reset(); form.itemId.value = '';
          if (bsModal) bsModal.hide();
        });
      }

      // Delegación para editar / eliminar
      document.addEventListener('click', function (e) {
        const edit = e.target.closest('.btn-edit');
        if (edit) {
          const id = Number(edit.getAttribute('data-id'));
          const item = simpleItems.find(x => x.id === id);
          if (!item) return;
          form.itemId.value = item.id;
          form.nombre.value = item.nombre;
          form.categoria.value = item.categoria;
          form.cantidad.value = item.cantidad;
          form.descripcion.value = item.descripcion || '';
          if (bsModal) bsModal.show();
          return;
        }
        const del = e.target.closest('.btn-delete');
        if (del) {
          const id = Number(del.getAttribute('data-id'));
          if (!confirm('¿Eliminar este material?')) return;
          simpleItems = simpleItems.filter(x => x.id !== id);
          renderList();
          return;
        }
      });
    }
});
