# OmniRec-Movies 1
Este repositorio contiene un ecosistema de recomendación de películas dividido en tres fases incrementales. El objetivo principal es construir un sistema que combine enfoques estadísticos clásicos, representaciones de aprendizaje profundo (Deep Learning) y una capa de recuperación semántica avanzada.
Para iniciar, primero clone el repositorio en una carpeta en su computadora:
 - git clone https://github.com/Coded7Chaos/OmniRec-Movies
 - cd OmniRec-Movies
Luego, inicie un entorno virtual para que todo sea más ordenado y tener un mejor control de sus dependencias:
Dependiendo de su versión de python deberá usar el comando python, py o python3. En el ejemplo usamos el comando python
 - python -m venv venv 
Y luego, activamos el entorno virtual que acabamos de crear con el siguiente comando:
# MacOS: source venv/bin/activate        # Windows: venv\Scripts\activate

y por ultimo, instalamos los requerimientos con el siguiente comando:
- pip install -r requirements.txt
Y listo! Al momento de ejecutar su .ipynb en su computadora, no olvide que si usa vs code, necesitará la extensión de jupiter, y al momento de ejecutar, tendrá que elegir un kernel o un entorno de python. Elija el entorno de python y seleccione el que identifique como el entorno virtual que acaba de crear que tiene la dirección OmniRec-Movies/venv/bin/python
Ahora puede ejecutar su .ipynb sin errores