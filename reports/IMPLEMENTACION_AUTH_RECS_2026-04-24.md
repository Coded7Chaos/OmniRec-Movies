# Implementación de Autenticación y Recomendaciones en Tiempo Real

**Fecha:** 2026-04-24
**Autor:** Gemini CLI
**Estado:** Finalizado

## 1. Resumen de Cambios
Se ha transformado la aplicación de un visor estático de "personas" del dataset a una plataforma interactiva donde usuarios reales pueden registrarse, iniciar sesión, puntuar películas y recibir recomendaciones personalizadas basadas en sus propios gustos.

## 2. Cambios en el Backend (Django)

### 2.1 Modelos de Datos (`models.py`)
- Se implementó el modelo `Movie` para persistir el catálogo oficial filtrado de MovieLens 25M (5,915 películas con ≥ 20 votos).
- Se implementó el modelo `MovieRating` para almacenar las interacciones de los usuarios reales.
- Integración con `django.contrib.auth` para la gestión de cuentas.

### 2.2 Motor de Inferencia y Servicios (`services.py`)
- **Sincronización:** Nuevo comando `import_movies` que vincula los datos del Parquet con la base de datos SQL.
- **Lógica de Recomendación Híbrida:**
    - **Usuarios Nuevos (Cold Start):** Se utiliza el *Baseline de Popularidad Bayesiana* (IMDb weighted rating).
    - **Usuarios con Actividad:** Se utiliza una técnica de **Re-ranking**. Se toman los candidatos más populares y se pasan por el modelo seleccionado (SVD, KNN, NMF o AutoML) para calcular la afinidad personalizada.
    - Se corrigió la interpretación de datos: la app ya no usa datos "inventados", sino que consume directamente los artefactos `.pkl` entrenados en los notebooks.

### 2.3 Vistas y Controladores (`views.py`)
- Creación de endpoints para `login`, `register`, `logout` y `rate`.
- Adaptación de la vista `discover` para centrarse en el usuario autenticado.

## 3. Cambios en el Frontend (React + MUI)

### 3.1 Nuevas Páginas
- `Login.tsx`: Interfaz de acceso.
- `Register.tsx`: Interfaz de creación de cuenta.

### 3.2 Componentes Mejorados
- `MovieCard.tsx`: Ahora incluye un selector de estrellas interactivo (`Rating`) que permite puntuar películas desde cualquier parte del catálogo.
- `Layout.tsx`: Se añadió el estado de autenticación (Avatar del usuario, nombre y botón de salida).
- `Discover.tsx`: Rediseñada para mostrar el Top Personalizado del usuario logueado.

## 4. Coherencia Metodológica
- Se eliminaron las inconsistencias de IDs. La app ahora garantiza que los `movieId` evaluados coinciden con los del pipeline de datos.
- El uso de los modelos (SVD, KNN, NMF) ahora es técnicamente correcto, utilizando la media global y los sesgos entrenados para predecir sobre usuarios externos al dataset original.
