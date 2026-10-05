# Historias destacadas · EMPIEZA

Rediseño y motion graphics de las 4 historias de presentación de BajaTuLuz (1080 × 1920).

## Qué hay aquí

| Archivo | Para qué |
| --- | --- |
| `video/01_historia.mp4` … `04_historia.mp4` | Una historia por vídeo, para subirlas por separado a Instagram (7 s, 7 s, 7 s y 9,5 s). |
| `video/historias_empieza_completo.mp4` | Las 4 seguidas con cortinillas y el cierre del interruptor (≈ 30 s). Para Reels, TikTok o para enseñarlo. |
| `png/01_historia.png` … `04_historia.png` | Versión estática de cada historia (el último fotograma). |
| `comparativa.png` | Antes y después. |
| `fuente/` | El HTML animado, el sonido y el script de render. |

Todos los vídeos son H.264 a 30 fps con sonido AAC (unos −18 LUFS). Si en Instagram le pones música, baja el «sonido original» en el editor.

## Qué ha cambiado

- **Tipografía con jerarquía.** Inter Tight extra negrita para la primera línea e Instrument Serif cursiva para la segunda; la línea de apoyo va en JetBrains Mono. En las versiones claras, un subrayado lima tipo rotulador marca la frase clave.
- **Cada historia tiene una imagen que cuenta algo**, en lugar del mismo rayo repetido:
  1. Un medidor que sube y luego baja («Baja tu luz»), con las etiquetas Luz y Gas.
  2. Una onda de voz en directo («te escuchamos») y los tres puntos que revisáis: actividad, horarios y necesidades.
  3. Una propuesta en papel que se va marcando y un sello de «0 €, estudio gratis».
  4. Una conversación por mensaje directo: el cliente escribe NEGOCIO y vosotros contestáis. El texto que antes iba suelto ahora son vuestras respuestas.
- **Zonas seguras de Instagram.** Nada importante queda en los 240 px de arriba ni en los 280 px de abajo, que es donde Instagram pone el nombre de la cuenta y la barra de respuesta.
- **Logo adaptado a cada fondo.** Versión a color sobre crema, versión clara sobre verde y versión verde sobre lima, sin el recuadro blanco.
- **Historia 4:** en el pie pone «Responde a esta historia», porque responder a una historia ya manda un mensaje directo.
- **Cierre de marca:** el vídeo completo termina con el clic del interruptor y la pantalla en negro, como el resto de vídeos.

## Volver a renderizar

Necesitas Node con Playwright (Chromium), ffmpeg y Python 3 con `numpy` y `scipy`.

```bash
cd fuente
node render.js              # todo
node render.js s3 master    # solo la historia 3 y el vídeo completo
```

Los textos, colores y tiempos están en `fuente/historias.html`. Para ver la animación en el navegador, abre `historias.html?mode=master&play` (o `mode=s1` … `s4`).
