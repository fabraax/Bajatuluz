---
format: 1080x1920
duration: 30s
message: "BajaTuLuz entiende cómo funciona tu negocio antes de hablar de tarifas"
arc: Hostelería → Comercios → Oficinas → Varios locales (CTA) → interruptor
audience: negocios en España
mode: autonomous
---

## Frame 1 — Hostelería
- status: animated
- src: compositions/hosteleria.html
- duration: 7s
- transition_in: cut
- scene: Taza que se dibuja dentro de un disco de cristal sobre la subestación; chips Cocina / Cámaras de frío / Climatización.
- blueprint: rules svg-path-draw + spring-pop-entrance + sine-wave-loop

## Frame 2 — Comercios
- status: animated
- src: compositions/comercios.html
- duration: 7s
- transition_in: wipe
- scene: Tarjeta de cristal con una tienda que se dibuja (toldo que cae) y la lista horario / equipos / contrato.
- blueprint: rules svg-path-draw + waterfall-entry + svg-icon-enrichment

## Frame 3 — Oficinas
- status: animated
- src: compositions/oficinas.html
- duration: 7s
- transition_in: wipe
- scene: «TU ACTIVIDAD» con un edificio cuyas ventanas se encienden por turnos sobre la planta solar.
- blueprint: rules svg-path-draw + discrete-text-sequence (ventanas) + sine-wave-loop

## Frame 4 — Varios locales
- status: animated
- src: compositions/varios-locales.html
- duration: 9s
- transition_in: wipe
- scene: Cuatro locales numerados unidos como una red eléctrica sobre las torres; CTA «Escríbenos NEGOCIO».
- blueprint: rules spring-pop-entrance + svg-path-draw + ambient-glow-bloom (brillo del CTA)

## Frame 5 — Interruptor
- status: animated
- src: compositions/cierre.html
- duration: 2.2s
- transition_in: crossfade
- scene: Interruptor de pared sobre la estación de gas; clic y corte a negro (ritual de marca).
- blueprint: rules press-release-spring
