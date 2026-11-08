# Design System: La Posta

## Overview

**North Star: "El carrito con toldo"**

La página es el flyer del carrito hecho carta: arriba, papel crema con el toldo a rayas y el logo; abajo, el menú en filas sobre un cuerpo crema claro. El marco marrón oscuro (barra de categorías, sección "El carrito", barra y cabeza del pedido) es la madera y el mostrador del carrito. Los títulos de categoría van sobre cintas marrones con el final irregular, como los trazos de pincel del flyer.

Mismo esqueleto funcional que La Bondiolita (filas de tres columnas, controles de 48px, pedido por WhatsApp), con otra piel: La Bondiolita es un tablero de terminal en blanco y negro; La Posta es papel crema, marrón y la luz naranja de las lamparitas del carrito.

**Key Characteristics:**
- Toldo a rayas con festón arriba de la cabecera y de la hoja del pedido (la firma).
- Cabecera de papel fija en ambos modos, porque el logo es tinta oscura.
- Cintas marrones en los títulos de categoría.
- Filas de tres columnas con reglas de 1px; los productos nunca van en tarjetas con foto.
- Naranja de farolito solo como luz de estado.

## Colors

### Marco marrón (igual en claro y oscuro)
- `--marron` #2b1d14: barra de categorías, "El carrito", barra del pedido, cabeza de la hoja, rayas oscuras del toldo.
- `--marron-alto` #3a291d, `--marron-regla` #4e3a2b: fondos y líneas sobre marrón.
- `--crema` #f6eedf, `--crema-2` #c9b597: letra principal y secundaria sobre marrón.

### Papel de la cabecera (igual en claro y oscuro)
- `--papel` #f1e6d1, `--tinta` #2b1d14, `--tinta-2` #6a5442, `--papel-regla` #d9c7a8.
- `--toldo-claro` #e3cfa9: rayas claras del toldo.

### Luces
- `--farol` #ee9b3d (sobre marrón) y `--farol-tinta` #9c4a0c (texto sobre papel): abierto, elegido, cantidad en el pedido, total, botón de enviar, día de hoy.
- `--brasa-claro` #ff8a66 (sobre marrón y modo oscuro), `--brasa` / `--brasa-tinta` #a3301a (sobre crema): cerrado, agotado, errores.

### Cuerpo
- Claro: `--fondo` #faf5ea, `--texto` #2b1d14, `--texto-2` #6a5442, `--regla` #e7dac5, `--regla-fuerte` #a08a70.
- Oscuro: `--fondo` #1d1510, `--texto` #f3eadb, `--texto-2` #c2ae94; la cinta pasa a #5a3a22.

Contraste verificado: todo texto ≥ 5:1 sobre su fondo (naranja sobre marrón 7.3, naranja oscuro sobre papel 5.0).

### Named Rules
**The Farolito Rule.** El naranja significa "abierto, elegido o en el pedido". Sin horas cargadas no hay farolito: la página no sabe si está abierto ahora.

**The Papel Fijo Rule.** La cabecera de papel no cambia con el modo oscuro; solo el cuerpo del menú.

## Typography

- **Display:** Bebas Neue (autoalojada, un peso): estado, títulos de categoría, días, totales, cantidades. Se parece a los títulos del flyer.
- **Body:** fuente del sistema para todo lo que se lee.
- El "La Posta" en cursiva vive solo en el logo (imagen); no se agrega una fuente cursiva.

## Components

- **Toldo:** rayas de 22px (18px en la hoja) con festón de medio círculo, hecho con `mask` en CSS, sin imágenes.
- **Cinta:** `h2 span` con fondo marrón y `clip-path` de borde irregular.
- **Valor que cambia:** el estado y los totales dan un saltito (0.36s) al cambiar. Sin animación con movimiento reducido.
- **Botones, control de pasos, campos, chips:** iguales a La Bondiolita con los colores de La Posta.

## Do's and Don'ts

- **Do** mantener los controles en 48px o más y los precios alineados a la derecha.
- **Do** escribir la interfaz en infinitivo o impersonal ("Agregar", "Enviar pedido por WhatsApp").
- **Don't** usar las ilustraciones del flyer como fotos de producto.
- **Don't** usar naranja para decorar.
- **Don't** mostrar "Abierto" sin horas confirmadas.
