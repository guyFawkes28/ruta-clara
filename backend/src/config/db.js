import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';

dotenv.config();

// ─── Supabase ────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('FATAL: Las credenciales de Supabase no están configuradas en el .env');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false 
    }
});

// ─── MongoDB ─────────────────────────────────────────
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/ruta-clara';

export const connectMongo = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log(' MongoDB conectado');
    } catch (err) {
        console.error(' Error conectando a MongoDB:', err.message);
        throw err;
    }
};