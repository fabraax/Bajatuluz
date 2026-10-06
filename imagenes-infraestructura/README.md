# Imágenes de infraestructura de energía

Cinco fotos realistas en formato historia (9:16) para BajaTuLuz, generadas con
**Nano Banana Pro** vía MuAPI a 2K.

| Archivo | Tema |
| --- | --- |
| `01_alta-tension` | Torres de alta tensión sobre un trigal de Castilla al atardecer |
| `02_subestacion` | Subestación eléctrica a la hora azul, con un técnico de espaldas |
| `03_fotovoltaica` | Planta fotovoltaica en Andalucía vista desde un dron |
| `04_eolica` | Parque eólico en Aragón al amanecer, con niebla en el valle |
| `05_gas` | Estación de regulación y medida de gas, tuberías amarillas |

Todas tienen el mismo estilo: foto editorial, sombras verde bosque y toques lima
como la marca, y el tercio superior despejado para poner un titular. Los prompts
completos están en `prompts.json`.

## Generarlas

Antes, el entorno tiene que tener la variable `MUAPI_API_KEY` y permitir
`api.muapi.ai` en el acceso a red.

```bash
python3 generar.py --dry-run    # comprobar las 5 peticiones sin gastar créditos
python3 generar.py              # generar las que falten (5 llamadas la primera vez)
python3 generar.py --solo 02 --rehacer   # repetir una que no convenza
```

Cada generación queda apuntada en `imagenes.json` (modelo, parámetros, prompt,
request_id y URL). Si algo se corta a mitad, el trabajo sigue en el servidor: no
relances, recupéralo con el `request_id` que sale en pantalla.
