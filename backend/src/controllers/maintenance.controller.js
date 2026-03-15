import { supabase } from "../config/db.js";

export const getZonasByQr = async (req, res) => {
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
        const activosConFallos = activos.map(activo => {
            // Extraemos solo los nombres de las incidencias de tareas que no estén finalizadas
            const fallosActuales = activo.tareas
                ?.filter(t => t.estado_tarea !== 'Completado')
                .flatMap(t => t.tarea_detalles_incidencia.map(det => det.tipos_incidencia.nombre)) || [];

            return {
                ...activo,
                fallos_activos: fallosActuales // Ej: ["Silla", "Monitor"]
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

export const getTiposIncidencia = async (req, res) => {
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


export const getPendingTasks = async (req, res) => {
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


export const crearReporteMantenimiento = async (req, res) => {
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

        res.status(201).json({ success: true, tarea_id: tareaId });
    } catch (err) {
        console.error('crearReporteMantenimiento error:', err);
        const msg = err?.message || err?.error || err?.statusText || 'Error al crear reporte';
        res.status(err?.status || 400).json({ error: msg });
    }
};

// Obtener inspecciones recientes
export const getRecentInspections = async (req, res) => {
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
export const getRecentReports = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Traer tareas creadas recientemente
        const { data: reportes, error: repErr } = await supabase
            .from('tareas')
            .select(`
                id_tarea,
                tipo_dano,
                estado_tarea,
                fecha_creacion,
                operador_id,
                usuarios(
                    id_usuario,
                    name
                )
            `)
            .order('fecha_creacion', { ascending: false })
            .limit(limit);

        if (repErr) throw repErr;

        const reportesList = reportes.map(r => ({
            id: r.id_tarea,
            tipo: r.tipo_dano || 'Reporte',
            fecha: new Date(r.fecha_creacion).toLocaleDateString('es-CO'),
            autor: r.usuarios?.name || 'Sistema',
            estado: r.estado_tarea?.toLowerCase() === 'pendiente' ? 'pendiente' : 'en_progreso'
        })) || [];

        res.json({ reportes: reportesList });
    } catch (err) {
        console.error('[getRecentReports] Error:', err);
        res.status(500).json({ error: 'Error al obtener reportes', reportes: [] });
    }
};

