// Muestra un valor que cambia en vivo (estado, total del pedido).
// Cuando cambia, el texto da un saltito para que se note, sin mover la fila.

const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');

export function mostrarValor(elemento, texto) {
  const anterior = elemento.dataset.valor;
  if (anterior === texto) return;
  elemento.dataset.valor = texto;
  elemento.textContent = texto;
  if (anterior === undefined || reducirMovimiento.matches) return;
  elemento.classList.remove('salta');
  void elemento.offsetWidth; // reinicia la animación si cambia dos veces seguidas
  elemento.classList.add('salta');
}
