# Product

## Platform

web

## Stack

HTML, CSS y JavaScript puro, sin paso de build. Mismo código que la carta de La Bondiolita, con datos y diseño propios. Los archivos se publican tal cual en Cloudflare. Sin backend ni base de datos: los datos viven en `data/*.json`.

## Users

Clientes de La Posta, un carrito de comidas que recién empieza en Pueblo Esperanza (Paysandú, Uruguay), un pueblo de pocos cientos de habitantes. Abre viernes, sábados y domingos. Los clientes son vecinos que ya conocen el carrito y piden por WhatsApp; usan el celular, de noche, muchas veces con datos móviles. Llegan desde Instagram, un grupo de WhatsApp o un QR en el carrito, no desde Google.

El segundo usuario es quien atiende el carrito: recibe los pedidos por WhatsApp un viernes a la noche, con cola, y necesita que lleguen completos.

## Product Purpose

Que la carta esté siempre en el mismo enlace (hoy se publica como historia de Instagram, que se borra a las 24 horas) y que el pedido llegue en un solo mensaje con productos, total, nombre y aclaraciones ("sin aceitunas", "paso a las 21:30").

El éxito es que al carrito le lleguen pedidos ordenados y calculados, sin ida y vuelta de mensajes.

## Positioning

No reemplaza WhatsApp ni Instagram: ordena el canal que ya usan. No compite por descubrimiento (en un pueblo chico todos conocen el carrito).

Alternativa más barata que hay que tener presente: una historia destacada en Instagram con el flyer y el catálogo de WhatsApp Business, que el carrito maneja solo. La página tiene sentido solo si el enlace fijo y los pedidos ordenados les resuelven algo.

Riesgo conocido: los precios los cambia quien mantiene la página, no el carrito. Un negocio que empieza cambia el menú seguido; una carta desactualizada es peor que no tener carta.

## Operating Context

- Abre viernes, sábados y domingos. Horas sin confirmar.
- Un carrito que empieza puede no salir si llueve o cerrar antes si se agota todo: por eso, sin horas confirmadas, la página no dice "Abierto ahora".
- Ubicación según el flyer: "Pueblo Esperanza, a pasitos del salón de MEVIR".
- Pedidos al WhatsApp 092 787 974.
- Moneda: pesos uruguayos (`$U`). Zona horaria: `America/Montevideo`.

## Product Principles

1. El pedido tiene que llegar completo y con el total.
2. Precio desactualizado es un error grave: se cambia en un solo lugar (`data/menu.json`).
3. Primero el celular y los datos móviles.
4. Mostrar solo información verdadera; lo que falta se marca como pendiente, no se inventa (horario, pagos, envío).

## Brand Commitments

- Nombre: La Posta. Frase: "El sabor de casa al paso".
- Logo: ilustración de un carrito con toldo a rayas marrón y crema, "La Posta" en letra cursiva negra y la frase en mayúsculas en un arco. No hay archivo original: el de la página está recortado de una captura del flyer.
- Flyer: papel crema, tinta marrón oscura, títulos de categoría en mayúsculas condensadas sobre trazos de pincel marrones, detalles en naranja.
- Las ilustraciones del flyer (hamburguesa, papas, bebidas) no son fotos de su comida: no se usan como fotos de producto.

## Evidence on Hand

- Flyer del carrito (historia de Instagram con "Te salvamos el finde") con menú, precios, días, ubicación y WhatsApp.
- No hay fotos, horarios, formas de pago ni cifras de pedidos. No se deben fabricar.

## Accessibility & Inclusion

Público general de todas las edades, de noche y con una mano. Botones de 48px o más, contraste alto y texto legible sin zoom.
