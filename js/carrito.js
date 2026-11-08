// Carrito en memoria, guardado en localStorage para no perderlo si se cierra la pestaña.
// Guarda solo claves y cantidades; nombres y precios salen siempre del menú vigente.

const CLAVE_GUARDADO = 'laposta.carrito.v1';
const MAXIMO_POR_PRODUCTO = 50;

function leerGuardado() {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE_GUARDADO) || '{}');
    const limpio = {};
    for (const [clave, cantidad] of Object.entries(crudo)) {
      const n = Math.floor(Number(cantidad));
      if (n > 0) limpio[clave] = Math.min(n, MAXIMO_POR_PRODUCTO);
    }
    return limpio;
  } catch {
    return {};
  }
}

function guardar(items) {
  try {
    localStorage.setItem(CLAVE_GUARDADO, JSON.stringify(items));
  } catch {
    // Navegación privada o almacenamiento bloqueado: el carrito sigue funcionando en memoria.
  }
}

/** Clave de una línea: el id del producto, o "id:opción" si tiene opciones. */
export const claveDe = (productoId, opcionId) => (opcionId ? `${productoId}:${opcionId}` : productoId);

export function crearCarrito() {
  let items = leerGuardado();
  const oyentes = new Set();

  const avisar = () => {
    guardar(items);
    oyentes.forEach((fn) => fn());
  };

  return {
    cantidad: (clave) => items[clave] || 0,
    fijar(clave, cantidad) {
      const n = Math.max(0, Math.min(MAXIMO_POR_PRODUCTO, Math.floor(cantidad)));
      if (n === 0) delete items[clave];
      else items[clave] = n;
      avisar();
    },
    sumar(clave, delta) {
      this.fijar(clave, (items[clave] || 0) + delta);
    },
    vaciar() {
      items = {};
      avisar();
    },
    entradas: () => Object.entries(items),
    suscribir(fn) {
      oyentes.add(fn);
      return () => oyentes.delete(fn);
    },
  };
}

/** Índice clave -> { nombre, precio } armado desde el menú. */
export function indicePrecios(menu) {
  const indice = new Map();
  for (const categoria of menu.categorias) {
    for (const p of categoria.productos) {
      if (p.disponible === false) continue;
      const base = p.descripcion ? `${p.nombre} (${p.descripcion})` : p.nombre;
      if (p.opciones && p.opciones.length) {
        for (const o of p.opciones) {
          indice.set(claveDe(p.id, o.id), { nombre: `${base} – ${o.nombre}`, precio: o.precio });
        }
      } else {
        indice.set(p.id, { nombre: base, precio: p.precio });
      }
    }
  }
  return indice;
}

/** Líneas del pedido con nombre y precio actuales. Descarta productos que ya no están en el menú. */
export function lineasDelPedido(carrito, indice) {
  const lineas = [];
  for (const [clave, cantidad] of carrito.entradas()) {
    const item = indice.get(clave);
    if (!item) continue;
    lineas.push({ clave, nombre: item.nombre, cantidad, precioUnitario: item.precio });
  }
  return lineas;
}
