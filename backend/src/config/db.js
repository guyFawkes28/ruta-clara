import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

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