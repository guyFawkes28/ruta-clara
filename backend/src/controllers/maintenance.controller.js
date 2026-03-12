import { supabase } from "../config/db.js";

export const getZonasByQr = async (req, res) => {
    try {
        const { qr_code } = req.params;
        const valor = decodeURIComponent(qr_code).trim();

        console.log("Buscando en DB:", valor);

        // Buscamos coincidencia en codigo_qr o en id_zona
        const { data: zona, error: zonaErr } = await supabase
            .from('zonas')
            .select('*')
            .or(`codigo_qr.ilike."${valor}", id_zona.eq.${isNaN(valor) ? -1 : valor}`)
            .maybeSingle();

        if (zonaErr || !zona) {
            return res.status(404).json({ error: "La zona no existe en el sistema" });
        }

        // Traemos los activos de esa zona
        const { data: activos, error: activosErr } = await supabase
            .from('activos')
            .select('*, tipos_activo(nombre)')
            .eq('zona_id', zona.id_zona);

        return res.json({
            info_zona: {
                id: zona.id_zona,
                nombre: zona.nombre,
                piso: zona.piso
            },
            activos: activos || []
        });

    } catch (err) {
        console.error("Error total:", err);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};