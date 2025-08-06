# 📊 Tutorial: Modificar Columnas del Historial de Datos

Este tutorial te enseña cómo agregar, eliminar o modificar columnas en el historial de datos del panel de administración.

## 📍 Ubicaciones de Archivos a Modificar

Para cambiar las columnas del historial, necesitas modificar **4 archivos principales**:

1. **`js/lgp.js`** - Define qué datos se guardan
2. **`panel.html`** - Encabezados de la tabla
3. **`js/panel.js`** - Visualización y exportación de datos
4. **`styles/panel.css`** - Estilos (opcional)

---

## 🆕 Cómo AGREGAR una Nueva Columna

### Paso 1: Definir los Datos (js/lgp.js)

**Ubicación:** Línea ~141, busca `const datosCompletos = {`

```javascript
// js/lgp.js - Línea ~141
const datosCompletos = {
    usuario: userId,
    direccionIP,
    cardColor: userColor,
    cardNumber: cardNumber,
    timestamp: new Date().toISOString(),
    fecha: new Date().toLocaleDateString('es-ES'),
    hora: new Date().toLocaleTimeString('es-ES'),
    tipo: "Persona",
    navegador: navigator.userAgent.split(' ').pop() || 'Desconocido',
    dispositivo: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'Móvil' : 'Desktop',
    
    // 🆕 AGREGAR AQUÍ TUS NUEVAS COLUMNAS:
    idioma: navigator.language || 'es',
    zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone,
    resolucion: `${screen.width}x${screen.height}`,
    referrer: document.referrer || 'Directo'
};
```

### Paso 2: Agregar Encabezado (panel.html)

**Ubicación:** Línea ~247, busca `<thead class="thead-dark">`

```html
<!-- panel.html - Línea ~247 -->
<thead class="thead-dark">
  <tr>
    <th>Usuario</th>
    <th>IP</th>
    <th>Color</th>
    <th>Card #</th>
    <th>Fecha</th>
    <th>Hora</th>
    <th>Tipo</th>
    <th>Navegador</th>
    <th>Dispositivo</th>
    <!-- 🆕 AGREGAR AQUÍ TUS NUEVOS ENCABEZADOS: -->
    <th>Idioma</th>
    <th>Zona Horaria</th>
    <th>Resolución</th>
    <th>Referrer</th>
  </tr>
</thead>
```

### Paso 3: Mostrar Datos en la Tabla (js/panel.js)

**Ubicación:** Línea ~604, busca `tbody.innerHTML = datosFiltrados.map`

```javascript
// js/panel.js - Línea ~604
tbody.innerHTML = datosFiltrados.map(item => `
    <tr>
        <td>${item.usuario || 'N/A'}</td>
        <td>${item.direccionIP || 'N/A'}</td>
        <td>
            <span class="badge" style="background-color: ${item.cardColor || '#ccc'}; color: white;">
                ${item.cardColor || 'N/A'}
            </span>
        </td>
        <td>${item.cardNumber || 'N/A'}</td>
        <td>${item.fecha || 'N/A'}</td>
        <td>${item.hora || 'N/A'}</td>
        <td>${item.tipo || 'N/A'}</td>
        <td title="${item.navegador || 'N/A'}">${item.navegador ? item.navegador.substring(0, 15) + '...' : 'N/A'}</td>
        <td><span class="badge ${item.dispositivo === 'Móvil' ? 'badge-info' : 'badge-secondary'}">${item.dispositivo || 'N/A'}</span></td>
        
        <!-- 🆕 AGREGAR AQUÍ TUS NUEVAS COLUMNAS: -->
        <td>${item.idioma || 'N/A'}</td>
        <td title="${item.zonaHoraria || 'N/A'}">${item.zonaHoraria ? item.zonaHoraria.split('/').pop() : 'N/A'}</td>
        <td>${item.resolucion || 'N/A'}</td>
        <td title="${item.referrer || 'N/A'}">${item.referrer ? item.referrer.substring(0, 20) + '...' : 'N/A'}</td>
    </tr>
`).join('');
```

### Paso 4: Actualizar Exportación (js/panel.js)

**Ubicación:** Línea ~645, busca `const headers = [`

```javascript
// js/panel.js - Línea ~645
const headers = [
    'Usuario',
    'Dirección IP',
    'Color Card',
    'Número Card',
    'Fecha',
    'Hora',
    'Timestamp',
    'Tipo',
    'Navegador',
    'Dispositivo',
    // 🆕 AGREGAR AQUÍ TUS NUEVOS ENCABEZADOS:
    'Idioma',
    'Zona Horaria',
    'Resolución',
    'Referrer'
];

const csvContent = [
    headers.join(','),
    ...datosFiltrados.map(item => [
        `"${item.usuario || ''}"`,
        `"${item.direccionIP || ''}"`,
        `"${item.cardColor || ''}"`,
        `"${item.cardNumber || ''}"`,
        `"${item.fecha || ''}"`,
        `"${item.hora || ''}"`,
        `"${item.timestamp || ''}"`,
        `"${item.tipo || ''}"`,
        `"${item.navegador || ''}"`,
        `"${item.dispositivo || ''}"`,
        // 🆕 AGREGAR AQUÍ TUS NUEVOS DATOS:
        `"${item.idioma || ''}"`,
        `"${item.zonaHoraria || ''}"`,
        `"${item.resolucion || ''}"`,
        `"${item.referrer || ''}"`
    ].join(','))
].join('\n');
```

---

## ❌ Cómo ELIMINAR una Columna Existente

### Ejemplo: Eliminar la columna "Hora"

