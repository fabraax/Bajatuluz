# Historias destacadas · NEGOCIOS (HyperFrames)

Motion graphics de las 4 historias de la serie NEGOCIOS de BajaTuLuz (1080 × 1920, 30 fps),
hechas con [HyperFrames](https://hyperframes.heygen.com) y con las fotos de Canva de fondo.

| Archivo | Qué es |
| --- | --- |
| `video/01_hosteleria.mp4` | Historia 1 suelta (7 s) |
| `video/02_comercios.mp4` | Historia 2 suelta (7 s) |
| `video/03_oficinas.mp4` | Historia 3 suelta (7 s) |
| `video/04_varios-locales.mp4` | Historia 4 suelta (9 s) |
| `video/historias_negocios_completo.mp4` | Las 4 seguidas con cortinillas y el cierre del interruptor (30 s) |

## Fondos de Canva

| Historia | Foto | Archivo |
| --- | --- | --- |
| 1 · Hostelería | Subestación eléctrica a la hora azul | `assets/fondos/hosteleria.jpg` |
| 2 · Comercios | Parque eólico al amanecer | `assets/fondos/comercios.jpg` |
| 3 · Oficinas | Planta fotovoltaica desde un dron | `assets/fondos/oficinas.jpg` |
| 4 · Varios locales | Torres de alta tensión al atardecer | `assets/fondos/varios-locales.jpg` |
| Cierre | Estación de regulación de gas | `assets/fondos/cierre.jpg` |

> **Ahora mismo los fondos son provisionales**: son las miniaturas que devuelve Canva (112 × 199 px) ampliadas, por eso se ven borrosas. Hay que sustituirlas por las imágenes a tamaño completo (944 × 1680) y volver a renderizar.

Para cambiar una foto, sustituye el archivo con el mismo nombre (vertical 9:16; las de Canva, de 944 × 1680, sirven) y vuelve a renderizar.
Las fotos no se retocan: encima llevan un velo con los colores de la marca para que el texto se lea, y un movimiento de cámara lento.

## Cómo está hecho

- `compositions/` — una escena por historia y el cierre (`cierre.html`). Cada una es una subcomposición de HyperFrames con su propio timeline de GSAP.
- `assets/historias.css` y `assets/historias.js` — estilos y animaciones comunes (titular, texto, pie, barra de progreso, cámara).
- `scripts/build.mjs` — genera `index.html` (vídeo completo) y un proyecto por historia suelta en `.build/`, con los tiempos y los sonidos de cada una.
- `assets/sfx/` — efectos de sonido de la librería de HyperFrames (Pixabay, uso comercial libre). `assets/audio/` — cama musical sintetizada (`scripts/cama.py`).

## Renderizar

Necesitas Node 22+ y ffmpeg. HyperFrames descarga su propio Chrome la primera vez (`npx hyperframes browser ensure`).

```bash
node scripts/render.mjs                    # los 5 vídeos, calidad final
node scripts/render.mjs --quality draft    # rápido, para revisar
node scripts/render.mjs comercios main     # solo la historia 2 y el vídeo completo
npx hyperframes check                      # comprobación de HyperFrames (lint, contraste, maquetación)
npx hyperframes preview                    # abrir el estudio para ver y retocar
```
