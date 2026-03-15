import { toast } from '../util/ux.js';
import { ai_service } from '../api/ai.service.js';

export const reportZone = ({ onSave, onCancel }) => {
    let reportData = { puestoId: '', categoria: '', comentario: '', isFan: false };
    // Estado del modal
    let selectedDamages = [];
    let detailMap = {};
    let detailQueue = [];
    let currentDetailIndex = 0;
    let currentDamage = null;
    let _clearedAncestors = [];
    const DAMAGE_LABELS = {
        'pantalla o torre': 'Pantalla/Torre',
        'cable': 'Cable',
        'enchufe': 'Enchufe/Toma',
        'teclado': 'Teclado',
        'silla': 'Silla',
        'otro': 'Otro'
    };
    const STEP2 = {
        'cable': 'rc-step2-cable',
        'enchufe': 'rc-step2-enchufe',
        'silla': 'rc-step2-silla',
        'pantalla o torre': 'rc-step2-simple',
        'teclado': 'rc-step2-simple',
        'otro': 'rc-step2-simple'
    };

    return {
        render: () => `
            <div id="report-modal" class="d-none">
                <div class="overlay" id="rc-sheet">
                <div class="sheet">
                    <div class="shandle"></div>

                    <div class="sheet-hd">
                    <div class="stitle" id="rc-titulo">Puesto</div>
                    <div class="ssub"   id="rc-sub">Sala 3</div>
                    </div>


                    <div class="step-panel on" id="rc-step1">
                    <div class="step-lbl">¿Qué tiene daño?</div>
                    <div class="row g-2 mb-3">
                        <div class="col-6"><button class="dmg-btn" data-dmg="pantalla o torre"><span class="di">🖥️</span>Pantalla o Torre</button></div>
                        <div class="col-6"><button class="dmg-btn" data-dmg="cable"><span class="di">🔌</span>Cable</button></div>
                        <div class="col-6"><button class="dmg-btn" data-dmg="enchufe"><span class="di">⚡</span>Enchufe / Toma</button></div>
                        <div class="col-6"><button class="dmg-btn" data-dmg="teclado"><span class="di">⌨️</span>Teclado</button></div>
                        <div class="col-6"><button class="dmg-btn" data-dmg="silla"><span class="di">🪑</span>Silla</button></div>
                        <div class="col-6"><button class="dmg-btn" data-dmg="otro"><span class="di">🔧</span>Otro</button></div>
                    </div>
                    <button class="btn-navy" id="rc-step1-next">Siguiente →</button>
                    <div id="rc-step1-err" style="color:#dc2626;font-weight:800;margin-top:8px;display:none;font-size:13px">&nbsp;</div>
                    </div>


                    <div class="step-panel" id="rc-step2-cable">
                    <div class="step-lbl">¿Cuál cable?</div>
                    <div class="row g-2 mb-3">
                        <div class="col-6"><button class="cable-btn" data-cable="cable de datos (red/internet)"><span class="ci">🌐</span>Datos / Red</button></div>
                        <div class="col-6"><button class="cable-btn" data-cable="cable de corriente (alimentación)"><span class="ci">⚡</span>Corriente</button></div>
                        <div class="col-6"><button class="cable-btn" data-cable="cable HDMI / VGA (video)"><span class="ci">📺</span>Video HDMI/VGA</button></div>
                        <div class="col-6"><button class="cable-btn" data-cable="cable USB"><span class="ci">⌨️</span>USB</button></div>
                    </div>
                    <button class="btn-navy" id="rc-cable-next" disabled>Siguiente →</button>
                    <button class="btn-back" id="rc-cable-back">← Volver</button>
                    </div>


                    <div class="step-panel" id="rc-step2-enchufe">
                    <div class="step-lbl">¿Cuál enchufe?</div>
                    <div class="d-flex gap-3 justify-content-center mb-3">
                        <div class="op-card" id="rc-op-left" data-outlet="izquierdo">
                        <svg viewBox="0 0 44 48" width="48" height="52" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="42" height="46" rx="6" fill="#FFF7ED" stroke="#EA580C" stroke-width="2.5"/><rect x="3.5" y="6.5" width="37" height="23" rx="3" fill="white" stroke="#FDBA74" stroke-width="1"/><rect x="6.5" y="9.5" width="4" height="12" rx="2" fill="#EA580C"/><rect x="12" y="9.5" width="4" height="12" rx="2" fill="#EA580C"/><circle cx="11" cy="37" r="4" fill="#EA580C"/><circle cx="11" cy="37" r="2" fill="white"/><rect x="23" y="9.5" width="4" height="12" rx="2" fill="#D1D5DB"/><rect x="29" y="9.5" width="4" height="12" rx="2" fill="#D1D5DB"/><circle cx="29" cy="37" r="4" fill="#D1D5DB"/><circle cx="29" cy="37" r="2" fill="white"/></svg>
                        <div style="font-size:13px;font-weight:800">Izquierdo</div>
                        </div>
                        <div class="op-card" id="rc-op-right" data-outlet="derecho">
                        <svg viewBox="0 0 44 48" width="48" height="52" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="42" height="46" rx="6" fill="#FFF7ED" stroke="#EA580C" stroke-width="2.5"/><rect x="3.5" y="6.5" width="37" height="23" rx="3" fill="white" stroke="#FDBA74" stroke-width="1"/><rect x="6.5" y="9.5" width="4" height="12" rx="2" fill="#D1D5DB"/><rect x="12" y="9.5" width="4" height="12" rx="2" fill="#D1D5DB"/><circle cx="11" cy="37" r="4" fill="#D1D5DB"/><circle cx="11" cy="37" r="2" fill="white"/><rect x="23" y="9.5" width="4" height="12" rx="2" fill="#EA580C"/><rect x="29" y="9.5" width="4" height="12" rx="2" fill="#EA580C"/><circle cx="29" cy="37" r="4" fill="#EA580C"/><circle cx="29" cy="37" r="2" fill="white"/></svg>
                        <div style="font-size:13px;font-weight:800">Derecho</div>
                        </div>
                    </div>
                    <button class="btn-navy" id="rc-enc-next" disabled>Siguiente →</button>
                    <button class="btn-back" id="rc-enc-back">← Volver</button>
                    </div>


                    <div class="step-panel" id="rc-step2-simple">
                    <div class="step-lbl">Confirmar componente</div>
                    <div class="d-flex align-items-center gap-3 rounded-3 p-3 mb-3" style="background:var(--orab);border:2px solid var(--orabd)">
                        <span style="font-size:32px" id="rc-simple-ico">🔧</span>
                        <div>
                        <div style="font-size:17px;font-weight:800" id="rc-simple-name">Componente</div>
                        <div style="font-size:13px;color:var(--tsoft);font-weight:600;margin-top:2px">Describe el daño y la IA te ayuda con el reporte</div>
                        </div>
                    </div>
                    <button class="btn-navy" id="rc-simple-next">Siguiente →</button>
                    <button class="btn-back" id="rc-simple-back">← Volver</button>
                    </div>


                    <div class="step-panel" id="rc-step2-silla">
                    <div class="step-lbl">¿Qué pasa con la silla?</div>
                    <div class="row g-3 mb-3">
                        <div class="col-6"><button class="yn-btn" id="rc-silla-arreglar" data-silla="arreglar" style="border-color:var(--blue);color:var(--blue)"><span class="yni">🔨</span>Arreglar<br>aquí mismo</button></div>
                        <div class="col-6"><button class="yn-btn" id="rc-silla-bodega" data-silla="bodega" style="border-color:var(--orange);color:var(--orange)"><span class="yni">📦</span>Enviar a<br>bodega</button></div>
                    </div>
                    <div id="rc-silla-detail" class="rounded-3 p-3 mb-3" style="display:none;border:1.5px solid var(--border)">
                        <div style="font-size:14px;font-weight:800;color:var(--tmid);margin-bottom:4px" id="rc-silla-lbl">—</div>
                        <div style="font-size:13px;color:var(--tsoft);font-weight:600" id="rc-silla-sub">—</div>
                    </div>
                    <button class="btn-navy" id="rc-silla-next" disabled>Siguiente →</button>
                    <button class="btn-back" id="rc-silla-back">← Volver</button>
                    </div>


                    <div class="step-panel" id="rc-step3">
                    <div class="step-lbl">Describe el daño con tus palabras</div>
                    <div class="mb-1" style="font-size:13px;font-weight:800;color:var(--tmid)">🔧 ¿Qué observas?</div>
                    <textarea id="rc-nota" class="form-control mb-1" rows="4"
                        placeholder="Ej: el cable está pelado, la pantalla parpadea y se apaga sola…"
                        style="font-family:'Nunito',sans-serif;font-size:16px;font-weight:600;background:var(--bg);border:2px solid var(--border);border-radius:14px;outline:none;resize:none;line-height:1.5"></textarea>
                    <div class="text-end mb-3" style="font-size:12px;color:var(--tsoft);font-weight:600"><span id="rc-chars">0</span> caracteres</div>

                    <button class="ai-improve-btn" id="rc-ai-btn" disabled>
                        <span style="font-size:22px">🤖</span> Mejorar reporte con IA
                    </button>

                    <div class="ai-loading" id="rc-ai-loading">
                        <span class="ai-spin">🤖</span>
                        <div style="font-size:15px;font-weight:800;color:#4C1D95;margin-bottom:4px">Mejorando tu descripción...</div>
                        <div style="font-size:13px;color:#6D28D9;font-weight:600" id="rc-ai-sub">Formalizando el reporte técnico</div>
                    </div>

                    <div class="ai-result" id="rc-ai-result">
                        <div class="ai-result-lbl">🤖 Reporte mejorado por IA</div>
                        <div class="ai-result-txt" id="rc-ai-txt">—</div>
                        <button id="rc-rewrite-btn" class="w-100 mt-2 rounded-3 py-2"
                        style="border:1.5px solid var(--purpbd);background:transparent;color:var(--purple);font-family:'Nunito',sans-serif;font-size:14px;font-weight:800;cursor:pointer">
                        ✏️ Cambiar mi descripción y mejorar de nuevo
                        </button>
                    </div>

                <button class="btn-navy mt-2" id="rc-step3-next">Continuar →</button>
                <div id="rc-step3-err" style="color:#dc2626;font-weight:900;margin-top:10px;display:none;font-size:14px;line-height:1.2">&nbsp;</div>
                <button class="btn-back" id="rc-step3-back">← Cambiar selección</button>
                </div>


                <div class="step-panel" id="rc-step4">
                <div class="step-lbl">Resumen y estado</div>
                <div class="d-flex flex-wrap gap-2 mb-3" id="rc-summary"></div>
                <div class="ai-result on mb-3">
                    <div class="ai-result-lbl">🤖 Descripción</div>
                    <div class="ai-result-txt" id="rc-recap">—</div>
                </div>
                <div class="step-lbl mt-1">Estado del puesto</div>
                <div class="sgrid">
                    <button class="sbtn sg" data-st="sg"><span class="si">⬜</span>Sin novedad</button>
                    <button class="sbtn so on" data-st="so"><span class="si">🟠</span>Daño reportado</button>
                    <button class="sbtn sb" data-st="sb"><span class="si">🔵</span>En reparación</button>
                    <button class="sbtn sv" data-st="sv"><span class="si">🟢</span>Reparado </button>
                </div>
                <button class="btn-navy" id="rc-guardar">💾 Guardar Reporte</button>
                </div>
            </div>`,

        loadRender: () => {
            const $ = id => document.getElementById(id);

            // Montar en body evita recortes por overflow/transform.
            const modal = document.getElementById('report-modal');
            if (modal && modal.parentElement !== document.body) {
                document.body.appendChild(modal);
            }

            const DAMAGE_LABELS = {
                'pantalla o torre': 'Pantalla/Torre',
                'cable': 'Cable',
                'enchufe': 'Enchufe/Toma',
                'teclado': 'Teclado',
                'silla': 'Silla',
                'otro': 'Otro'
            };
            const STEP2 = {
                'cable': 'rc-step2-cable',
                'enchufe': 'rc-step2-enchufe',
                'silla': 'rc-step2-silla',
                'pantalla o torre': 'rc-step2-simple',
                'teclado': 'rc-step2-simple',
                'otro': 'rc-step2-simple'
            };
            function goStep(id) {
                document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('on'));
                $(id).classList.add('on');
            }

            const overlayEl = $('rc-sheet');
            if (overlayEl) {
                overlayEl.onclick = (e) => {
                    if (e.target && e.target.id === 'rc-sheet') {
                        overlayEl.classList.remove('on');
                        document.body.style.overflow = '';
                        setTimeout(() => {
                            const modal = document.getElementById('report-modal');
                            if (modal) modal.classList.add('d-none');
                        }, 300);
                    }
                };
            }

            document.querySelectorAll('.dmg-btn').forEach(btn => {
                btn.onclick = () => {
                    const raw = (btn.dataset.dmg || '').toLowerCase().trim();
                    const idx = selectedDamages.indexOf(raw);
                    if (idx >= 0) {
                        selectedDamages.splice(idx, 1);
                        btn.classList.remove('on');
                    } else {
                        selectedDamages.push(raw);
                        btn.classList.add('on');
                    }
                    const errEl = document.getElementById('rc-step1-err');
                    if (errEl && selectedDamages.length > 0) { errEl.style.display = 'none'; errEl.textContent = '' }
                };
            });

            $('rc-step1-next').onclick = () => {
                const errEl = document.getElementById('rc-step1-err');
                if (!selectedDamages || selectedDamages.length === 0) {
                    if (errEl) { errEl.textContent = 'Debes seleccionar al menos una opción.'; errEl.style.display = 'block'; }
                    return;
                }
                if (errEl) { errEl.style.display = 'none'; errEl.textContent = '' }
                detailQueue = selectedDamages.filter(d => STEP2[d]);
                currentDetailIndex = 0;
                if (detailQueue.length > 0) {
                    currentDamage = detailQueue[currentDetailIndex];
                    goStep(STEP2[currentDamage]);
                } else {
                    const step3next = $('rc-step3-next'); if (step3next) step3next.disabled = true;
                    goStep('rc-step3');
                }
            };

            document.querySelectorAll('.cable-btn').forEach(btn => btn.onclick = () => {
                document.querySelectorAll('.cable-btn').forEach(b => b.classList.remove('on'));
                btn.classList.add('on');
                detailMap['cable'] = btn.dataset.cable;
                $('rc-cable-next').disabled = false;
            });
            $('rc-cable-next').onclick = () => {
                currentDetailIndex++;
                if (currentDetailIndex < detailQueue.length) {
                    currentDamage = detailQueue[currentDetailIndex];
                    goStep(STEP2[currentDamage]);
                } else {
                        const step3next = $('rc-step3-next'); if (step3next) step3next.disabled = true;
                    goStep('rc-step3');
                }
            };
            $('rc-cable-back').onclick = () => goStep('rc-step1');

            ['rc-op-left','rc-op-right'].forEach(id => {
                $(id).onclick = () => {
                    const isSelected = $(id).classList.contains('on');
                    if (isSelected) {
                        $('rc-op-left').classList.remove('on');
                        $('rc-op-right').classList.remove('on');
                        delete detailMap['enchufe'];
                        $('rc-enc-next').disabled = true;
                    } else {
                        $('rc-op-left').classList.toggle('on', id === 'rc-op-left');
                        $('rc-op-right').classList.toggle('on', id === 'rc-op-right');
                        detailMap['enchufe'] = $(id).dataset.outlet;
                        $('rc-enc-next').disabled = false;
                    }
                };
            });
            $('rc-enc-next').onclick = () => {
                currentDetailIndex++;
                if (currentDetailIndex < detailQueue.length) {
                    currentDamage = detailQueue[currentDetailIndex];
                    goStep(STEP2[currentDamage]);
                } else {
                    const step3next = $('rc-step3-next'); if (step3next) step3next.disabled = true;
                    goStep('rc-step3');
                }
            };
            $('rc-enc-back').onclick = () => goStep('rc-step1');

            ['rc-silla-arreglar', 'rc-silla-bodega'].forEach(id => $(id).onclick = () => {
                const fix = id === 'rc-silla-arreglar';
                detailMap['silla'] = fix ? 'reparar aquí mismo' : 'enviar a bodega';
                $('rc-silla-lbl').textContent = fix ? '🔨 Se reparará en el puesto' : '📦 Se enviará a bodega';
                $('rc-silla-detail').style.display = 'block';
                $('rc-silla-next').disabled = false;
                document.getElementById('rc-silla-arreglar').classList.toggle('on', fix);
                document.getElementById('rc-silla-bodega').classList.toggle('on', !fix);
            });
            $('rc-silla-next').onclick = () => {
                currentDetailIndex++;
                if (currentDetailIndex < detailQueue.length) {
                    currentDamage = detailQueue[currentDetailIndex];
                    goStep(STEP2[currentDamage]);
                } else {
                    const step3next = $('rc-step3-next'); if (step3next) step3next.disabled = true;
                    goStep('rc-step3');
                }
            };
            $('rc-silla-back').onclick = () => goStep('rc-step1');

            $('rc-simple-next').onclick = () => goStep('rc-step3');
            $('rc-simple-back').onclick = () => goStep('rc-step1');

            const notaEl = $('rc-nota');
            if (notaEl) {
                notaEl.oninput = () => {
                    const len = notaEl.value.trim().length;
                    const chars = $('rc-chars');
                    if (chars) chars.textContent = String(len);
                    const aiBtn = $('rc-ai-btn');
                    const step3nextBtn = document.getElementById('rc-step3-next');
                    const step3Err = document.getElementById('rc-step3-err');
                    if (aiBtn) aiBtn.disabled = len === 0;
                    if (step3Err && len > 0) { step3Err.textContent = ''; step3Err.style.display = 'none'; }
                    if (step3nextBtn) step3nextBtn.disabled = len === 0;
                };
                notaEl.onblur = () => {
                    const len = notaEl.value.trim().length;
                    const step3Err = document.getElementById('rc-step3-err');
                    if (len === 0 && step3Err) {
                        step3Err.textContent = 'Debes escribir algo';
                        step3Err.style.display = 'block';
                    }
                };
            }

            const aiBtn = $('rc-ai-btn');
            if (aiBtn) {
                aiBtn.onclick = async () => {
                    const notaVal = ($('rc-nota') || {}).value || '';
                    if (!notaVal || notaVal.trim().length === 0) {
                        toast('Escribe algo primero', 'warning');
                        return;
                    }

                    const loadingEl = $('rc-ai-loading');
                    const resultEl = $('rc-ai-result');
                    if (loadingEl) loadingEl.style.display = 'flex';
                    if (resultEl) resultEl.style.display = 'none';

                    try {
                        const contexto = {
                            tipo_dano: selectedDamages.join(', ') || '',
                            activo: reportData.puestoId || '',
                            zona: 'Sala 3 — Piso 1'
                        };

                        const response = await ai_service.improve_description(notaVal.trim(), contexto);

                        if (!response.success) {
                            toast('Error al mejorar el reporte con IA', 'error');
                            if (loadingEl) loadingEl.style.display = 'none';
                            return;
                        }

                        const txtEl = $('rc-ai-txt');
                        if (txtEl && response.mejorado) {
                            txtEl.textContent = response.mejorado.texto_mejorado || response.mejorado;
                        }

                        if (loadingEl) loadingEl.style.display = 'none';
                        if (resultEl) resultEl.style.display = 'block';

                        reportData.textMejorado = response.mejorado.texto_mejorado || response.mejorado;

                        const useBtn = document.createElement('button');
                        useBtn.className = 'btn-navy w-100 mt-2';
                        useBtn.style.cssText = 'border-radius:12px;padding:10px;';
                        useBtn.textContent = '✅ Usar esta descripción mejorada';
                        useBtn.onclick = () => {
                            if ($('rc-nota')) {
                                $('rc-nota').value = reportData.textMejorado;
                                const chars = $('rc-chars');
                                if (chars) chars.textContent = String(reportData.textMejorado.length);
                                if (resultEl) resultEl.style.display = 'none';
                                const step3nextBtn = document.getElementById('rc-step3-next');
                                if (step3nextBtn) step3nextBtn.disabled = false;
                                toast('Descripción actualizada', 'success');
                            }
                        };

                        if (resultEl && !resultEl.querySelector('#use-mejorado-btn')) {
                            useBtn.id = 'use-mejorado-btn';
                            resultEl.appendChild(useBtn);
                        }

                    } catch (err) {
                        console.error('Error en mejoraDescripción:', err);
                        toast('Error al procesar la solicitud', 'error');
                        if (loadingEl) loadingEl.style.display = 'none';
                    }
                };
            }

                if ($('rc-step3-back')) {
                    $('rc-step3-back').onclick = () => {
                        const step3Err = document.getElementById('rc-step3-err'); if (step3Err) { step3Err.style.display = 'none'; step3Err.textContent = ''; }
                        goStep('rc-step1');
                        const step1Next = document.getElementById('rc-step1-next'); if (step1Next) step1Next.disabled = false;
                        const firstDmg = document.querySelector('.dmg-btn'); if (firstDmg) { try { firstDmg.focus(); } catch (e) {} }
                    };

                    document.querySelectorAll('#rc-sheet .sbtn').forEach(btn => {
                        btn.onclick = () => {
                            document.querySelectorAll('#rc-sheet .sbtn').forEach(b => b.classList.remove('on'));
                            btn.classList.add('on');
                        };
                    });

                    const step3nextBtn = document.getElementById('rc-step3-next');
                    if (step3nextBtn) {
                        step3nextBtn.onclick = () => {
                            const step3Err = document.getElementById('rc-step3-err');
                            const notaVal = (document.getElementById('rc-nota') || {}).value || '';
                            const len = notaVal.trim().length;
                            if (len === 0) {
                                        if (step3Err) {
                                            step3Err.textContent = 'Debes escribir texto';
                                            step3Err.style.display = 'block';
                                        }
                                try { const notaFocus = document.getElementById('rc-nota'); if (notaFocus) notaFocus.focus(); } catch (e) {}
                                return;
                            }
                                const step3BackEl = document.getElementById('rc-step3-back');
                                const isFanNow = !!reportData.isFan || (step3BackEl && step3BackEl.style.display === 'none');
                            // Resumen rapido para confirmar antes de guardar.
                            const summaryEl = $('rc-summary');
                            if (summaryEl) summaryEl.innerHTML = '';
                            selectedDamages.forEach(d => {
                                const lbl = DAMAGE_LABELS[d] || (d.charAt(0).toUpperCase() + d.slice(1));
                                const det = detailMap[d] ? `: ${detailMap[d]}` : '';
                                const chip = document.createElement('div');
                                chip.className = 'leg';
                                chip.style.margin = '0 6px 6px 0';
                                chip.textContent = `${lbl}${det}`;
                                if (summaryEl) summaryEl.appendChild(chip);
                            });
                            const nota = $('rc-nota');
                            const recapEl = $('rc-recap');
                            if (recapEl) recapEl.textContent = nota ? nota.value.trim() : '—';
                            goStep('rc-step4');
                        };
                    }

                    const guardarBtn = document.getElementById('rc-guardar');
                    if (guardarBtn) {
                        guardarBtn.onclick = () => {
                            // Evita guardar vacio salvo caso ventilador.
                            const isFanId = reportData.puestoId && reportData.puestoId.toString().toUpperCase().startsWith('V');
                            if ((!selectedDamages || selectedDamages.length === 0) && !isFanId) {
                                try { window.alert('Debes seleccionar una opción antes de guardar.'); }
                                catch (e) { /* no-op */ }
                                return;
                            }
                            const estadoEl = document.querySelector('#rc-sheet .sbtn.on');
                            const estado = estadoEl ? estadoEl.dataset.st : 'so';
                            const comentarioEl = document.getElementById('rc-nota');
                            reportData.categoria = selectedDamages && selectedDamages.length ? selectedDamages.join(', ') : '';
                            reportData.detalle = Object.keys(detailMap).length ? JSON.parse(JSON.stringify(detailMap)) : '';
                            reportData.estado = estado;
                            reportData.comentario = comentarioEl ? comentarioEl.value.trim() : '';
                            if (typeof onSave === 'function') {
                                onSave(reportData);
                            }
                        };
                    }
                }
        },

        open: (idPuesto, esFan = false) => {
            // Acepta id o elemento.
            const isElement = (idPuesto && typeof idPuesto === 'object' && idPuesto.dataset && idPuesto.dataset.id);
            const isFanElement = (idPuesto && typeof idPuesto === 'object' && idPuesto.classList && idPuesto.classList.contains('fan'));
            const id = isElement ? idPuesto.dataset.id : idPuesto;
            reportData.puestoId = id || '';
            reportData.categoria = '';
            reportData.comentario = '';

            selectedDamages = [];
            detailMap = {};
            detailQueue = [];
            currentDetailIndex = 0;
            currentDamage = null;

            const titulo = document.getElementById('rc-titulo');
            const isFan = Boolean(esFan) || isFanElement || (typeof id === 'string' && id && id.toString().toUpperCase().startsWith('V'));
            reportData.isFan = !!isFan;
            if (titulo) titulo.textContent = `${isFan ? 'Ventilador' : 'Puesto'} ${reportData.puestoId || ''}`;

            const modal = document.getElementById('report-modal');
            if (modal) modal.classList.remove('d-none');
            const overlay = document.getElementById('rc-sheet');
            if (overlay) overlay.classList.add('on');
            document.body.style.overflow = 'hidden';

            // En mobile, limpia estilos que pueden cortar el sheet.
            try {
                _clearedAncestors = [];
                const isMobile = window.innerWidth <= 420;
                if (isMobile) {
                    let anc = document.querySelector('.map-outer') || document.body;
                    while (anc && anc !== document.body) {
                        const cs = window.getComputedStyle(anc);
                        const hasTransform = cs.transform && cs.transform !== 'none';
                        const overflowX = cs.overflowX || cs.overflow;
                        const overflowY = cs.overflowY || cs.overflow;
                        const hasOverflow = (overflowX && overflowX !== 'visible') || (overflowY && overflowY !== 'visible');
                        if (hasTransform || hasOverflow) {
                            _clearedAncestors.push({ el: anc, transform: anc.style.transform || '', overflow: anc.style.overflow || '' });
                            if (hasTransform) anc.style.transform = 'none';
                            if (hasOverflow) anc.style.overflow = 'visible';
                        }
                        anc = anc.parentElement;
                    }
                }
            } catch (err) { console.warn('Error applying mobile ancestor fixes', err); }

            document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('on'));
            const step3Back = document.getElementById('rc-step3-back'); if (step3Back) step3Back.style.display = '';
            const step4Otro = document.getElementById('rc-otro'); if (step4Otro) step4Otro.style.display = '';

            document.querySelectorAll('.dmg-btn,.cable-btn,.op-card,.yn-btn').forEach(b => b.classList.remove('on'));

            const nota = document.getElementById('rc-nota'); if (nota) nota.value = '';
            const chars = document.getElementById('rc-chars'); if (chars) chars.textContent = '0';
            ['rc-cable-next','rc-enc-next','rc-silla-next','rc-ai-btn','rc-step3-next'].forEach(idk => {
                const el = document.getElementById(idk); if (el) el.disabled = true;
            });
            const errElOpen = document.getElementById('rc-step1-err'); if (errElOpen) { errElOpen.style.display = 'none'; errElOpen.textContent = '' }
            const sillaDetail = document.getElementById('rc-silla-detail'); if (sillaDetail) sillaDetail.style.display = 'none';
            const summaryEl = document.getElementById('rc-summary'); if (summaryEl) summaryEl.innerHTML = '';
            const recapEl = document.getElementById('rc-recap'); if (recapEl) recapEl.textContent = '—';
            document.querySelectorAll('#rc-sheet .sbtn').forEach(b => b.classList.toggle('on', b.dataset.st === 'so'));

            if (isFan) {
                if (nota) {
                    nota.value = '';
                    if (chars) chars.textContent = '0';
                    setTimeout(() => { try { nota.focus(); } catch (e) {} }, 120);
                }
                const aiBtn = document.getElementById('rc-ai-btn'); if (aiBtn) aiBtn.disabled = (nota.value.trim().length === 0);
                const step3next = document.getElementById('rc-step3-next'); if (step3next) step3next.disabled = (nota.value.trim().length === 0);
                const step3 = document.getElementById('rc-step3'); if (step3) step3.classList.add('on');
                if (step3Back) step3Back.style.display = 'none';
                if (step4Otro) step4Otro.style.display = 'none';
            } else {
                const first = document.getElementById('rc-step1'); if (first) first.classList.add('on');
            }
        },

        close: () => {
            const overlay = document.getElementById('rc-sheet');
            if (overlay) overlay.classList.remove('on');
            document.body.style.overflow = '';

            try {
                if (_clearedAncestors && _clearedAncestors.length) {
                    _clearedAncestors.forEach(item => {
                        try { item.el.style.transform = item.transform || ''; } catch (e) {}
                        try { item.el.style.overflow = item.overflow || ''; } catch (e) {}
                    });
                    _clearedAncestors = [];
                }
            } catch (err) { console.warn('Error restoring ancestor styles', err); }
            setTimeout(() => {
                const modal = document.getElementById('report-modal');
                if (modal) modal.classList.add('d-none');
            }, 300);
        }
    };
};