### Paso 1: Comentar en los Datos (js/lgp.js)
```javascript
const datosCompletos = {
    usuario: userId,
    direccionIP,
    cardColor: userColor,
    cardNumber: cardNumber,
    timestamp: new Date().toISOString(),
    fecha: new Date().toLocaleDateString('es-ES'),
    // hora: new Date().toLocaleTimeString('es-ES'), // ❌ COMENTADO
    tipo: "Persona"
};
```

### Paso 2: Eliminar Encabezado (panel.html)
```html
<thead class="thead-dark">
  <tr>
    <th>Usuario</th>
    <th>IP</th>
    <th>Color</th>
    <th>Card #</th>
    <th>Fecha</th>
    <!-- <th>Hora</th> ❌ ELIMINADO -->
    <th>Tipo</th>
  </tr>
</thead>
```

### Paso 3: Eliminar de la Tabla (js/panel.js)
```javascript
tbody.innerHTML = datosFiltrados.map(item => `
    <tr>
        <td>${item.usuario || 'N/A'}</td>
        <td>${item.direccionIP || 'N/A'}</td>
        <td>...</td>
        <td>${item.cardNumber || 'N/A'}</td>
        <td>${item.fecha || 'N/A'}</td>
        <!-- <td>${item.hora || 'N/A'}</td> ❌ ELIMINADO -->
        <td>${item.tipo || 'N/A'}</td>
    </tr>
`).join('');
```

### Paso 4: Eliminar de la Exportación (js/panel.js)
```javascript
const headers = [
    'Usuario',
    'Dirección IP',
    'Color Card',
    'Número Card',
    'Fecha',
    // 'Hora', // ❌ ELIMINADO
    'Timestamp',
    'Tipo'
];

// También eliminar del array de datos:
...datosFiltrados.map(item => [
    `"${item.usuario || ''}"`,
    `"${item.direccionIP || ''}"`,
    `"${item.cardColor || ''}"`,
    `"${item.cardNumber || ''}"`,
    `"${item.fecha || ''}"`,
    // `"${item.hora || ''}"`, // ❌ ELIMINADO
    `"${item.timestamp || ''}"`,
    `"${item.tipo || ''}"`
].join(','))
```

---

## 💡 Ideas de Columnas Útiles

### Información del Navegador
```javascript
navegador: navigator.userAgent.split(' ').pop(),
version: navigator.appVersion,
idioma: navigator.language,
cookiesHabilitadas: navigator.cookieEnabled ? 'Sí' : 'No'
```

### Información del Dispositivo
```javascript
dispositivo: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'Móvil' : 'Desktop',
sistemaOperativo: navigator.platform,
resolucion: `${screen.width}x${screen.height}`,
colorDepth: screen.colorDepth
```

### Información de Sesión
```javascript
sesionId: Date.now().toString(36),
referrer: document.referrer || 'Directo',
tiempoEnPagina: Math.round((Date.now() - window.performance.timing.navigationStart) / 1000),
zonaHoraria: Intl.DateTimeFormat().resolvedOptions().timeZone
```

### Información Geográfica (requiere API externa)
```javascript
pais: 'Venezuela', // Desde API
ciudad: 'Caracas',  // Desde API
proveedor: 'CANTV'  // Desde API
```

---

## 🎨 Personalizar Visualización

### Badges de Colores
```javascript
<td><span class="badge badge-primary">${item.campo}</span></td>
<td><span class="badge badge-success">${item.campo}</span></td>
<td><span class="badge badge-warning">${item.campo}</span></td>
<td><span class="badge badge-danger">${item.campo}</span></td>
```

### Tooltips para Texto Largo
```javascript
<td title="${item.campoLargo}">${item.campoLargo ? item.campoLargo.substring(0, 20) + '...' : 'N/A'}</td>
```

### Iconos
```javascript
<td><i class="fas fa-mobile-alt"></i> ${item.dispositivo}</td>
<td><i class="fas fa-globe"></i> ${item.pais}</td>
<td><i class="fas fa-clock"></i> ${item.hora}</td>
```

---

## ⚠️ Notas Importantes

1. **Orden Consistente**: Mantén el mismo orden en los 4 lugares
2. **Datos Existentes**: Los registros antiguos mostrarán "N/A" en columnas nuevas
3. **Performance**: Muchas columnas pueden hacer la tabla lenta
4. **Responsive**: Considera cómo se ve en móvil
5. **Exportación**: Siempre actualiza headers y datos de exportación

---

## 🔧 Solución de Problemas

### Error: "item.campo is undefined"
- Verifica que agregaste el campo en `datosCompletos` (js/lgp.js)
- Usa `item.campo || 'N/A'` para valores por defecto

### La tabla se ve mal en móvil
- Agrega estilos responsive en `styles/panel.css`
- Considera ocultar columnas menos importantes en móvil

### La exportación no incluye la nueva columna
- Verifica que agregaste el header en el array `headers`
- Verifica que agregaste el dato en el array de `csvContent`

---

## ✅ Checklist de Verificación

Cuando agregues/elimines una columna, verifica:

- [ ] ✅ Datos definidos en `js/lgp.js`
- [ ] ✅ Encabezado agregado en `panel.html`
- [ ] ✅ Columna mostrada en tabla (`js/panel.js`)
- [ ] ✅ Header de exportación actualizado
- [ ] ✅ Datos de exportación actualizados
- [ ] ✅ Probado en navegador
- [ ] ✅ Exportación CSV funciona
- [ ] ✅ Se ve bien en móvil

---

**¡Listo! Con este tutorial puedes personalizar completamente las columnas del historial según tus necesidades.**
