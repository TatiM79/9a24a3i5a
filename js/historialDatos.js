// historialDatos.js - Gestión de datos persistentes
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js';
import { getFirestore, collection, getDocs, deleteDoc, doc, query, orderBy, limit, where } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// Usar la misma configuración que el resto de la aplicación
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Clase para gestionar el historial de datos
class HistorialDatos {
    constructor() {
        this.datos = [];
        this.filtros = {
            fechaInicio: null,
            fechaFin: null,
            usuario: '',
            cardColor: ''
        };
    }

    // Obtener todos los datos del historial
    async obtenerDatos(limite = 1000) {
        try {
            console.log('📊 Obteniendo datos del historial...');
            
            const q = query(
                collection(db, "datosHistorial"),
                
                limit(limite)
            );
            
            const querySnapshot = await getDocs(q);
            this.datos = [];
            
            querySnapshot.forEach((doc) => {
                this.datos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            console.log(`✅ ${this.datos.length} registros obtenidos`);
            return this.datos;
            
        } catch (error) {
            console.error('❌ Error obteniendo datos:', error);
            throw error;
        }
    }

    // Filtrar datos por criterios
    filtrarDatos(criterios = {}) {
        let datosFiltrados = [...this.datos];
        
        
        
        // Filtro por usuario
        if (criterios.usuario) {
            datosFiltrados = datosFiltrados.filter(item => 
                item.usuario.toLowerCase().includes(criterios.usuario.toLowerCase())
            );
        }
        
        // Filtro por color de card
        if (criterios.cardColor) {
            datosFiltrados = datosFiltrados.filter(item => 
                item.cardColor === criterios.cardColor
            );
        }
        
        return datosFiltrados;
    }

    // Exportar datos a CSV
    exportarCSV(datos = null) {
        const datosExportar = datos || this.datos;
        
        if (datosExportar.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        
        // Encabezados CSV
        const headers = [
            'Usuario',
            'Dirección IP',
            'Color Card',
            'Número Card',
            'Fecha',
            'Hora',
            'Timestamp',
            'Tipo'
        ];
        
        // Convertir datos a CSV
        const csvContent = [
            headers.join(','),
            ...datosExportar.map(item => [
                `"${item.usuario || ''}"`,
                `"${item.direccionIP || ''}"`,
                `"${item.cardColor || ''}"`,
                `"${item.cardNumber || ''}"`,
                `"${item.tipo || ''}"`
            ].join(','))
        ].join('\n');
        
        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `historial_datos_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`✅ Exportados ${datosExportar.length} registros a CSV`);
    }

    // Exportar datos a JSON
    exportarJSON(datos = null) {
        const datosExportar = datos || this.datos;
        
        if (datosExportar.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        
        const jsonContent = JSON.stringify(datosExportar, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `historial_datos_${new Date().toISOString().split('T')[0]}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`✅ Exportados ${datosExportar.length} registros a JSON`);
    }

    // Obtener estadísticas
    obtenerEstadisticas(datos = null) {
        const datosAnalizar = datos || this.datos;
        
        if (datosAnalizar.length === 0) {
            return {
                total: 0,
                porColor: {},
                porFecha: {},
                ultimoAcceso: null
            };
        }
        
        const stats = {
            total: datosAnalizar.length,
            porColor: {},
        };
        
        // Estadísticas por color
        datosAnalizar.forEach(item => {
            const color = item.cardColor || 'Sin color';
            stats.porColor[color] = (stats.porColor[color] || 0) + 1;
        });
        
        return stats;
    }

    // Limpiar datos antiguos (opcional)
    async limpiarDatosAntiguos(diasAntiguedad = 90) {
        try {
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
            
            const q = query(
                collection(db, "datosHistorial"),
            );
            
            const querySnapshot = await getDocs(q);
            const promesasEliminacion = [];
            
            querySnapshot.forEach((documento) => {
                promesasEliminacion.push(deleteDoc(doc(db, "datosHistorial", documento.id)));
            });
            
            await Promise.all(promesasEliminacion);
            
            console.log(`✅ Eliminados ${promesasEliminacion.length} registros antiguos`);
            return promesasEliminacion.length;
            
        } catch (error) {
            console.error('❌ Error limpiando datos antiguos:', error);
            throw error;
        }
    }
}

// Exportar la clase para uso global
window.HistorialDatos = HistorialDatos;

// Crear instancia global
window.historialDatos = new HistorialDatos();

console.log('📊 Módulo de historial de datos cargado');
