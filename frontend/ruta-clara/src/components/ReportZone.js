export const reportZone = ({ onSave, onCancel }) => {
    let reportData = { puestoId: '', categoria: '', comentario: '' };

    return {
        render: () => `
        <div id="report-modal" class="modal d-none" style="display:block; background: rgba(0,0,0,0.6); position:fixed; top:0; left:0; width:100%; height:100%; z-index:2000;">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-0">
                    <div class="modal-header bg-dark text-white">
                        <h5 class="modal-title">Reportar Daño: <span id="w-puesto-id"></span></h5>
                        <button type="button" class="btn-close btn-close-white" id="w-close"></button>
                    </div>
                    <div class="modal-body p-4">
                        <div id="w-step-1">
                            <p class="text-muted">Selecciona el componente afectado:</p>
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary py-2 btn-cat" data-cat="Pantalla">🖥️ Pantalla</button>
                                <button class="btn btn-outline-primary py-2 btn-cat" data-cat="Torre">⚙️ Torre</button>
                                <button class="btn btn-outline-primary py-2 btn-cat" data-cat="Periféricos">🖱️ Teclado / Mouse</button>
                            </div>
                        </div>
                        <div id="w-step-2" class="d-none">
                            <label class="form-label fw-bold">Describe la falla:</label>
                            <textarea id="w-desc" class="form-control mb-3" rows="3" placeholder="Escribe aquí..."></textarea>
                            <div class="d-flex justify-content-between">
                                <button id="w-prev" class="btn btn-secondary">Atrás</button>
                                <button id="w-next" class="btn btn-success">Finalizar Reporte</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`,

        loadRender: () => {
            const step1 = document.getElementById('w-step-1');
            const step2 = document.getElementById('w-step-2');
            const txtDesc = document.getElementById('w-desc');

            // Navegación entre pasos
            document.querySelectorAll('.btn-cat').forEach(btn => {
                btn.onclick = () => {
                    reportData.categoria = btn.dataset.cat;
                    step1.classList.add('d-none');
                    step2.classList.remove('d-none');
                };
            });

            document.getElementById('w-prev').onclick = () => {
                step2.classList.add('d-none');
                step1.classList.remove('d-none');
            };

            // Simulación de guardado
            document.getElementById('w-next').onclick = () => {
                reportData.comentario = txtDesc.value;
                onSave(reportData); // Esto ejecutará el console.log que definamos en ZonePage
            };

            document.getElementById('w-close').onclick = onCancel;
        },

        open: (idPuesto) => {
            reportData.puestoId = idPuesto;
            reportData.categoria = '';
            reportData.comentario = '';
            // Limpiar UI
            document.getElementById('w-puesto-id').innerText = idPuesto;
            document.getElementById('w-step-1').classList.remove('d-none');
            document.getElementById('w-step-2').classList.add('d-none');
            document.getElementById('w-desc').value = '';
            document.getElementById('report-modal').classList.remove('d-none');
        },

        close: () => {
            document.getElementById('report-modal').classList.add('d-none');
        }
    };
};