# OmniRec-Movies — Estado del Proyecto

Sistema inteligente de recomendación de películas sobre **MovieLens 25M** (GroupLens, noviembre 2019). Sigue el ciclo **CRISP-DM** (seis fases canónicas: Business Understanding → Data Understanding → Data Preparation → Modeling → Evaluation → Deployment).

**Última actualización:** 2026-04-23 — iteración 8: **Limpieza y Consolidación Técnica** — se eliminaron archivos obsoletos (`db.sqlite3`, `app/requirements.txt`), se desinstalaron dependencias no utilizadas (`django-htmx`, `puppeteer`, etc.) y se consolidó el directorio `app/`. El stack final queda como: **Django 6 + MySQL (via PyMySQL) + Inertia.js + React 18 + MUI 6 + TypeScript**. Detalle: [`LIMPIEZA_PROYECTO_2026-04-23.md`](./LIMPIEZA_PROYECTO_2026-04-23.md).

---

## 1. Estructura del repositorio

```
OmniRec-Movies/
├── data/                    # Dataset original y parquets intermedios
├── notebooks/               # Pipeline CRISP-DM 01 al 05
├── models/                  # Artefactos *.pkl entrenados
├── reports/                 # Documentación técnica completa
├── app/                     # Aplicación de Producción ✅
│   ├── recommender/         # Backend: Servicios y Vistas
│   ├── core/                # Configuración: Django + MySQL
│   ├── frontend/            # Frontend: React + TSX + Vite
│   ├── static/ & templates/ # Activos y Layout base
│   └── .env                 # Configuración de entorno
├── requirements.txt         # Única fuente de verdad (Python)
└── README.md                # Guía general
```

---

## 2. Estado actual — matriz CRISP-DM (flujo lineal)

La lectura secuencial de los notebooks `01 → 02 → 03 → 04 → 05` se corresponde **1:1** con las fases canónicas de CRISP-DM. No hay saltos hacia atrás entre notebooks.

| Fase CRISP-DM | Notebook(s) | Sección(es) | Estado |
|---|---|---|---|
| 1. Business Understanding | `01_Business_Understanding_and_EDA.ipynb` | §1 | ✅ Completa |
| 2. Data Understanding (EDA) | `01_Business_Understanding_and_EDA.ipynb` | §2-16 | ✅ Completa |
| 3. Data Preparation | `02_Data_Sampling_and_Cleaning.ipynb` | §1-7 | ✅ Completa |
| 4. Modeling | `03_ML_Baseline_AutoML.ipynb` | §2-6 | ✅ Completa |
| 5. Evaluation | `03_ML_Baseline_AutoML.ipynb` | §7-10 | ✅ Completa |
| 6. Deployment | `app/` (Django) · `04`, `05` (DL + RAG) | — | 🟡 Parcial — app Django operativa, notebooks 04/05 pendientes |

---

## 3. Setup Técnico

### Backend (Django + MySQL)
- **Base de Datos:** MySQL 8+ gestionada vía `PyMySQL` con hook de compatibilidad en `manage.py`.
- **Concurrencia:** `Registry` singleton en `services.py` usa `RLock` para prevenir deadlocks en carga perezosa.
- **Inferencia:** Patrón *retriever* (bayesiano) + *re-ranker* (modelo latente) para latencia < 200ms.

### Frontend (React + TS + MUI)
- **Lenguaje:** TypeScript 5+ (TSX) con tipado estricto para modelos.
- **UI:** Material UI 6 con tema claro sólido (estética cinematográfica Multicine).
- **Comunicación:** Inertia.js 2 para navegación SPA sin refresco de página.

---

## 4. Ejecución

1. **Modelos:** Ejecutar notebook `03` para generar los `.pkl`.
2. **Base de Datos:** Crear la DB en MySQL y configurar `DATABASE_URL` en `app/.env`.
3. **Frontend:** `cd app/frontend && npm install && npm run build`.
4. **Django:** `cd app && python manage.py migrate && python manage.py runserver`.
