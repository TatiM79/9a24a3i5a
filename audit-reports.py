import os
import re
from datetime import datetime

# Directorios a auditar
INPUT_DIR = "./"
REPORT_DIR = "./audit-reports"

# Archivos a analizar (puedes expandirlos dinámicamente si quieres todos)
FILES_TO_ANALYZE = ["index.html", "styles.css", "script.js"]

# Crear carpeta de reportes si no existe
os.makedirs(REPORT_DIR, exist_ok=True)

def analizar_html(content):
    hallazgos = []
    
    # Comentarios
    comentarios = re.findall(r"<!--(.*?)-->", content, re.DOTALL)
    for c in comentarios:
        hallazgos.append(f"- Comentario encontrado: `{c.strip()}` ⚠️ Posible revisión necesaria")

    # Elementos invisibles
    invisibles = re.findall(r"(display\s*:\s*none|opacity\s*:\s*0|visibility\s*:\s*hidden)", content)
    if invisibles:
        hallazgos.append(f"- Elementos invisibles detectados ({len(invisibles)}). Revisar.")

    # Iframes sospechosos
    if "iframe" in content:
        if re.search(r"<iframe.*http://", content):
            hallazgos.append("- ⚠️ Iframe cargando recurso inseguro vía HTTP.")

    # Scripts externos inseguros
    if re.search(r"<script.*http://", content):
        hallazgos.append("- ⚠️ Script externo inseguro vía HTTP.")

    return hallazgos


def analizar_css(content):
    hallazgos = []
    if "ads_hidden" in content:
        hallazgos.append("- Clase sospechosa detectada en CSS: `.ads_hidden`")
    return hallazgos


def analizar_js(content):
    hallazgos = []
    if "eval(" in content:
        hallazgos.append("- Uso de `eval()` detectado ⚠️ Puede ser inseguro.")
    return hallazgos


def generar_reporte():
    fecha = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    reporte_path = os.path.join(REPORT_DIR, f"auditoria_{fecha}.md")
    
    with open(reporte_path, "w", encoding="utf-8") as f:
        f.write(f"# 📝 Informe de Auditoría\n")
        f.write(f"**Fecha:** {fecha}\n\n")
        
        for archivo in FILES_TO_ANALYZE:
            if not os.path.exists(archivo):
                continue
            with open(archivo, "r", encoding="utf-8", errors="ignore") as code_file:
                content = code_file.read()
            
            f.write(f"## 🔍 Resultados para {archivo}\n")
            
            if archivo.endswith(".html"):
                hallazgos = analizar_html(content)
            elif archivo.endswith(".css"):
                hallazgos = analizar_css(content)
            elif archivo.endswith(".js"):
                hallazgos = analizar_js(content)
            else:
                hallazgos = []
            
            if hallazgos:
                f.write("\n".join(hallazgos) + "\n\n")
            else:
                f.write("✅ Sin hallazgos relevantes.\n\n")

    print(f"✅ Reporte generado en: {reporte_path}")


if __name__ == "__main__":
    generar_reporte()
