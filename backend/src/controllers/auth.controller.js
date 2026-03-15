import { supabase } from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'


export const user_register = async (req,res) => {

    const {email,name,pin} = req.body

    if (!email || !name || !pin){

        return res.status(400).json({error:"Todos los campos son obligatorios"})
    }

    try {

        const salt = 10

        const hashedPin = await bcrypt.hash(String(pin),salt)


        const {data,error} = await supabase
        .from('usuarios')
        .insert([
            {
                email: email.toLowerCase().trim(),
                pin:hashedPin,
                name,
                rol:'OPERATOR'
            }
        ])
        .select()

      if (error) {
            if (error.code === '23505') return res.status(400).json({ error: "El email ya está registrado" });
            throw error;
        }

        res.status(201).json({ message: "Usuario creado con éxito", user: data[0].email });
        
    } catch (error) {

        console.error("Error en registro:", error);
        res.status(500).json({ error: "Error al registrar usuario" });
        
    }


  
}
export const user_logout = (req, res) => {
    // Limpia la cookie llamada 'token'
    res.clearCookie('token', {
        httpOnly: true,
        secure: false, 
        sameSite: 'lax'
    });
    
    return res.json({ message: "Sesión cerrada correctamente" })
}




export const user_login  = async (req, res) => {
    const { email, pin } = req.body;

    if (!email || !pin) {
        return res.status(400).json({ error: "email y pin son requeridos" });
    }

    const emailClean = email.toLowerCase().trim();
    const pinStr = String(pin).trim();

    if (!/^\d{4}$/.test(pinStr)) {
        return res.status(400).json({ error: "el pin debe ser exactamente 4 numeros" });
    }

    try {
        const { data: user, error } = await supabase
            .from("usuarios")
            .select("*")
            .eq("email", emailClean)
            .single();

       
        if (error || !user) {
            console.log("Detalle del fallo:", error?.message); 
            return res.status(401).json({ error: "Usuario no autorizado o no existente" });
        }

        const pinValidate = await bcrypt.compare(pinStr,user.pin)

        if (!pinValidate){
            return res.status(401).json({ error: "PIN incorrecto" });
        }

        const token = jwt.sign({

            id_usuario:user.id_usuario,
            rol:user.rol,
            email:user.email
        },
        process.env.JWT_SECRET,
        {expiresIn:'8h'}
    
    
    )

    res.cookie('token',token,{

        httpOnly:true,
        secure:false,
        sameSite:'lax',
        maxAge:8*60*60*1000
    })




        return res.json({
            id_usuario: user.id_usuario,
            name: user.name,
            email: user.email,
            rol: user.rol,
        });
    } catch (error) {
        console.error("Error en el catch:", error);
        return res.status(500).json({ error: "Error interno del servidor" });
    }
};