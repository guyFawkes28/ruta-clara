import axios from 'axios'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.error('[AIService]  OPENAI_API_KEY no configurada en .env. La funcionalidad de IA no funcionará.')
} else if (!OPENAI_API_KEY.startsWith('sk-')) {
  console.error('[AIService]  OPENAI_API_KEY tiene formato inválido. Debe comenzar con "sk-"')
} else {
  console.log('[AIService]  OPENAI_API_KEY configurada correctamente')
}

const openaiClient = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY || ''}`,
    'Content-Type': 'application/json'
  }
})

export const ai_service = {
  /**
   * Analizar reportes de daños y sugerir mejoras en clasificación
   * @param {Object} evento - { tipo_dano, activo, zona, descripcion }
   */
  async improve_report_classification(evento) {
    try {
      const prompt = `
Analiza este reporte de mantenimiento y proporciona:
1. Clasificación de severidad (1-10)
2. Categoría de daño sugerida
3. Tipo de herramientas necesarias
4. Tiempo estimado en minutos
5. Materiales/Repuestos probables

Datos del evento:
- Tipo de daño inicial: "${evento.tipo_dano}"
- Activo afectado: "${evento.activo}"
- Ubicación: "${evento.zona}"
- Descripción: "${evento.descripcion || 'Sin descripción detallada'}"

Responde SOLO en JSON sin markdown:
{
  "prioridad": <número 1-10>,
  "categoria": "<categoría>",
  "herramientas": ["<herramienta1>", "<herramienta2>"],
  "tiempo_estimado_minutos": <número>,
  "repuestos_probables": ["<repuesto1>", "<repuesto2>"],
  "recomendaciones": "<texto corto>"
}
      `

      const response = await openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en mantenimiento de infraestructura tecnológica. Analiza reportes de daños y proporciona clasificaciones precisas.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })

      const content = response.data.choices[0].message.content
      const analysis = JSON.parse(content)

      return {
        success: true,
        original: evento,
        analisis_ia: analysis
      }
    } catch (err) {
      console.error('[AIService] Error:', err.response?.data || err.message)
      return {
        success: false,
        error: err.message,
        analisis_ia: null
      }
    }
  },

  /**
   * Sugerir orden de tareas optimizado por eficiencia
   * @param {Array} tareas - Array de tareas pendientes
   */
  async optimize_task_order(tareas) {
    try {
      const tareasText = tareas.map((t, i) => `
${i + 1}. ID: ${t.id_tarea}, Daño: ${t.tipo_dano}, Zona: ${t.zona}, Prioridad IA: ${t.prioridad_ia}
      `).join('\n')

      const prompt = `
Tienes estas tareas de mantenimiento. Ordénalas por EFICIENCIA considerando:
1. Agrupar por tipo de herramienta (electricidad primero, luego mecánica, etc.)
2. Agrupar por zona para minimizar desplazamientos
3. Respetar la prioridad (números altos = más urgentes)

Tareas:
${tareasText}

Responde SOLO en JSON:
{
  "orden_optimizado": [
    {
      "posicion": 1,
      "tarea_id": <id>,
      "razon": "<explicación breve>"
    }
  ],
  "tiempo_total_estimado_minutos": <número>,
  "notas": "<observaciones>"
}
      `

      const response = await openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en optimización de rutas y procesos. Ordena tareas para máxima eficiencia.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })

      const content = response.data.choices[0].message.content
      const optimization = JSON.parse(content)

      return {
        success: true,
        tareas_originales: tareas.length,
        optimizacion_ia: optimization
      }
    } catch (err) {
      console.error('[AIService] Error:', err.response?.data || err.message)
      return {
        success: false,
        error: err.message,
        optimizacion_ia: null
      }
    }
  },

  /**
   * Mejorar descripción de un reporte: corregir ortografía, hacer más detallado y preciso
   * @param {string} descripcionOriginal - Texto de descripción del usuario
   * @param {Object} contexto - { tipo_dano, activo, zona } para contexto adicional
   */
  async improve_report_description(descripcionOriginal, contexto = {}) {
    try {
      const prompt = `
