# OmniRec-Movies — Documentación Maestra del Proyecto

**Sistema Inteligente de Recomendación de Películas (MovieLens 25M)**
*Un pipeline completo de Ciencia de Datos siguiendo el estándar internacional CRISP-DM.*

---

## 1. Visión General del Proyecto
**OmniRec-Movies** es una plataforma interactiva que resuelve el problema del descubrimiento de contenido en grandes catálogos cinematográficos. Utilizando el dataset **MovieLens 25M**, el sistema transforma 25 millones de interacciones reales en modelos matemáticos capaces de predecir gustos y agrupar audiencias de forma no supervisada.

### Objetivos Principales:
*   **Precisión:** Reducir el error de predicción (RMSE) mediante técnicas de factorización matricial.
*   **Interpretabilidad:** Segmentar a los usuarios en comunidades de gustos con nombres y perfiles humanos.
*   **Despliegue Real:** Pasar de notebooks estáticos a una aplicación SPA (Single Page Application) reactiva.

---

## 2. Metodología CRISP-DM Aplicada

### Fase 1 & 2: Entendimiento de Negocio y Datos
*   **Dataset:** 25,000,095 ratings de 162,541 usuarios sobre 62,423 películas.
*   **Hallazgo clave:** Alta dispersión (Sparsity > 99%) y sesgo positivo (media de votos 3.53).
*   **Documentación:** `01_Business_Understanding_and_EDA.ipynb`.

### Fase 3: Preparación de Datos
*   **Muestreo Estratificado:** Reducción al 5% manteniendo la representatividad estadística.
*   **Filtrado de Calidad:** Solo películas con ≥ 20 votos para evitar ruido (long tail).
*   **Ingeniería de Características:** Extracción de años de títulos y normalización de géneros.
*   **Documentación:** `02_Data_Sampling_and_Cleaning.ipynb`.

### Fase 4 & 5: Modelado y Evaluación
Comparamos 5 enfoques distintos para encontrar el equilibrio entre precisión y costo:
1.  **Baseline Bayesiano:** Popularidad ponderada (Fórmula IMDb). RMSE: 0.95.
2.  **KNN-Baseline:** Filtrado colaborativo basado en ítems. RMSE: 0.81.
3.  **SVD (Singular Value Decomposition):** Descomposición de factores latentes. RMSE: 0.80. **(Modelo Ganador)**.
4.  **NMF:** Factorización no negativa para interpretación de "temas".
5.  **AutoML:** Búsqueda automática de hiperparámetros (GridSearchCV).
*   **Documentación:** `03_ML_Baseline_AutoML.ipynb` y `reports/ANALISIS_NOTEBOOK_03.md`.

---

## 3. Arquitectura Técnica de la Aplicación

### Backend (Django 5.x)
*   **Motor de Inferencia Híbrido:** Para usuarios reales, el sistema realiza un re-rankeo en tiempo real. Toma candidatos populares y los pasa por el modelo SVD entrenado para personalizarlos.
*   **Inferencia de Clustering:** Implementa una técnica de *folding-in*. Estima el vector latente de un usuario nuevo promediando los vectores de las películas que ha puntuado, asignándolo al clúster más cercano mediante distancia euclidiana.
*   **Persistencia:** SQL para interacciones de usuario (ratings reales) y Parquet/Pickle para modelos entrenados.

### Frontend (React 18 + MUI 6 + Inertia.js)
*   **SPA (Single Page Application):** Navegación sin recargas de página.
*   **UI/UX:** Diseño moderno en español neutro, adaptado a dispositivos móviles.
*   **Laboratorio de Modelos:** Permite comparar cómo cada algoritmo ve la misma película.

---

## 4. Funcionalidades de Producción Implementadas

1.  **Gestión de Usuarios:** Registro e inicio de sesión seguro con protección CSRF para SPAs.
2.  **Sistema de Ratings:** Calificación interactiva de 5 estrellas en cualquier parte del catálogo.
3.  **Perfil de Identidad IA:** Clasificación automática del usuario en una de las 6 comunidades (ej: "Críticos Exigentes", "Buscadores de Adrenalina").
4.  **Descubrimiento Personalizado:** Ranking Top-N generado dinámicamente según el historial de votos.
5.  **Explorador de Comunidades:** Modal informativo que explica la lógica de segmentación de la IA.

---

## 5. Cómo ejecutar el proyecto

1.  **Entorno:** Activar `venv/`.
2.  **Base de Datos:** `python manage.py migrate`.
3.  **Sincronización:** `python manage.py import_movies` (Carga el catálogo real del dataset).
4.  **Frontend:** `cd app/frontend && npm install && npm run build`.
5.  **Servidor:** `python manage.py runserver`.
