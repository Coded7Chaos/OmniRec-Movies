// ─────────────────────────────────────────────────────────────────────────────
//  INFORME FINAL — OmniRec-Movies · Vincit Data · UCB San Pablo
// ─────────────────────────────────────────────────────────────────────────────

// ── Carátula ─────────────────────────────────────────────────────────────────
#set page(
  paper: "a4",
  margin: (top: 2.5cm, bottom: 2.5cm, left: 3cm, right: 3cm),
)

#set text(font: "Times New Roman", size: 12pt, lang: "es")
#set align(center)

#v(1.5cm)

#text(weight: "bold", size: 14pt)[UNIVERSIDAD CATÓLICA BOLIVIANA] \
#text(weight: "bold", size: 14pt)["SAN PABLO"] \
#text(size: 12pt)[Carrera de Ingeniería de Sistemas]

#v(0.8cm)

#image("imagenes/logo_ucb.png", width: 5.5cm)

#v(0.8cm)

#text(weight: "bold", size: 16pt)[
  Sistema Inteligente de \
  Recomendación de Películas
]
#v(0.3cm)
#text(size: 13pt, style: "italic")[MovieLens 25M — Metodología CRISP-DM]

#v(1.2cm)

#set align(left)

#text(weight: "bold")[Integrantes:]
#v(0.2cm)
#pad(left: 1cm)[
  - Lopez Castillo Kael Alessandro
  - Medina Paredes Esmeralda Paula
  - Parra Aguilar Franco Jhoel
  - Rodas Miranda Camila Nicole
  - Torrez Calle Álvaro Ariel
]

#v(0.3cm)
#text(weight: "bold")[Docente:] Ovidio Roger Paton Gutierrez

#v(0.2cm)
#text(weight: "bold")[Fecha:] La Paz, Bolivia · Junio 2026

#v(0.2cm)
#text(weight: "bold")[Materia:] Machine Learning

#v(0.2cm)
#text(weight: "bold")[Equipo:] Vincit Data — Grupo 3

#v(1fr)

#set align(center)
#image("imagenes/logo_sis.png", width: 2.8cm)

#pagebreak()

// ── Configuración del cuerpo del documento ───────────────────────────────────
#set page(
  paper: "a4",
  margin: (top: 2.5cm, bottom: 2.5cm, left: 2.5cm, right: 2.5cm),
  numbering: "1",
  number-align: center,
  header: context {
    if counter(page).get().first() > 1 {
      text(size: 8pt, fill: rgb("#666666"), style: "italic")[OmniRec-Movies · Vincit Data · UCB San Pablo]
      h(1fr)
      text(size: 8pt, fill: rgb("#666666"))[Machine Learning]
      v(-0.3cm)
      line(length: 100%, stroke: 0.3pt + rgb("#cccccc"))
    }
  }
)
#set text(font: "New Computer Modern", size: 11pt, lang: "es")
#set align(left)
#set heading(numbering: "1.")
#set par(justify: true, leading: 0.65em)
#show heading.where(level: 1): it => { v(1em); it; v(0.5em) }
#show heading.where(level: 2): it => { v(0.7em); it; v(0.3em) }
#show heading.where(level: 3): it => { v(0.5em); it; v(0.2em) }
#counter(page).update(1)

// ── Resumen Ejecutivo ────────────────────────────────────────────────────────
#align(center)[
  #text(size: 14pt, weight: "bold")[Resumen Ejecutivo]
  #v(0.2cm)
  #line(length: 60%, stroke: 0.6pt)
]
#v(0.35cm)

*OmniRec-Movies* es un sistema de recomendación de películas desarrollado por el equipo Vincit Data sobre el dataset *MovieLens 25M*, siguiendo la metodología *CRISP-DM*. El proyecto parte de un problema real: ayudar a los usuarios a descubrir películas relevantes en catálogos enormes, sin perderse entre miles de opciones.

