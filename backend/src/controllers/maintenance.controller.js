import { supabase } from "../config/db.js";
import { io } from '../../app.js'

export const get_zone_by_qr = async (req, res) => {
    try {
        const { qr_code } = req.params;
        const valor = decodeURIComponent(qr_code).trim();

        console.log("Código QR recibido:", valor);

        // Validar el formato del código QR
        if (!valor || typeof valor !== 'string' || valor.length === 0) {
            return res.status(400).json({ error: "Código QR inválido" });
        }

        // 1. Buscamos la zona
        const { data: zona, error: zonaErr } = await supabase
            .from('zonas')
            .select('*')
            .or(`codigo_qr.ilike."${valor}", id_zona.eq.${isNaN(valor) ? -1 : valor}`)
            .maybeSingle();

        if (zonaErr || !zona) {
            return res.status(404).json({ error: "La zona no existe en el sistema" });
        }

        // 2. Traemos activos con sus tipos Y sus fallos actuales (DETALLES)
        // Esto permite que el mapa sepa qué está roto en cada puesto naranja
        const { data: activos, error: activosErr } = await supabase
            .from('activos')
            .select(`
                *,
                tipos_activo(nombre),
                tareas(
                    id_tarea,
                    estado_tarea,
                    tarea_detalles_incidencia(
                        tipos_incidencia(nombre)
                    )
                )
            `)
            .eq('zona_id', zona.id_zona);

        // Manejo de errores en la consulta de activos
        if (activosErr) {
            return res.status(500).json({ error: "Error al obtener los activos de la zona" });
        }

        // 3. Limpiamos la respuesta para que el Front no tenga que procesar tanto
        const activosConFallos = activos.map((activo, idx) => {
            console.log(`[Backend] Activo ${idx}:`, {
              etiqueta: activo.etiqueta,
              codigo: activo.codigo,
              nombre: activo.nombre,
              id: activo.id_activo,
              todos_los_campos: Object.keys(activo)
            })
            
            // Extraemos solo los nombres de las incidencias de tareas que no estén finalizadas
            const fallosActuales = activo.tareas
                ?.filter(t => t.estado_tarea !== 'Terminada')
                .flatMap(t => t.tarea_detalles_incidencia.map(det => det.tipos_incidencia.nombre)) || [];

            // Calcular estado del equipo basado en estado de tareas
            let estado = 'Gris' // Sin novedad por defecto
            
            if (activo.tareas && activo.tareas.length > 0) {
                // Filtrar solo tareas no completadas/terminadas
                const tareasActivas = activo.tareas.filter(t => t.estado_tarea !== 'Terminada')
                
                if (tareasActivas.length > 0) {
                    // Verificar si hay tareas en ejecución
                    const enEjecucion = tareasActivas.some(t => t.estado_tarea === 'En Proceso')
                    
                    if (enEjecucion) {
                        estado = 'Azul' // En reparación
                    } else {
                        // Si hay tareas pero ninguna en proceso, probablemente estén pendientes
                        estado = 'Naranja' // Daño reportado
                    }
                }
            }

            return {
                ...activo,
                fallos_activos: fallosActuales,
                estado: estado // Agregar estado para el mapa
            };
        });

        return res.json({
            info_zona: {
                id: zona.id_zona,
                nombre: zona.nombre,
                piso: zona.piso
            },
            activos: activosConFallos
        });

    } catch (err) {
        console.error("Error total:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
}

export const get_incident_types = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tipos_incidencia')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: "Error al obtener catálogo" });
    }
}


export const get_pending_tasks = async (req, res) => {
    try {
        // Traer todas las tareas con estado 'Pendiente' con detalles completos
        const { data: tareas, error: tareasErr } = await supabase
            .from('tareas')
            .select(`
                id_tarea,
                tipo_dano,
                prioridad_ia,
                estado_tarea,
                fecha_creacion,
                activo_id,
                operador_id,
                activos(
                    id_activo,
                    etiqueta,
                    estado,
                    zona_id,
                    tipos_activo(nombre),
                    zonas(nombre, piso)
                ),
                tarea_detalles_incidencia(
                    *,
                    tipos_incidencia(id_incidencia, nombre)
                )
            `)
            .eq('estado_tarea', 'Pendiente')
            .order('prioridad_ia', { ascending: false })
            .order('fecha_creacion', { ascending: true });

        if (tareasErr) {
            console.error('getPendingTasks query error:', JSON.stringify(tareasErr, null, 2));
            throw tareasErr;
        }

        console.log('getPendingTasks result:', tareas?.length || 0, 'tareas pendientes');
        
        // Filtrar solo tareas con estado 'Pendiente' (validación adicional)
        const pendienteTasks = (tareas || []).filter(t => t.estado_tarea === 'Pendiente');
        console.log('getPendingTasks filtered:', pendienteTasks.length, 'tareas después de validar estado');

        res.json({
            tareas: pendienteTasks,
            total: pendienteTasks.length
        });

    } catch (err) {
        console.error('getPendingTasks error:', err);
        res.status(500).json({ error: 'Error al obtener tareas pendientes' });
    }
}


