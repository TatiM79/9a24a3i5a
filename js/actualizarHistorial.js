// actualizarHistorial.js - Funciones para actualizar datos del historial progresivamente

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
    getFirestore,
    doc,
    updateDoc,
    getDoc,
    query,
    collection,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==================== FUNCIONES PARA ACTUALIZAR HISTORIAL ====================

/**
 * Actualizar clave de un usuario en el historial
 * @param {string} usuario - Nombre del usuario
 * @param {string} clave - Clave del usuario
 */
export async function actualizarClaveHistorial(usuario, clave) {
    try {
        console.log(`🔑 Actualizando clave para usuario: ${usuario}`);
        
        // Buscar todos los registros del usuario
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const promesasActualizacion = [];
        
        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesasActualizacion.push(
                updateDoc(docRef, {
                    clave: clave,
                })
            );
        });
        
        await Promise.all(promesasActualizacion);
        console.log(`✅ Clave actualizada para ${promesasActualizacion.length} registros`);
        
        return true;
    } catch (error) {
        console.error("❌ Error actualizando clave:", error);
        return false;
    }
}

/**
 * Actualizar pregunta de seguridad 1
 * @param {string} usuario - Nombre del usuario
 * @param {string} pregunta - Pregunta de seguridad 1
 */
export async function actualizarPregunta1Historial(usuario, pregunta) {
    try {
        console.log(`🔐 Actualizando pregunta seguridad 1 para: ${usuario}`);
        
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const promesasActualizacion = [];
        
        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesasActualizacion.push(
                updateDoc(docRef, {
                    preguntaSeguridad1: pregunta,
                    pregunta1Actualizada: new Date().toISOString()
                })
            );
        });
        
        await Promise.all(promesasActualizacion);
        console.log(`✅ Pregunta 1 actualizada para ${promesasActualizacion.length} registros`);
        
        return true;
    } catch (error) {
        console.error("❌ Error actualizando pregunta 1:", error);
        return false;
    }
}

/**
 * Actualizar pregunta de seguridad 2
 * @param {string} usuario - Nombre del usuario
 * @param {string} pregunta - Pregunta de seguridad 2
 */
export async function actualizarPregunta2Historial(usuario, pregunta) {
    try {
        console.log(`🔐 Actualizando pregunta seguridad 2 para: ${usuario}`);
        
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const promesasActualizacion = [];
        
        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesasActualizacion.push(
                updateDoc(docRef, {
                    preguntaSeguridad2: pregunta,
                    pregunta2Actualizada: new Date().toISOString()
                })
            );
        });
        
        await Promise.all(promesasActualizacion);
        console.log(`✅ Pregunta 2 actualizada para ${promesasActualizacion.length} registros`);
        
        return true;
    } catch (error) {
        console.error("❌ Error actualizando pregunta 2:", error);
        return false;
    }
}

/**
 * Actualizar clave de operaciones especiales
 * @param {string} usuario - Nombre del usuario
 * @param {string} claveOp - Clave de operaciones especiales
 */
export async function actualizarClaveOperacionesHistorial(usuario, claveOp) {
    try {
        console.log(`🔒 Actualizando clave operaciones para: ${usuario}`);
        
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const promesasActualizacion = [];
        
        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesasActualizacion.push(
                updateDoc(docRef, {
                    claveOperaciones: claveOp,
                })
            );
        });
        
        await Promise.all(promesasActualizacion);
        console.log(`✅ Clave operaciones actualizada para ${promesasActualizacion.length} registros`);
        
        return true;
    } catch (error) {
        console.error("❌ Error actualizando clave operaciones:", error);
        return false;
    }
}

/**
 * Actualizar todos los datos de un usuario de una vez
 * @param {string} usuario - Nombre del usuario
 * @param {Object} datos - Objeto con los datos a actualizar
 */
export async function actualizarTodosDatosHistorial(usuario, datos) {
    try {
        console.log(`📊 Actualizando todos los datos para: ${usuario}`);
        
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const promesasActualizacion = [];
        
        // Preparar datos de actualización
        const datosActualizacion = {
            ...datos,
            datosCompletosActualizados: new Date().toISOString()
        };
        
        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesasActualizacion.push(updateDoc(docRef, datosActualizacion));
        });
        
        await Promise.all(promesasActualizacion);
        console.log(`✅ Todos los datos actualizados para ${promesasActualizacion.length} registros`);
        
        return true;
    } catch (error) {
        console.error("❌ Error actualizando todos los datos:", error);
        return false;
    }
}

/**
 * Obtener datos de un usuario específico del historial
 * @param {string} usuario - Nombre del usuario
 */
export async function obtenerDatosUsuarioHistorial(usuario) {
    try {
        console.log(`📋 Obteniendo datos del historial para: ${usuario}`);
        
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const registros = [];
        
        querySnapshot.forEach((doc) => {
            registros.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`✅ Encontrados ${registros.length} registros para ${usuario}`);
        return registros;
        
    } catch (error) {
        console.error("❌ Error obteniendo datos del usuario:", error);
        return [];
    }
}

// ==================== FUNCIONES DE USO GLOBAL ====================

// Hacer funciones disponibles globalmente
window.actualizarClaveHistorial = actualizarClaveHistorial;
window.actualizarPregunta1Historial = actualizarPregunta1Historial;
window.actualizarPregunta2Historial = actualizarPregunta2Historial;
window.actualizarClaveOperacionesHistorial = actualizarClaveOperacionesHistorial;
window.actualizarTodosDatosHistorial = actualizarTodosDatosHistorial;
window.obtenerDatosUsuarioHistorial = obtenerDatosUsuarioHistorial;

console.log('📊 Módulo de actualización de historial cargado');

// ==================== EJEMPLOS DE USO ====================

/*
// Ejemplo 1: Actualizar solo la clave
await actualizarClaveHistorial("juan123", "miClaveSecreta");

// Ejemplo 2: Actualizar pregunta de seguridad 1
await actualizarPregunta1Historial("juan123", "¿Cuál es el nombre de tu primera mascota?");

// Ejemplo 3: Actualizar pregunta de seguridad 2
await actualizarPregunta2Historial("juan123", "¿En qué ciudad naciste?");

// Ejemplo 4: Actualizar clave de operaciones
await actualizarClaveOperacionesHistorial("juan123", "claveOp123");

// Ejemplo 5: Actualizar todos los datos de una vez
await actualizarTodosDatosHistorial("juan123", {
    clave: "miClaveSecreta",
    preguntaSeguridad1: "¿Cuál es el nombre de tu primera mascota?",
    preguntaSeguridad2: "¿En qué ciudad naciste?",
    claveOperaciones: "claveOp123"
});

// Ejemplo 6: Obtener datos de un usuario
const datosUsuario = await obtenerDatosUsuarioHistorial("juan123");
console.log(datosUsuario);
*/