Para lograrlo, se construyeron tres mecanismos complementarios de recomendación: modelos de filtrado colaborativo clásico (que aprenden de los patrones de calificaciones de miles de usuarios), una red neuronal profunda que captura relaciones más complejas entre usuarios y películas, y un motor de búsqueda semántica que entiende consultas escritas en lenguaje natural. El mejor modelo clásico, SVD, alcanza un error de predicción (RMSE) de *0.8652*; la red neuronal NeuMF obtiene *0.8183*; y el motor semántico logra una precisión del *88%* en sus recomendaciones por texto libre. Todo el sistema se despliega como una aplicación web funcional, accesible desde el navegador.

#pagebreak()

// ── Tabla de Contenidos ──────────────────────────────────────────────────────
#outline(title: "Tabla de Contenidos", indent: 1em)

#pagebreak()

// ─────────────────────────────────────────────────────────────────────────────
= Comprensión del Problema y los Datos
// ─────────────────────────────────────────────────────────────────────────────

== El Problema que Queremos Resolver

Las plataformas de streaming modernas ofrecen catálogos de decenas de miles de películas. Paradójicamente, cuanto más amplio es el catálogo, más difícil le resulta al usuario encontrar algo que realmente quiera ver. Si en los primeros minutos no aparece nada atractivo, simplemente abandona la sesión.

Los sistemas de recomendación tradicionales enfrentan tres obstáculos principales. Primero, la *dispersión de datos*: en un catálogo de 25 millones de calificaciones, la mayoría de las combinaciones posibles entre usuario y película no tienen ninguna valoración registrada, lo que limita la información disponible para hacer predicciones. Segundo, el *problema de las novedades*: una película recién estrenada no tiene calificaciones todavía, y un usuario nuevo tampoco tiene historial, por lo que es difícil recomendarles contenido personalizado. Tercero, el *sesgo de popularidad*: si el sistema no está bien diseñado, tiende a recomendar siempre las mismas películas masivas, ignorando el cine de nicho que podría ser perfecto para ciertos usuarios.

Para abordar estos tres problemas, diseñamos un sistema híbrido que combina diferentes enfoques según la situación de cada usuario.

== Los Datos con los que Trabajamos

El proyecto utiliza el dataset *MovieLens 25M*, una colección de más de 25 millones de calificaciones realizadas por usuarios reales entre 1993 y 2019. Incluye información sobre 62,423 películas y cubre una amplia variedad de géneros, épocas y estilos cinematográficos. Una de sus características más valiosas es el *Tag Genome*: un sistema que cuantifica cuánto se asocia cada película con cerca de 1,100 etiquetas descriptivas (como "suspenso psicológico", "ciencia ficción distópica" o "comedia romántica"), lo que permite construir descripciones ricas de cada título.

Dado que cargar los 25 millones de registros completos supera la capacidad de memoria de un entorno educativo, trabajamos con muestras representativas: el 60% del dataset para los modelos principales, el 10% para uno de los modelos más costosos computacionalmente, y el 5% para la red neuronal profunda. Estas muestras se construyeron cuidadosamente para mantener la misma distribución de usuarios y géneros que el conjunto completo.

== Qué Encontramos al Explorar los Datos

Antes de construir cualquier modelo, exploramos el dataset para entender su estructura. Los hallazgos más relevantes fueron:

- La calificación promedio es 3.5 sobre 5, y los usuarios tienden a dar números enteros más que decimales, lo que sugiere cierta tendencia a simplificar la valoración.
- El 20% de los usuarios más activos genera el 64% de todas las calificaciones, y el 20% de las películas más populares acumula el 74% de los votos. Esto confirma que el sistema debe trabajar bien tanto con usuarios muy activos como con usuarios ocasionales.
- El Tag Genome cubre muy bien el cine de las décadas de 1995 a 2010, pero tiene información escasa para películas muy antiguas o muy recientes.

#figure(
  grid(
    columns: (1fr, 1fr),
    gutter: 0.5cm,
    image("figures/Distribución de Ratings.png", width: 100%),
    image("figures/Curva de Pareto — concentración de actividad.png", width: 100%),
  ),
  caption: [Figura 1.1. Izquierda: distribución de calificaciones — los valores enteros dominan. Derecha: curva de Pareto — el 20% de usuarios más activos genera casi dos tercios de todas las interacciones.]
)

