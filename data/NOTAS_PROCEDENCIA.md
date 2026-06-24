# Dataset MovieLens 25M — Notas de Procedencia

## Trazabilidad del Dataset (requerimiento del checklist académico)

| Campo | Valor |
|-------|-------|
| **URL oficial de descarga** | https://grouplens.org/datasets/movielens/25m/ |
| **Variante exacta** | `ml-25m.zip` — versión estable publicada en noviembre 2019 |
| **Fecha de acceso al dataset** | Noviembre 2019 (descarga original por GroupLens Research) |
| **Fecha de incorporación al proyecto** | Febrero 2026 |
| **Criterio de muestreo** | Estratificado por tier de actividad de usuario (Casual/Regular/PowerUser); muestra principal al 60%, benchmark KNN al 10%, Deep Learning al 5% — ver notebook 02 |
| **Fuente primaria** | GroupLens Research Laboratory, Universidad de Minnesota |
| **Referencia bibliográfica** | Harper & Konstan (2015), ACM TIIS 5(4), doi:10.1145/2827872 |

## Enlace original
- https://grouplens.org/datasets/movielens/25m/

## 📁 Archivos incluidos en el dataset original
El dataset original contiene seis archivos principales junto con su README:

- `genome-tags.csv`
- `links.csv`
- `movies.csv`
- `tags.csv`
- `genome-scores.csv`
- `ratings.csv`

## 📦 Archivos subidos al repositorio
Debido a limitaciones de tamaño, solo se incluyeron los archivos más ligeros:

- `movies.csv`
- `links.csv`
- `genome-tags.csv`

## ⚠️ Archivos omitidos
Los siguientes archivos no se subieron al repositorio porque superan el límite de 100MB permitido por GitHub:

- `tags.csv`
- `genome-scores.csv`
- `ratings.csv`

## 📝 Nota
GitHub no permite subir archivos mayores a 100MB, por lo que fue necesario excluir los archivos más pesados del dataset.
