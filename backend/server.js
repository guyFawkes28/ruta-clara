import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;

    if (!message) return res.status(400).json({ error: "Mensaje vacío" });

    const API_KEY = process.env.OPENAI_API_KEY;
    const API_URL = "https://api.openai.com/v1/chat/completions";

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                temperature: 0,
                messages: [
                    {
                        role: "system",
                        content: `Eres un asistente de reportes corporativos. Analiza el mensaje del trabajador y redacta una version profesional, clara y breve. Responde UNICAMENTE con este formato, usando saltos de linea entre cada seccion:

REPORTE ANALIZADO

Mensaje corregido:
[Redaccion formal en 2 a 4 lineas, con ortografia correcta y tono profesional]

Área:
[Aseo o Mantenimiento]

Estado:
[Pendiente, En proceso o Completado]

Reporte ejecutivo:
[3 oraciones maximo: situacion detectada, accion requerida o ejecutada, y resultado/estado actual]

REGLAS:
1. Usa lenguaje tecnico sencillo y profesional.
2. Evita muletillas, frases informales y redundancias.
3. No uses asteriscos, guiones, emojis ni texto adicional fuera del formato.
4. No inventes datos que no esten en el mensaje original.`
                    },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json();
        res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        res.status(500).json({ error: "Error de conexión" });
    }
});

app.listen(3000, () => console.log('🚀 Servidor en puerto 3000'));