Eres un experto técnico en mantenimiento de infraestructura. Tu tarea es MEJORAR una descripción de daño:

DESCRIPCIÓN ORIGINAL (puede tener errores de ortografía):
"${descripcionOriginal}"

CONTEXTO:
- Tipo de daño: ${contexto.tipo_dano || 'No especificado'}
- Activo/Componente: ${contexto.activo || 'No especificado'}
- Ubicación/Zona: ${contexto.zona || 'No especificado'}

INSTRUCCIONES:
1. CORRIGE errores de ortografía, acentos y redacción
2. AMPLÍA con detalles técnicos relevantes
3. ORGANIZA la información de manera clara y profesional
4. MANTÉN el tono de un reporte técnico
5. AGREGA observaciones útiles para el técnico que lo va a reparar
6. NO añadas información que no esté implícita en el original

FORMATO DE RESPUESTA - SOLO el texto mejorado en JSON:
{
  "texto_mejorado": "<aquí el texto corregido y mejorado, en párrafos bien formados>",
  "cambios_principales": ["<cambio 1>", "<cambio 2>", "<cambio 3>"],
  "observaciones_tecnicas": "<dato técnico o recomendación útil>"
}
      `

      console.log('[AIService] Enviando solicitud a OpenAI para mejorar descripción...')
      const response = await openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un redactor técnico especializado en reportes de mantenimiento. Mejora descripciones de daños de forma precisa y profesional.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      })

      const content = response.data.choices[0].message.content
      console.log('[AIService] Respuesta de OpenAI recibida:', content.substring(0, 100) + '...')
      
      // Limpiar markdown code blocks si existen
      let jsonContent = content.trim()
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/^```json\n?/, '').replace(/\n?```$/, '')
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/^```\n?/, '').replace(/\n?```$/, '')
      }
      
      const improvement = JSON.parse(jsonContent)

      return {
        success: true,
        original: descripcionOriginal,
        mejorado: improvement
      }
    } catch (err) {
      const errorDetails = {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      }
      console.error('[AIService] Error en improveReportDescription:', errorDetails)
      console.error('[AIService] Stack:', err.stack)
      
      // Retornar error más detallado
      return {
        success: false,
        error: err.response?.data?.error?.message || err.message,
        details: errorDetails,
        mejorado: null
      }
    }
  },

  /**
   * Generar recomendación de compra basada en historial
   * @param {Array} repuestosEnStock - Array de repuestos con stock_actual y stock_minimo
   */
  async suggest_purchase_orders(repuestosEnStock) {
    try {
      const repuestosText = repuestosEnStock.map(r => 
        `${r.nombre}: ${r.stock_actual}/${r.stock_minimo} unidades`
      ).join('\n')

      const prompt = `
Basándote en este inventario, sugiere órdenes de compra considerando:
1. Repuestos bajo stock_minimo
2. Patrones de consumo
3. Cantidad económica de compra (lotes mínimos)

Inventario actual:
${repuestosText}

Responde SOLO en JSON:
{
  "ordenes_sugeridas": [
    {
      "repuesto": "<nombre>",
      "cantidad_actual": <número>,
      "cantidad_comprar": <número>,
      "razon": "<explicación>"
    }
  ],
  "presupuesto_estimado": "Consultar con proveedor",
  "urgencia": "<ALTA|MEDIA|BAJA>"
}
      `

      const response = await openaiClient.post('/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Eres un experto en gestión de inventario. Sugiere órdenes de compra inteligentes.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 600
      })

      const content = response.data.choices[0].message.content
      const purchase = JSON.parse(content)

      return {
        success: true,
        sugerencias_compra: purchase
      }
    } catch (err) {
      console.error('[AIService] Error:', err.response?.data || err.message)
      return {
        success: false,
        error: err.message,
        sugerencias_compra: null
      }
    }
  }
}

export default ai_service
