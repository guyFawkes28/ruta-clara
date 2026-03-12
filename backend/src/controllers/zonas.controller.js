import { supabase } from "../config/db.js"

export const getZonasByQr = async (req, res) => {
    try {
        const { qr_code } = req.params
        const id_operador = req.user.id_usuario;

        // 1. Buscar la zona (salón) por el código QR que leyó la cámara
        const { data: zona, error: zonaErr } = await supabase
            .from('zonas')
            .select('*')
            .eq('codigo_qr', qr_code) 
            .single()

        if (zonaErr || !zona) {
            return res.status(404).json({ error: "Zona no encontrada en la sede" })
        }

        // 2. Traer todos los activos 
        const { data: activos, error: activosErr } = await supabase
            .from('activos')
            .select(`
                id_activo,
                posicion_x,
                posicion_y,
                estado,
                es_movil,
                tipos_activo (nombre)
            `)
            .eq('zona_id', zona.id_zona)

        // 3. Respuesta final para pintar el mapa
        return res.json({
            info_zona: {
                id: zona.id_zona,
                nombre: zona.nombre,
                piso: zona.piso
            },
            operador_responsable: id_operador,
            activos: activos || []
        });

    } catch (error) {
        console.error("Error en getZonasByQr:", error);
        res.status(500).json({ error: "Error interno al cargar la zona" });
    }

};