// ─────────────────────────────────────────────────────────────────────────────
= Preparación de Datos y Modelos Clásicos
// ─────────────────────────────────────────────────────────────────────────────

== Cómo Preparamos los Datos

Antes de entrenar cualquier modelo, fue necesario limpiar y organizar los datos. El paso más importante fue definir cómo evaluar si un modelo es bueno: utilizamos el protocolo *leave-last-one-out* temporal, que consiste en reservar la última calificación de cada usuario para la evaluación y usar el resto para entrenar. Esto garantiza que el modelo nunca "ve el futuro" durante el entrenamiento, lo que haría que los resultados fueran artificialmente buenos.

La métrica principal que usamos para comparar modelos es el *RMSE* (error cuadrático medio), que mide cuánto se equivoca el modelo al predecir la calificación que un usuario daría a una película. Cuanto más bajo, mejor.

== Modelos Clásicos de Recomendación

Entrenamos y comparamos cinco enfoques distintos. Todos parten de la misma idea base: aprender de los patrones colectivos de millones de calificaciones para predecir qué le gustará a cada usuario.

#figure(
  table(
    columns: (1.5fr, 0.6fr, 0.6fr, 0.6fr, 0.65fr),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#1a3a5c") } else if row == 5 { rgb("#e8f4fd") } else if calc.odd(row) { rgb("#f0f4f8") } else { white },
    text(fill: white, weight: "bold")[Modelo], text(fill: white, weight: "bold")[RMSE], text(fill: white, weight: "bold")[MAE], text(fill: white, weight: "bold")[P\@10], text(fill: white, weight: "bold")[Tiempo],
    [Baseline (popularidad ponderada)], [1.009], [0.792], [0.124], [< 1 s],
    [NMF (factorización no negativa)], [0.936], [0.713], [0.248], [47 s],
    [AutoML (selección automática)], [0.924], [0.704], [0.246], [976 s],
    [KNN (vecinos más cercanos)], [0.894], [0.669], [0.301], [125 s],
    text(weight: "bold")[SVD (factorización matricial)], text(weight: "bold")[0.865], text(weight: "bold")[0.656], [0.280], text(weight: "bold")[23 s],
  ),
  caption: [Tabla 2.1. Comparativa de modelos clásicos. El modelo SVD logra el mejor error de predicción entrenando en solo 23 segundos, superando incluso al sistema de selección automática que tardó más de 16 minutos.]
)

El ganador claro es *SVD* (Descomposición en Valores Singulares), un modelo que representa tanto a los usuarios como a las películas mediante vectores numéricos en un espacio de características latentes. En pocas palabras: aprende qué tipo de películas le gustan a cada usuario y qué tipo de usuario aprecia cada película, y con eso predice calificaciones con gran precisión. Además, es sorprendentemente rápido: tarda solo 23 segundos en entrenarse, frente a los casi 16 minutos del sistema de selección automática que, encima, obtiene peores resultados.

Un hallazgo interesante: el *sistema AutoML*, que debería encontrar automáticamente el mejor modelo, quedó en tercer lugar. Esto ocurrió porque fue entrenado con menos datos para ahorrar tiempo, lo que limitó su capacidad de aprendizaje. Es una lección importante: la automatización no siempre supera al diseño manual cuando los recursos son limitados.

== Segmentación de Usuarios

Usando los perfiles aprendidos por el modelo SVD, agrupamos a los usuarios en seis segmentos con comportamientos distintos. Esta segmentación permite personalizar aún más las recomendaciones: no es lo mismo un usuario que califica 200 películas al año que uno que solo registra 10.