export const create_maintenance_report = async (req, res) => {
    const { p_activo_id, p_incidencias_ids, p_comentario_general, p_nuevo_estado } = req.body;

    const p_operador_id = req.user?.id_usuario ?? req.user?.id ?? null;

    if (!p_activo_id) return res.status(400).json({ error: 'p_activo_id es requerido' });

    const activoIdNum = Number(p_activo_id);
    if (Number.isNaN(activoIdNum) || !Number.isInteger(activoIdNum)) {
        return res.status(400).json({ error: `p_activo_id debe ser un entero. Recibido: ${p_activo_id}` });
    }

    const incidencias = Array.isArray(p_incidencias_ids) ? p_incidencias_ids.map(i => Number(i)) : [];

    try {
        console.log('crearReporteMantenimiento params:', { p_activo_id: activoIdNum, p_operador_id, incidencias, p_comentario_general, p_nuevo_estado });

        // 1. Crear la tarea
        const { data: tareaData, error: tareaError } = await supabase
            .from('tareas')
            .insert({
                activo_id: activoIdNum,
                operador_id: p_operador_id,
                tipo_dano: p_comentario_general || '',
                prioridad_ia: 5,
                estado_tarea: 'Pendiente'
            })
            .select('id_tarea')
            .single();

        if (tareaError) throw tareaError;

        const tareaId = tareaData.id_tarea;
        console.log('Tarea creada:', tareaId);

        // 2. Insertar las incidencias relacionadas
        if (incidencias.length > 0) {
            const incidenciasData = incidencias.map(incidencia_id => ({
                tarea_id: tareaId,
                incidencia_id: incidencia_id
            }));

            const { error: incidenciasError } = await supabase
                .from('tarea_detalles_incidencia')
                .insert(incidenciasData);

            if (incidenciasError) {
                console.error('Error insertando incidencias:', incidenciasError);
                throw incidenciasError;
            }
            console.log('Incidencias insertadas:', incidencias.length);
        }

        // 3. Actualizar estado del activo si se proporciona
        if (p_nuevo_estado) {
            const { error: activoError } = await supabase
                .from('activos')
                .update({ estado: p_nuevo_estado })
                .eq('id_activo', activoIdNum);

            if (activoError) {
                console.error('Error actualizando activo:', activoError);
            }
        }

        // Obtener etiqueta del activo para notificar al dashboard en tiempo real
        try {
            const { data: activoData, error: activoFetchError } = await supabase
                .from('activos')
                .select('etiqueta')
                .eq('id_activo', activoIdNum)
                .single();

            if (activoFetchError) {
                console.warn('Warning: no se pudo obtener etiqueta del activo para emitir socket:', activoFetchError);
            }

            const payload = {
                etiqueta: activoData?.etiqueta || null,
                tarea_id: tareaId,
                estado: p_nuevo_estado || 'Pendiente',
                descripcion: p_comentario_general || '',
                creado_por: p_operador_id,
                fecha_creacion: new Date().toISOString()
            }

            // Emitir evento al servidor Socket.io para que los dashboards conectados reciban el reporte
            try {
                io.emit('report-created', payload)
                console.log('[Maintenance]  report-created emitted via socket:', payload)
            } catch (emitErr) {
                console.error('[Maintenance] Error emitting report-created:', emitErr)
            }
        } catch (notifyErr) {
            console.error('[Maintenance] Error preparando notificación por socket:', notifyErr)
        }

        res.status(201).json({ success: true, tarea_id: tareaId });
    } catch (err) {
        console.error('crearReporteMantenimiento error:', err);
        const msg = err?.message || err?.error || err?.statusText || 'Error al crear reporte';
        res.status(err?.status || 400).json({ error: msg });
    }
};

// Obtener inspecciones recientes
export const get_recent_inspections = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        console.log('[getRecentInspections] Iniciando con limit:', limit);
        
        // Devolver lista vacía para ahora - evitar errores de relaciones
        console.log('[getRecentInspections] Retornando lista vacía por ahora');
        res.json({ inspecciones: [] });
    } catch (err) {
        console.error('[getRecentInspections] Error:', err);
        res.status(500).json({ error: 'Error al obtener inspecciones', inspecciones: [] });
    }
};

// Obtener reportes recientes
export const get_recent_reports = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        console.log('[getRecentReports] Iniciando con limit:', limit);
        
        // Traer tareas creadas recientemente con datos básicos
        const { data: reportes, error: repErr } = await supabase
            .from('tareas')
            .select('id_tarea, tipo_dano, estado_tarea, fecha_creacion')
            .order('fecha_creacion', { ascending: false })
            .limit(limit);

        if (repErr) {
            console.error('[getRecentReports] Error en query de tareas:', repErr.message);
            throw repErr;
        }

        console.log('[getRecentReports] Tareas obtenidas:', reportes?.length || 0);

        // Contar reportes por estado
        const estadosCount = {};
        (reportes || []).forEach(r => {
            const estado = r.estado_tarea || 'Pendiente';
            estadosCount[estado] = (estadosCount[estado] || 0) + 1;
        });

        // Procesar y mapear datos
        const reportesList = (reportes || []).map(r => {
            try {
                return {
                    id: r.id_tarea,
                    descripcion: r.tipo_dano || 'Reporte',
                    fecha: r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleDateString('es-CO') : 'N/A',
                    generadoPor: 'Antonio',
                    estado: r.estado_tarea || 'Pendiente'
                };
            } catch (mapErr) {
                console.error('[getRecentReports] Error mapeando reporte:', r, mapErr);
                return {
                    id: r.id_tarea || '?',
                    descripcion: r.tipo_dano || 'Reporte',
                    fecha: 'Error',
                    generadoPor: 'Antonio',
                    estado: r.estado_tarea || 'Pendiente'
                };
            }
        });

        console.log('[getRecentReports] Reportes procesados:', reportesList.length);

        res.json({ 
            reportes: reportesList,
            resumen_estados: estadosCount,
            total: reportes?.length || 0
        });
    } catch (err) {
        console.error('[getRecentReports] Error capturado:', err.message || err);
        res.status(500).json({ 
            error: 'Error al obtener reportes: ' + (err.message || 'Error desconocido'),
            reportes: [], 
            resumen_estados: {} 
        });
    }
};

