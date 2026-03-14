import { connectMongo } from "../config/mongo.js";
import { supabase } from "../config/db.js";

export const createCleaning = async (req, res) => {
  try {
    const db = await connectMongo();

    const { zone_id, user_name, descriptions, hora_fin } = req.body;

    const cleaning = {
      zone_id,
      user_name,
      descriptions,
      hora_fin: hora_fin || null,
      createdAt: new Date()
    };

    const result = await db
      .collection("cleaning_logs")
      .insertOne(cleaning);

    res.status(201).json({
      message: "Cleaning registered successfully",
      id: result.insertedId
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCleanings = async (req, res) => {
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

export const getCurrentCleaningInfo = async (req, res) => {
  try {
    // FIX 1: Se leen ambos parámetros requeridos desde query
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

    // FIX 2: Buscar el nombre del usuario real en la tabla usuarios
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