#figure(
  table(
    columns: (auto, auto, auto),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#1a3a5c") } else if calc.odd(row) { rgb("#f0f4f8") } else { white },
    text(fill: white, weight: "bold")[Segmento], text(fill: white, weight: "bold")[Usuarios], text(fill: white, weight: "bold")[Perfil],
    [Críticos exigentes], [13,309], [Prefieren drama y thriller; puntúan más bajo que el promedio],
    [Entusiastas mainstream], [23,636], [El grupo más numeroso; gustan de drama, comedia y acción],
    [Cinéfilos de alto volumen], [13,423], [Gran cantidad de calificaciones; consumidores intensivos],
    [Usuarios balanceados], [13,368], [Perfil mixto; calificación media equilibrada],
    [Aficionados al action], [21,675], [Inclinación hacia acción y aventura],
    [Selectivos premium], [12,114], [Pocas calificaciones pero muy altas; gusto refinado],
  ),
  caption: [Tabla 2.2. Seis perfiles de usuario identificados a partir de los patrones de consumo. Drama aparece como género transversal en todos los grupos.]
)

// ─────────────────────────────────────────────────────────────────────────────
= Red Neuronal Profunda
// ─────────────────────────────────────────────────────────────────────────────

== Por Qué Explorar el Deep Learning

Los modelos clásicos como SVD funcionan muy bien, pero tienen una limitación: asumen que la relación entre un usuario y una película puede expresarse de forma lineal. En la realidad, las preferencias humanas son más complejas. Por eso exploramos *NeuMF* (Neural Matrix Factorization), una red neuronal que combina dos enfoques: uno que captura relaciones simples (similar al SVD) y otro que detecta patrones más sutiles y no lineales. La combinación de ambos debería, en teoría, producir recomendaciones más precisas.

== Resultados y Limitaciones

El modelo neuronal fue entrenado con el 5% del dataset — la fracción que podía manejarse razonablemente en el entorno disponible — y obtuvo un RMSE de *0.8183*, comparado con el *0.8140* de SVD entrenado con la misma cantidad de datos. La diferencia es de apenas un 0.43%.

#figure(
  image("figures/notebook04_pca_ncf_embeddings.png", width: 80%),
  caption: [Figura 3.1. Representación visual de cómo la red neuronal agrupa las películas en un espacio de dos dimensiones. Géneros como Animación y Documental aparecen en zonas claramente separadas, lo que indica que el modelo aprendió diferencias semánticas entre tipos de cine.]
)

¿Por qué la red neuronal no supera claramente al SVD? La respuesta es *falta de datos suficientes*. Las redes neuronales profundas necesitan grandes volúmenes de información para mostrar su potencial. Con el 5% del dataset, no tienen suficiente material para aprender los patrones complejos que las diferenciarían. En estudios con el dataset completo, este tipo de redes supera a SVD en un 3–5%. En nuestro contexto educativo, el SVD sigue siendo la mejor opción práctica.

// ─────────────────────────────────────────────────────────────────────────────
= Búsqueda Semántica y Despliegue
// ─────────────────────────────────────────────────────────────────────────────

== Buscar Películas con Palabras Propias

Los modelos de filtrado colaborativo necesitan historial del usuario para funcionar. Pero, ¿qué pasa con un usuario nuevo? ¿O si alguien simplemente quiere buscar "una película de ciencia ficción sobre inteligencia artificial" sin saber qué título buscar?

Para esto construimos un *motor de búsqueda semántica*: un sistema que entiende consultas escritas en lenguaje natural y encuentra las películas que mejor se ajustan al concepto descrito. Funciona convirtiendo tanto las descripciones de las películas como la consulta del usuario en representaciones numéricas (vectores), y luego buscando cuáles son más similares entre sí. Esto permite que "thriller psicológico con narrativa no lineal" encuentre directamente _Memento_, aunque el usuario nunca haya visto la película.

#figure(
  table(
    columns: (0.3fr, 1.4fr, 1.1fr, 0.35fr),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#1a3a5c") } else if calc.odd(row) { rgb("#f0f4f8") } else { white },
    text(fill: white, weight: "bold")[N], text(fill: white, weight: "bold")[Consulta del usuario], text(fill: white, weight: "bold")[Película recuperada], text(fill: white, weight: "bold")[Score],
    [1], ["Thriller psicológico con narrativa no lineal sobre la memoria"], [_Memento_ (2000)], [0.94],
    [2], ["Épica espacial con batallas galácticas y la Fuerza"], [_The Empire Strikes Back_ (1980)], [0.91],
    [3], ["Historia de amor entre robots en futuro post-apocalíptico"], [_WALL·E_ (2008)], [0.89],
    [4], ["Anime de ciencia ficción sobre inteligencia artificial"], [_Ghost in the Shell_ (1995)], [0.87],
    [5], ["Comedia romántica en la ciudad del amor"], [Películas ambientadas en París], [0.83],
    [6], ["Documental sobre la vida marina y los océanos"], [_Océanos_ (2009)], [0.81],
  ),
  caption: [Tabla 4.1. Ejemplos de consultas en lenguaje natural y los resultados que devuelve el motor semántico. El score indica qué tan bien coincide la película con la descripción.]
)

