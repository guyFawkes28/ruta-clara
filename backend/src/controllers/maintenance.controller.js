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
                ?.filter(t => t.estado_tarea !== 'Finalizada')
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
                    id_detalle,
                    incidencia_id,
                    tipos_incidencia(nombre)
                )
            `)
            .eq('estado_tarea', 'Pendiente')
            .order('prioridad_ia', { ascending: false })
            .order('fecha_creacion', { ascending: true });

        if (tareasErr) throw tareasErr;

        console.log('getPendingTasks result:', tareas?.length || 0, 'tareas pendientes');
        console.log('Sample tarea:', JSON.stringify(tareas?.[0], null, 2));

        res.json({
            tareas: tareas || [],
            total: tareas?.length || 0
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

        const { data, error } = await supabase.rpc('registrar_reporte_completo', {
            p_activo_id: activoIdNum,
            p_operador_id,
            p_incidencias_ids: incidencias,
            p_comentario_general,
            p_nuevo_estado: p_nuevo_estado || 'Naranja'
        });

        if (error) throw error;

        res.status(201).json({ success: true, tarea_id: data });
    } catch (err) {
        console.error('crearReporteMantenimiento error:', err);
        const msg = err?.message || err?.error || err?.statusText || 'Error al crear reporte';
        res.status(err?.status || 400).json({ error: msg });
    }
};

