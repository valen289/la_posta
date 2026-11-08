// Arma el mensaje de WhatsApp a partir del carrito y los datos del cliente.

const formatoNumero = new Intl.NumberFormat('es-UY', { maximumFractionDigits: 0 });

/** 1890 -> "1.890" */
export const monto = (valor) => formatoNumero.format(valor);

/** 1890 -> "$U 1.890" */
export const precio = (valor) => `$U ${monto(valor)}`;

/**
 * lineas: [{ nombre, cantidad, precioUnitario }]
 * cliente: { nombre, entrega: 'retiro' | 'envio', direccion, pago, aclaracion }
 * El pago va solo si el local tiene formas de pago cargadas.
 */
export function armarMensaje(lineas, cliente) {
  const total = lineas.reduce((suma, l) => suma + l.cantidad * l.precioUnitario, 0);
  const renglones = ['Hola! Quiero hacer un pedido:'];

  for (const l of lineas) {
    renglones.push(`${l.cantidad}x ${l.nombre} – ${precio(l.cantidad * l.precioUnitario)}`);
  }
  renglones.push(`Total: ${precio(total)}`);
  renglones.push(`Nombre: ${cliente.nombre.trim()}`);
  renglones.push(
    cliente.entrega === 'envio' ? `Envío a: ${cliente.direccion.trim()}` : 'Retiro en el carrito'
  );
  if (cliente.pago) renglones.push(`Pago: ${cliente.pago}`);
  if (cliente.aclaracion && cliente.aclaracion.trim()) {
    renglones.push(`Aclaración: ${cliente.aclaracion.trim()}`);
  }
  return renglones.join('\n');
}

/**
 * Enlace que abre WhatsApp con el mensaje escrito.
 * Sin número cargado, WhatsApp le pide al cliente que elija el chat.
 */
export function enlaceWhatsApp(numero, mensaje) {
  const destino = numero ? String(numero).replace(/\D/g, '') : '';
  return `https://wa.me/${destino}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Errores del formulario, por campo. Vacío si se puede enviar.
 * opciones: { envio: hay envío a domicilio, pago: hay formas de pago para elegir }
 */
export function validarCliente(cliente, opciones) {
  const errores = {};
  if (!cliente.nombre || !cliente.nombre.trim()) errores.nombre = 'Falta el nombre';
  if (cliente.entrega === 'envio') {
    if (!opciones.envio) errores.entrega = 'Por ahora solo retiro en el carrito';
    else if (!cliente.direccion || !cliente.direccion.trim()) errores.direccion = 'Falta la dirección';
  }
  if (opciones.pago && !cliente.pago) errores.pago = 'Falta la forma de pago';
  return errores;
}
