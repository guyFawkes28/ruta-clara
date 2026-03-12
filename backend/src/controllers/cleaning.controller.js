import { connectMongo } from "../config/mongo.js";

export const createCleaning = async (req, res) => {
  try {
    const db = await connectMongo();

    const { zone_id, user_name, descriptions } = req.body;

    const cleaning = {
      zone_id,
      user_name,
      descriptions,
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