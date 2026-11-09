# La Posta — Carta digital

Carta digital de La Posta, carrito de comidas en Pueblo Esperanza (Paysandú). El cliente ve qué días abre, mira el menú con precios, arma el pedido y lo manda por WhatsApp con el mensaje ya escrito y el total calculado.

El código sale de la carta de La Bondiolita (`valen289/Bondiolita`), con datos y diseño propios.

## Stack (sin backend ni base de datos)

| Parte | Tecnología |
|---|---|
| Lenguaje | HTML + CSS + JavaScript puro, sin paso de build |
| Menú y precios | `data/menu.json` |
| Datos del carrito | `data/local.json`: días y horarios, ubicación, WhatsApp, envío, formas de pago |
| Abierto/Cerrado | `js/horario.js`, con la zona horaria `America/Montevideo` |
| Carrito | `js/carrito.js`, en memoria + `localStorage` |
| Pedido | `js/pedido.js`, enlace `wa.me` con el mensaje armado |
| Logo | `img/logo.png`, recortado del flyer (ver "Datos pendientes") |
| Tipografía | Bebas Neue autoalojada (`fonts/`, licencia OFL), texto con la fuente del sistema |
| Hosting | Cloudflare Workers con archivos estáticos (`wrangler.jsonc`). `_headers` define la caché |

## Cambiar precios o productos

Todo está en [`data/menu.json`](data/menu.json). Cada producto tiene:

```json
{ "id": "hamburguesa-completa", "nombre": "Hamburguesa completa", "descripcion": "", "precio": 210, "foto": null, "disponible": true }
```

- `precio`: número sin puntos ni `$U`.
- `disponible: false` lo muestra como **Agotado** sin borrarlo. Sirve para la noche que se termina algo.
- `id`: no cambiarlo, porque lo usa el carrito.
- `nota` en una categoría se muestra debajo del título (ahí está qué lleva el "completo").
- `pendiente` es solo un recordatorio para quien mantiene la carta; no se muestra en la página.

## Días y horarios

En [`data/local.json`](data/local.json), dentro de `horarios`:

- **Hoy, sin horas confirmadas:** `"dias": [5, 6, 0]` (viernes, sábado, domingo; 0 es domingo) y `"turnos": []`. La página muestra "Abren vie, sáb y dom" y si hoy abren o no, pero **no** dice "Abierto ahora", porque no lo sabe.
- **Cuando estén las horas:** cargar los turnos y la página pasa sola a mostrar Abierto/Cerrado en vivo. Un turno que termina después de medianoche funciona igual:

```json
"turnos": [{ "dias": [5, 6, 0], "desde": "20:00", "hasta": "01:00" }]
```

Si cambian los días, actualizar también `og:description` en `index.html` (dice "Viernes, sábados y domingos").

## Formas de pago y envío

- `"pagos": []` oculta la pregunta del pago y el mensaje sale sin esa línea. Con `["Efectivo", "Transferencia"]`, el cliente tiene que elegir una.
- El envío está apagado (`"habilitado": false`) hasta confirmar zona y costo: el pedido sale como "Retiro en el carrito".

## Probar en la computadora

Hace falta un servidor local, porque abriendo `index.html` como archivo no se cargan los datos:

```bash
npx --yes serve@14.2.4 -l 4321 .
```

Después, abrir http://localhost:4321. **Los pedidos de prueba no se mandan al número del carrito**: para probar el envío, cambiar `whatsapp` por un número propio y volver a ponerlo antes de subir.

## Publicar

### Demo para mostrarle a La Posta (GitHub Pages)

El repo es público, así que GitHub lo sirve gratis:

1. En GitHub: **Settings → Pages**. En "Build and deployment", Source: **Deploy from a branch**; Branch: **main** y carpeta **/ (root)**. Guardar.
2. En uno o dos minutos queda en **https://valen289.github.io/la_posta/**.
3. Mientras sea una demo, `index.html` tiene `<meta name="robots" content="noindex">` para que no aparezca en Google. Si La Posta dice que no, se apaga en el mismo lugar (Settings → Pages).

`.nojekyll` evita que GitHub procese los archivos: se publican tal cual.

### Versión definitiva (Cloudflare)

1. Con el OK de La Posta, conectar el repo en Cloudflare (Workers & Pages → crear → importar el repositorio). La dirección queda como `la-posta.<cuenta>.workers.dev`.
2. Cambiar `og:image` en `index.html` por la dirección nueva de `img/og.jpg` y borrar la línea `noindex`.
3. Poner el enlace en la bio de Instagram y hacer un QR para pegar en el carrito.

## Datos pendientes del carrito

- [ ] Que La Posta apruebe la página y el uso del nombre y el logo
- [ ] Horario de cada día (viernes, sábado y domingo)
- [ ] Formas de pago (¿efectivo, transferencia?)
- [ ] Envío: si hacen, zona y costo
- [ ] "Panchos con papitas $100": confirmar que es por unidad
- [ ] Marca de la cerveza en lata
- [ ] Usuario de Instagram (y Facebook si tienen)
- [ ] Ubicación exacta en Google Maps (hoy el mapa muestra el pueblo, no el carrito)
- [ ] Logo original en buena calidad: el actual está recortado de una captura del flyer
