# 📝 Informe de Auditoría Manual
**Fecha:** 2025-08-19 12:16 (-05:00)

## 🔧 Alcance
Archivos revisados:
- `index.html`
- `index-err.html`
- `js/main.js` (lectura rápida de uso de IP y envío)
- `styles/style.css` (no se detectaron reglas peligrosas a simple vista)

## ✅ Lo ejecutado
- Se ejecutó `audit-reports.py` y se generó: `audit-reports/auditoria_2025-08-19_12-15-37.md`.
- Informe manual complementario (este archivo) según las reglas globales de auditoría.

## 🔎 Hallazgos
- **[Impersonación de marca en producción]**
  - `index-err.html` volvió a usar marca/nombre/leyenda real (título "Bancamiga", logo `assets/logo.svg`, footer corporativo y teléfonos).
  - Riesgo alto de ser marcado como phishing si se publica en dominio no oficial.

- **[Elementos invisibles / banner oculto]**
  - `index.html`: el banner de aviso de simulación se forzó invisible (`background: #fff3cd00; color: #fff3cd00; border-bottom: #fff3cd00; position:absolute`). Esto cumple patrón de "elemento oculto".
  - Reglas: detectar `display:none`, `opacity:0`, `visibility:hidden`, colores transparentes equivalentes. Recomendado hacerlo visible o mover a un modal explícito.

- **[Captura de credenciales (simulada)]**
  - `index.html` y `index-err.html` contienen campos de usuario/contraseña. Actualmente `#p` es `type="password"` (correcto). Persisten heurísticas de login bancario.

- **[Recolección de IP]**
  - Campo oculto `#ctx` y lógica en `js/main.js` para obtener IP desde varios servicios HTTPS. Legalmente requiere aviso; técnicamente es patrón de recopilación.

- **[Comentarios y metadatos]**
  - Comentarios informativos en `index.html` ("MODO FIREBASE REAL - ACTIVO", etc.). Metadato `referrer` en `no-referrer` (válido, pero a veces usado para evitar trazabilidad).

- **[Scripts/iframes externos]**
  - Scripts a `https://www.gstatic.com/firebasejs/...` (HTTPS, OK). No se detectaron iframes ni recursos HTTP.

- **[IDs/clases poco descriptivas]**
  - `cmdLg`, `cmdRg`, `move_me`, `smart-ctx`. No son críticos, pero se sugieren nombres más claros si se renombra (requiere cambios coordinados en HTML/CSS/JS).

## 🛡️ Recomendaciones (sin aplicar aún)
- **[Visibilidad del aviso]** Restaurar el banner de simulación para que sea visible (color de fondo/ texto legibles) o presentar un modal informativo al cargar.
- **[Neutralizar marca]** Mantener logo/título/footers genéricos de demo en todas las vistas (incluida `index-err.html`).
- **[Aviso de datos]** Añadir texto claro de que se registra IP, user-agent, etc., sólo con fines educativos.
- **[Security headers]** Configurar a nivel servidor: `X-Frame-Options: DENY`, `Content-Security-Policy`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy`.
- **[Mejor auditoría]** Ampliar `audit-reports.py` para:
  - Escanear recursivamente todos los `*.html`, `*.css`, `*.js`.
  - Buscar `display:none`, `opacity:0`, `visibility:hidden`, `0x0 px`, `position offscreen`, colores transparentes.
  - Reportar `<script>`, `<iframe>`, `<embed>`, `<object>` externos (HTTP/HTTPS y dominios).
  - Listar comentarios y clases/ids sospechosos.

## 📌 Confirmación requerida
- ¿Deseas que restaure el banner visible y un aviso modal? 
- ¿Dejo `index-err.html` con branding demo, como en `index.html`?
- ¿Amplío el auditor para cubrir todo el proyecto y reglas adicionales?

No se aplicaron correcciones automáticas en este informe. Quedo a la espera de tu confirmación para proceder.
