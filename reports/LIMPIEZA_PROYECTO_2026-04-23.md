# Limpieza de Proyecto y Consolidación Técnica

**Fecha y hora:** 2026-04-23 · 23:15 (America/La_Paz)
**Iteración CRISP-DM:** Fase 6 — Deployment (iteración 8)
**Alcance:** saneamiento del directorio `app/`, eliminación de archivos redundantes y desinstalación de dependencias obsoletas tras la migración a TypeScript, MySQL e Inertia.js.

---

## 1. Archivos Eliminados

Se realizó una limpieza profunda para eliminar "clutter" y archivos de configuraciones anteriores:

- **Bases de datos obsoletas:** Se eliminó `app/db.sqlite3` tras la migración exitosa a MySQL.
- **Configuraciones de paquetes duplicadas:** Se eliminó `app/package-lock.json` y `app/requirements.txt` (los archivos en la raíz y en `app/frontend/` son ahora las únicas fuentes de verdad).
- **Documentación redundante:** Se eliminó `app/README.md` ya que su contenido está consolidado en el `README.md` de la raíz.
- **Estructura redundante:** Se eliminó el directorio `app/apps/` y se movió el módulo `recommender` directamente a la raíz de `app/`, simplificando la jerarquía de módulos y los imports de Django.
- **Scripts de utilidad temporales:** Se borraron scripts usados durante las migraciones (`fix_grid.cjs`, `check_console.js`, `check_clicks.js`, `test_static.py`).
- **Basura de compilación:** Se eliminaron todas las carpetas `__pycache__`, archivos `.pyc` y archivos de estado de TypeScript (`.tsbuildinfo`).

---

## 2. Dependencias Desinstaladas

Se identificaron y removieron librerías que pertenecían al stack anterior (Django Templates + HTMX + Tailwind CLI) o que fueron usadas solo para pruebas puntuales:

### Python (pip)
- `django-htmx`: Reemplazado por la lógica de navegación de Inertia.js.
- `django-browser-reload`: Ya no es compatible con el flujo de desarrollo basado en Vite.
- `django-tailwind` y `pytailwindcss`: El manejo de estilos ahora es responsabilidad de MUI y el bundle de Vite.
- `pipenv` y `virtualenv`: Herramientas de sistema que no deben estar fijadas en el venv del proyecto.

### Node.js (npm)
- `@mui/x-data-grid`: Se importó inicialmente pero no se utiliza en ninguno de los componentes actuales.
- `puppeteer`: Herramienta de automatización de navegador usada solo para la verificación de la migración.

---

## 3. Estado Final del Directorio `app/`

El directorio `app/` ahora contiene exclusivamente el código fuente necesario para la ejecución:

```
app/
├── apps/recommender/    # Lógica de negocio y vistas Inertia
├── core/                # Configuración del proyecto Django (MySQL habilitado)
├── frontend/            # Proyecto TypeScript + React + MUI
│   ├── src/             # Componentes y Páginas TSX
│   └── dist/            # Assets compilados para producción
├── static/              # Archivos estáticos globales
├── templates/           # Punto de entrada HTML para Inertia
├── .env                 # Configuración local (MySQL)
├── manage.py            # Entrypoint con hook de PyMySQL
└── .env.example         # Documentación de variables
```

---

## 4. Verificación de Integridad

- **Backend:** Se verificó que `python manage.py runserver` inicia correctamente sin dependencias faltantes.
- **Frontend:** Se ejecutó `npm run build` para asegurar que el bundle de producción se genera sin errores.
- **Conectividad:** La comunicación con MySQL y la carga de modelos Parquet/Pickle se mantiene operativa.
