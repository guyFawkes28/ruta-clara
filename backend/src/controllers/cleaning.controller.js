import { connectMongo } from "../config/mongo.js";
import { supabase } from "../config/db.js";
import { io } from "../../app.js";

export const create_cleaning = async (req, res) => {
  try {
    const db = await connectMongo();

    const { zone_id, user_name, descriptions, hora_inicio, hora_fin } = req.body;

    const cleaning = {
      zone_id,
      user_name,
      descriptions,
      hora_inicio: hora_inicio || new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bogota' }),
      hora_fin: hora_fin || null,
      createdAt: new Date()
    };

    const result = await db
      .collection("cleaning_logs")
      .insertOne(cleaning);

    // Retornar el objeto completo con el ID insertado
    const createdCleaning = {
      ...cleaning,
      _id: result.insertedId
    };

    // Emitir evento por socket para actualizar dashboard en tiempo real
    io.emit('cleaning-created', {
      _id: createdCleaning._id,
      zone_id: zone_id,
      user_name: user_name,
      descriptions: descriptions,
      hora_inicio: createdCleaning.hora_inicio,
      hora_fin: hora_fin || null,
      createdAt: createdCleaning.createdAt
    });
    console.log('[Cleaning]  Evento socket emitido: cleaning-created');

    res.status(201).json({
      message: "Cleaning registered successfully",
      ...createdCleaning
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const get_cleanings = async (req, res) => {
  try {
    const db = await connectMongo();
    const { fecha } = req.query;

    let filtro = {};

    if (fecha) {
      const inicio = new Date(fecha + "T00:00:00-05:00");
      const fin = new Date(fecha + "T23:59:59-05:00");

      filtro.createdAt = {
        $gte: inicio,
        $lte: fin
      };
    }

    const cleanings = await db
      .collection("cleaning_logs")
      .find(filtro)
      .sort({ createdAt: -1 })
      .toArray();

    const resultado = cleanings.map(c => ({
      ...c,
      fecha_colombia: new Date(c.createdAt).toLocaleString("es-CO", {
        timeZone: "America/Bogota"
      })
    }));

    res.json(resultado);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const get_current_cleaning_info = async (req, res) => {
  try {
    // Leer ambos parámetros desde query
    const { codigo_qr, user_id } = req.query;

    if (!codigo_qr) {
      return res.status(400).json({ error: "codigo_qr es requerido" });
    }

    if (!user_id) {
      return res.status(400).json({ error: "user_id es requerido" });
    }

    // Buscar la zona en Supabase usando el código QR
    const { data: zona, error: zonaError } = await supabase
      .from("zonas")
      .select("id_zona, nombre")
      .eq("codigo_qr", codigo_qr)
      .single();

    if (zonaError || !zona) {
      return res.status(404).json({ error: "Zona no encontrada" });
    }

    // Buscar el nombre real del usuario
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuarios")
      .select("nombre")
      .eq("id", user_id)
      .single();

    if (usuarioError || !usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({
      zone_id: zona.id_zona,
      zone_name: zona.nombre,
      user_name: usuario.nombre
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};