#figure(
  image("figures/fase4_cobertura_genome.png", width: 78%),
  caption: [Figura 4.2. Cobertura del sistema de etiquetas por año de estreno. El motor semántico funciona mejor para películas de 1995 a 2010, que tienen descripciones más completas.]
)

== La Aplicación Web

Todo el sistema se integró en una aplicación web accesible desde el navegador: una interfaz visual donde el usuario puede explorar recomendaciones personalizadas, buscar películas por texto libre y calificar títulos para mejorar sus sugerencias futuras. El backend corre con FastAPI (Python) y el frontend con Next.js, desplegados juntos mediante Docker para que cualquier persona pueda levantarlo con un solo comando.

// ─────────────────────────────────────────────────────────────────────────────
= Resultados Globales
// ─────────────────────────────────────────────────────────────────────────────

La siguiente tabla reúne todos los enfoques evaluados en el proyecto, permitiendo comparar sus resultados de forma directa.

#figure(
  table(
    columns: (1.6fr, 0.7fr, 0.7fr, 0.65fr, 0.65fr, 0.75fr),
    stroke: 0.5pt,
    fill: (col, row) => if row == 0 { rgb("#1a3a5c") } else if row == 5 { rgb("#e8f4fd") } else if row == 6 { rgb("#e8f4fd") } else if calc.odd(row) { rgb("#f0f4f8") } else { white },
    text(fill: white, weight: "bold", size: 9.5pt)[Modelo],
    text(fill: white, weight: "bold", size: 9.5pt)[Datos usados],
    text(fill: white, weight: "bold", size: 9.5pt)[RMSE],
    text(fill: white, weight: "bold", size: 9.5pt)[MAE],
    text(fill: white, weight: "bold", size: 9.5pt)[P\@10],
    text(fill: white, weight: "bold", size: 9.5pt)[Tiempo],
    [Baseline (popularidad)], [60%], [1.009], [0.792], [0.124], [< 1 s],
    [NMF], [60%], [0.936], [0.713], [0.248], [47 s],
    [AutoML], [60%], [0.924], [0.704], [0.246], [976 s],
    [KNN (vecinos cercanos)], [10%], [0.894], [0.669], [0.301], [125 s],
    [#text(weight: "bold")[SVD — modelo principal]], [60%], text(weight: "bold")[0.865], text(weight: "bold")[0.656], [0.280], text(weight: "bold")[23 s],
    [NeuMF (red neuronal) †], [5%], [0.818], [—], [—], [~8 min],
    [Búsqueda semántica FAISS], [Tag Genome], [—], [—], text(weight: "bold")[0.883], [< 10 ms],
  ),
  caption: [Tabla 5.1. Comparativa global de todos los enfoques. †: La red neuronal fue evaluada con menos datos, por lo que su RMSE no es directamente comparable con el SVD del 60%.]
)

El sistema cumple con todos los objetivos planteados al inicio: el modelo principal supera el benchmark RMSE < 0.90, la precisión de las recomendaciones Top-10 supera el 25%, y el motor semántico documenta más de cinco consultas exitosas en lenguaje natural.

// ─────────────────────────────────────────────────────────────────────────────
= Conclusiones y Consideraciones Éticas
// ─────────────────────────────────────────────────────────────────────────────

== Conclusiones

El proyecto demostró que es posible construir un sistema de recomendación completo y funcional siguiendo un proceso disciplinado de análisis, modelado y evaluación. Cada decisión de diseño surgió de los datos: la elección del modelo principal (SVD), la forma de evaluar (protocolo temporal), el tamaño de las muestras y la incorporación de la búsqueda semántica para cubrir los casos donde el filtrado colaborativo no es suficiente.

Una lección clave fue que *más complejidad no siempre significa mejores resultados*. La red neuronal profunda, que es conceptualmente más sofisticada que el SVD, no logró superarlo de forma significativa con los datos disponibles. El modelo más simple, bien ejecutado y bien evaluado, resultó ser la mejor opción en la práctica. De la misma forma, el sistema de selección automática de modelos (AutoML) quedó por debajo del diseño manual, porque operar con datos limitados redujo su capacidad de encontrar la mejor configuración.

== Limitaciones y Sesgos

Ningún sistema de recomendación es neutro. El nuestro reproduce y puede amplificar tres sesgos que es importante reconocer:

*Sesgo de popularidad:* los usuarios nuevos tienden a recibir siempre las mismas películas muy conocidas (Forrest Gump, El Padrino, Pulp Fiction), porque son las que tienen más calificaciones y más "evidencia" en el dataset. El cine de nicho queda subrepresentado.

*Desigualdad por género cinematográfico:* los usuarios con preferencias en géneros minoritarios (documentales, western, cine experimental) reciben recomendaciones menos precisas, simplemente porque hay menos datos sobre esos géneros.

*Sesgo cultural:* el dataset está dominado por cine estadounidense y europeo occidental. El cine latinoamericano, africano y asiático no masivo tiene muy poca representación, lo que limita la utilidad del sistema para usuarios con esas preferencias.

Reconocer estos sesgos es el primer paso para corregirlos. Algunas mitigaciones posibles incluyen garantizar que cada lista de recomendaciones incluya títulos de distintos perfiles y géneros, y enriquecer el sistema con descripciones en otros idiomas.

== Trabajo Futuro

El proyecto deja varias líneas abiertas para continuar mejorando el sistema:

1. Entrenar la red neuronal con el dataset completo, en un entorno con GPU, para verificar si efectivamente supera al SVD con más datos.
2. Mejorar las recomendaciones para usuarios nuevos, incorporando preferencias declaradas (géneros favoritos, directores) desde la primera sesión.
3. Enriquecer el motor semántico con descripciones en español para el cine latinoamericano.
4. Implementar un mecanismo que permita a los usuarios solicitar que sus datos sean eliminados del sistema.

// ─────────────────────────────────────────────────────────────────────────────
= Referencias Bibliográficas
// ─────────────────────────────────────────────────────────────────────────────

#set par(justify: false)

Harper, F. M., & Konstan, J. A. (2015). *The MovieLens Datasets: History and Context*. _ACM Transactions on Interactive Intelligent Systems_, 5(4). https://doi.org/10.1145/2827872

#v(0.4em)

Koren, Y., Bell, R., & Volinsky, C. (2009). *Matrix Factorization Techniques for Recommender Systems*. _IEEE Computer_, 42(8), 30–37.

#v(0.4em)

He, X., Liao, L., Zhang, H., Nie, L., Hu, X., & Chua, T.-S. (2017). *Neural Collaborative Filtering*. _Proceedings of WWW 2017_, 173–182. https://doi.org/10.1145/3038912.3052569

#v(0.4em)

Reimers, N., & Gurevych, I. (2019). *Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks*. _EMNLP 2019_. https://doi.org/10.18653/v1/D19-1410

#v(0.4em)

Johnson, J., Douze, M., & Jégou, H. (2021). *Billion-Scale Similarity Search with GPUs*. _IEEE Transactions on Big Data_, 7(3), 535–547.

#v(0.4em)

Hug, N. (2020). *Surprise: A Python library for recommender systems*. _Journal of Open Source Software_, 5(52), 2174.

#v(0.4em)

Barocas, S., & Hardt, M. (2023). *Fairness and Machine Learning: Limitations and Opportunities*. MIT Press.

#v(0.4em)

Sculley, D., et al. (2015). *Hidden Technical Debt in Machine Learning Systems*. _NIPS 2015_, 2503–2511.
