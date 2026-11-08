import { ahoraEn, estadoLocal, estadoPorDias, horariosPorDia, listaDeDias, tieneHoras } from './horario.js';
import { crearCarrito, claveDe, indicePrecios, lineasDelPedido } from './carrito.js';
import { armarMensaje, enlaceWhatsApp, monto, precio, validarCliente } from './pedido.js';
import { mostrarValor } from './valor.js';

const $ = (id) => document.getElementById(id);
const escapar = (texto) =>
  String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const icono = (nombre) => `<svg aria-hidden="true"><use href="#i-${nombre}"/></svg>`;
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const GUARDADO_CLIENTE = 'laposta.cliente.v1';
const carrito = crearCarrito();
let local;
let menu;
let indice;
let enviado = null; // enlace del último pedido abierto en WhatsApp

iniciar();

async function obtener(url) {
  const respuesta = await fetch(url);
  if (!respuesta.ok) throw new Error(`${url}: ${respuesta.status}`);
  return respuesta.json();
}

async function iniciar() {
  try {
    [local, menu] = await Promise.all([obtener('data/local.json'), obtener('data/menu.json')]);
  } catch (error) {
    console.error(error);
    $('menu').innerHTML = `
      <div class="error-carga" role="alert">
        <strong>No se pudo cargar la carta.</strong>
        Revisar la conexión y volver a intentar.
      </div>
      <button class="boton-borde" type="button" id="reintentar">Volver a intentar</button>`;
    $('reintentar').addEventListener('click', () => location.reload());
    return;
  }

  if (history.state && history.state.hoja) history.replaceState(null, '');
  indice = indicePrecios(menu);
  pintarEstado();
  setInterval(pintarEstado, 30_000);
  pintarMenu();
  pintarCategorias();
  pintarLocal();
  pintarFormulario();
  carrito.suscribir(alCambiarCarrito);
  alCambiarCarrito();
  conectarEventos();
}

/* ---------- Estado abierto / cerrado ---------- */

function textoEstado(estado) {
  if (estado.abierto) {
    const hasta = estado.cierra === '00:00' ? 'la medianoche' : `las ${estado.cierra}`;
    return {
      titulo: 'Abierto',
      detalle: estado.minutosParaCerrar <= 30 ? `cierra en ${estado.minutosParaCerrar} min` : `hasta ${hasta}`,
    };
  }
  return { titulo: 'Cerrado', detalle: estado.abre ? `abre ${estado.cuando} a las ${estado.abre}` : '' };
}

function pintarEstado() {
  if (!tieneHoras(local.horarios)) return pintarEstadoPorDias();

  const estado = estadoLocal(local.horarios);
  const { titulo, detalle } = textoEstado(estado);
  $('estado-rotulo').textContent = 'Estado';
  $('estado').classList.remove('sin-hora');
  $('estado').classList.toggle('cerrado', !estado.abierto);
  mostrarValor($('estado-titulo'), titulo);
  $('estado-detalle').textContent = detalle;

  const hoy = ahoraEn(local.horarios.zona).dia;
  const turnos = horariosPorDia(local.horarios).find((d) => d.dia === hoy).turnos;
  $('hoy').textContent = turnos.length ? turnos.map((t) => `${t.desde} – ${t.hasta}`).join(' · ') : 'Cerrado todo el día';
}

// Sin horas cargadas no se puede decir "abierto ahora": se muestran los días y si hoy es uno de ellos.
function pintarEstadoPorDias() {
  const estado = estadoPorDias(local.horarios);
  $('estado').closest('.fila').hidden = !estado;
  $('hoy').closest('.fila').hidden = !estado;
  if (!estado) return;

  $('estado-rotulo').textContent = 'Abren';
  $('estado').classList.add('sin-hora');
  $('estado').classList.remove('cerrado');
  mostrarValor($('estado-titulo'), capitalizar(listaDeDias(local.horarios.dias)));
  $('estado-detalle').textContent = '';
  $('hoy').textContent = estado.abreHoy ? 'Abren hoy' : `No abren hoy · abren ${estado.cuando}`;
}

/* ---------- Menú ---------- */

function filasDeProducto(producto) {
  const disponible = producto.disponible !== false;
  if (producto.opciones && producto.opciones.length) {
    return producto.opciones.map((opcion) => ({
      clave: claveDe(producto.id, opcion.id),
      nombre: producto.nombre,
      detalle: opcion.nombre,
      precio: opcion.precio,
      disponible,
    }));
  }
  return [{ clave: producto.id, nombre: producto.nombre, detalle: producto.descripcion, precio: producto.precio, disponible }];
}

function control(clave) {
  const item = indice.get(clave);
  const nombre = item ? item.nombre : '';
  const cantidad = carrito.cantidad(clave);
  if (!cantidad) {
    return `<button class="agregar" type="button" data-accion="agregar" aria-label="Agregar ${escapar(nombre)}">Agregar</button>`;
  }
  return `
    <div class="paso" role="group" aria-label="${escapar(nombre)} en el pedido">
      <button type="button" data-accion="restar" aria-label="Quitar uno">${icono('menos')}</button>
      <output>${cantidad}</output>
      <button type="button" data-accion="sumar" aria-label="Sumar uno">${icono('mas')}</button>
    </div>`;
}

function pintarMenu() {
  $('menu').innerHTML = menu.categorias
    .map((categoria) => {
      const filas = categoria.productos.flatMap(filasDeProducto);
      return `
        <section class="categoria" id="cat-${escapar(categoria.id)}" aria-labelledby="t-${escapar(categoria.id)}">
          <h2 id="t-${escapar(categoria.id)}"><span>${escapar(categoria.nombre)}</span></h2>
          ${categoria.nota ? `<p class="categoria-nota">${escapar(categoria.nota)}</p>` : ''}
          <div class="columnas" aria-hidden="true"><span>Producto</span><span>$U</span><span></span></div>
          <ul class="lista">
            ${filas
              .map(
                (f) => `
              <li class="producto${f.disponible ? '' : ' agotado'}">
                <span class="producto-nombre">${escapar(f.nombre)}${
                  f.detalle ? `<span class="producto-detalle">${escapar(f.detalle)}</span>` : ''
                }</span>
                <span class="producto-precio"><span class="sr-only">$U </span>${monto(f.precio)}</span>
                <span class="producto-control" ${f.disponible ? `data-clave="${escapar(f.clave)}" data-cantidad="${carrito.cantidad(f.clave)}"` : ''}>${
                  f.disponible ? control(f.clave) : '<span class="marca-agotado">Agotado</span>'
                }</span>
              </li>`
              )
              .join('')}
          </ul>
        </section>`;
    })
    .join('');
}

/* ---------- Barra de categorías ---------- */

function pintarCategorias() {
  const lista = $('categorias');
  lista.innerHTML = menu.categorias
    .map((c) => `<li><a href="#cat-${escapar(c.id)}" data-cat="${escapar(c.id)}">${escapar(c.nombre)}</a></li>`)
    .join('');

  const enlaces = [...lista.querySelectorAll('a')];
  const secciones = enlaces.map((a) => document.getElementById(`cat-${a.dataset.cat}`));
  const barra = document.querySelector('.categorias');
  let actual = null;
  let pendiente = false;

  const marcar = () => {
    pendiente = false;
    const limite = barra.getBoundingClientRect().bottom + 12;
    let indiceActivo = 0;
    secciones.forEach((s, i) => {
      if (s.getBoundingClientRect().top <= limite) indiceActivo = i;
    });
    const enlace = enlaces[indiceActivo];
    if (enlace === actual) return;
    actual?.removeAttribute('aria-current');
    enlace.setAttribute('aria-current', 'true');
    actual = enlace;
    // El texto de la pestaña activa queda alineado con el margen de 16px del contenido.
    const desde = enlace.parentElement.getBoundingClientRect().left - lista.getBoundingClientRect().left;
    lista.scrollTo({ left: lista.scrollLeft + desde - 6, behavior: 'smooth' });
  };

  // Degradé a la derecha solo mientras quedan categorías fuera de la pantalla.
  const indicarMas = () => {
    lista.classList.toggle('hay-mas', lista.scrollLeft + lista.clientWidth < lista.scrollWidth - 4);
  };
  lista.addEventListener('scroll', indicarMas, { passive: true });
  window.addEventListener('resize', indicarMas);
  indicarMas();

  window.addEventListener(
    'scroll',
    () => {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(marcar);
      }
    },
    { passive: true }
  );
  marcar();
}

/* ---------- Carrito y barra del pedido ---------- */

function resumen() {
  const lineas = lineasDelPedido(carrito, indice);
  const cantidad = lineas.reduce((s, l) => s + l.cantidad, 0);
  const total = lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
  return { lineas, cantidad, total };
}

function actualizarControles(raiz) {
  raiz.querySelectorAll('[data-clave]').forEach((celda) => {
    const clave = celda.dataset.clave;
    const cantidad = String(carrito.cantidad(clave));
    if (celda.dataset.cantidad === cantidad) return;

    const foco = celda.contains(document.activeElement) ? document.activeElement.dataset.accion : null;
    celda.dataset.cantidad = cantidad;
    celda.innerHTML = control(clave);
    if (foco) {
      const destino =
        celda.querySelector(`[data-accion="${foco}"]`) ||
        celda.querySelector('[data-accion="sumar"]') ||
        celda.querySelector('[data-accion="agregar"]');
      destino?.focus();
    }
  });
}

function alCambiarCarrito() {
  const { cantidad, total } = resumen();
  actualizarControles($('menu'));

  const barra = $('barra');
  if (cantidad > 0) {
    $('barra-cuenta').textContent = `Pedido · ${cantidad} ${cantidad === 1 ? 'producto' : 'productos'}`;
    mostrarValor($('barra-total'), precio(total));
    if (barra.hidden) {
      barra.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => barra.classList.add('visible')));
    }
  } else {
    barra.classList.remove('visible');
    barra.hidden = true;
    delete $('barra-total').dataset.valor;
  }
  $('menu').classList.toggle('con-pedido', cantidad > 0);
  $('local').classList.toggle('con-pedido', cantidad > 0);

  if ($('hoja').open) pintarHoja();
}

function avisar(texto) {
  const aviso = $('aviso');
  aviso.textContent = '';
  requestAnimationFrame(() => (aviso.textContent = texto));
}

/* ---------- Hoja del pedido ---------- */

function pintarHoja() {
  const cuerpo = $('hoja-cuerpo');
  const { lineas, total } = resumen();
  const formulario = $('form-pedido');

  let zona = $('hoja-resumen');
  if (!zona) {
    zona = document.createElement('div');
    zona.id = 'hoja-resumen';
    cuerpo.prepend(zona);
  }

  if (enviado) {
    zona.innerHTML = `
      <div class="enviado">
        <h3>Pedido listo en WhatsApp</h3>
        <p>Falta tocar <strong>Enviar</strong> en el chat de WhatsApp para que el pedido le llegue a ${escapar(local.nombre)}.</p>
        <a class="enviar" href="${escapar(enviado)}" target="_blank" rel="noopener">${icono('chat')}Abrir WhatsApp de nuevo</a>
        <button class="boton-borde" type="button" data-accion="nuevo">Empezar otro pedido</button>
      </div>`;
    formulario.hidden = true;
    return;
  }

  if (!lineas.length) {
    zona.innerHTML = `
      <div class="vacio">
        <strong>El pedido está vacío.</strong>
        Los productos se agregan desde la carta con el botón Agregar.
      </div>`;
    formulario.hidden = true;
    return;
  }

  // Si el foco está en un botón de cantidad de la hoja, se recupera después de redibujar.
  const activo = document.activeElement;
  const focoPrevio =
    zona.contains(activo) && activo.closest('[data-clave]')
      ? { clave: activo.closest('[data-clave]').dataset.clave, accion: activo.dataset.accion }
      : null;

  const avisoCerrado = textoCerrado()
    ? `<div class="aviso-cerrado" role="note"><span class="lampara" aria-hidden="true"></span><span>${escapar(textoCerrado())} El pedido se puede mandar igual.</span></div>`
    : '';

  zona.innerHTML = `
    ${avisoCerrado}
    <ul class="lineas">
      ${lineas
        .map(
          (l) => `
        <li class="linea">
          <span class="linea-nombre">${escapar(l.nombre)}<span class="linea-subtotal">${l.cantidad} × ${precio(l.precioUnitario)} = ${precio(l.cantidad * l.precioUnitario)}</span></span>
          <span data-clave="${escapar(l.clave)}" data-cantidad="${l.cantidad}">${control(l.clave)}</span>
        </li>`
        )
        .join('')}
    </ul>
    <div class="total"><span>Total</span><strong class="valor" id="hoja-total"></strong></div>`;
  mostrarValor($('hoja-total'), precio(total));
  formulario.hidden = false;

  if (focoPrevio) {
    const celda = [...zona.querySelectorAll('[data-clave]')].find((c) => c.dataset.clave === focoPrevio.clave);
    const destino =
      celda?.querySelector(`[data-accion="${focoPrevio.accion}"]`) ||
      celda?.querySelector('[data-accion]') ||
      zona.querySelector('[data-accion]') ||
      $('cerrar-hoja');
    destino.focus();
  }
}

/** Aviso para la hoja del pedido cuando hoy no se puede retirar enseguida. Vacío si abre. */
function textoCerrado() {
  if (tieneHoras(local.horarios)) {
    const estado = estadoLocal(local.horarios);
    return !estado.abierto && estado.abre
      ? `El carrito está cerrado ahora. Abre ${estado.cuando} a las ${estado.abre}.`
      : '';
  }
  const estado = estadoPorDias(local.horarios);
  return estado && !estado.abreHoy ? `Hoy el carrito no abre. Abre ${estado.cuando}.` : '';
}

function pintarFormulario() {
  const guardado = leerCliente();
  const envio = local.envio && local.envio.habilitado;
  const pagos = Array.isArray(local.pagos) ? local.pagos : [];
  const radio = (nombre, valor, texto, marcado) => `
    <label><input type="radio" name="${nombre}" value="${escapar(valor)}" ${marcado ? 'checked' : ''}><span class="punto" aria-hidden="true"></span>${escapar(texto)}</label>`;

  const entrega = envio
    ? `<div class="elegir">${radio('entrega', 'retiro', 'Retiro en el carrito', true)}${radio('entrega', 'envio', 'Envío a domicilio', false)}</div>
       ${local.envio.costo ? `<p class="nota">Costo de envío: ${precio(local.envio.costo)}${local.envio.zona ? ` · ${escapar(local.envio.zona)}` : ''}</p>` : ''}`
    : `<div class="retiro-fijo">${icono('local')}<span>Retiro en el carrito<span class="nota" style="display:block">${escapar(local.donde || local.direccion)}</span></span></div>`;

  const formulario = document.createElement('form');
  formulario.className = 'formulario';
  formulario.id = 'form-pedido';
  formulario.noValidate = true;
  formulario.hidden = true;
  formulario.innerHTML = `
    <div class="campo">
      <label for="f-nombre">Nombre</label>
      <input type="text" id="f-nombre" name="nombre" autocomplete="name" maxlength="60" aria-describedby="e-nombre" value="${escapar(guardado.nombre || '')}">
      <p class="error" id="e-nombre"></p>
    </div>
    <fieldset class="campo">
      <legend>Entrega</legend>
      ${entrega}
      <p class="error" id="e-entrega"></p>
    </fieldset>
    ${
      envio
        ? `<div class="campo" id="campo-direccion" hidden>
            <label for="f-direccion">Dirección</label>
            <input type="text" id="f-direccion" name="direccion" autocomplete="street-address" maxlength="120" aria-describedby="e-direccion">
            <p class="error" id="e-direccion"></p>
          </div>`
        : ''
    }
    ${
      pagos.length
        ? `<fieldset class="campo">
            <legend>Pago</legend>
            <div class="elegir">${pagos.map((p) => radio('pago', p, p, guardado.pago === p)).join('')}</div>
            <p class="error" id="e-pago"></p>
          </fieldset>`
        : ''
    }
    <div class="campo">
      <label for="f-aclaracion">Aclaración <span class="opcional">(opcional)</span></label>
      <textarea id="f-aclaracion" name="aclaracion" maxlength="200" placeholder="Ej.: sin aceitunas, paso a las 21:30"></textarea>
    </div>
    ${
      local.whatsapp
        ? ''
        : `<p class="nota-pendiente">El número todavía no está cargado: WhatsApp va a pedir elegir el chat de ${escapar(local.nombre)}.</p>`
    }
    <button class="enviar" type="submit">${icono('chat')}Enviar pedido por WhatsApp</button>
    <button class="texto-boton" type="button" data-accion="vaciar">Vaciar pedido</button>`;
  $('hoja-cuerpo').append(formulario);

  formulario.addEventListener('change', (e) => {
    if (e.target.name === 'entrega' && $('campo-direccion')) {
      $('campo-direccion').hidden = e.target.value !== 'envio';
    }
    if (e.target.name === 'pago') limpiarError('pago');
  });
  formulario.addEventListener('input', (e) => {
    if (e.target.name === 'nombre') limpiarError('nombre');
    if (e.target.name === 'direccion') limpiarError('direccion');
  });
  formulario.addEventListener('submit', enviarPedido);
}

function limpiarError(campo) {
  const error = $(`e-${campo}`);
  if (error) error.textContent = '';
  $(`f-${campo}`)?.removeAttribute('aria-invalid');
}

function leerCliente() {
  try {
    return JSON.parse(localStorage.getItem(GUARDADO_CLIENTE) || '{}');
  } catch {
    return {};
  }
}

function guardarCliente(datos) {
  try {
    localStorage.setItem(GUARDADO_CLIENTE, JSON.stringify(datos));
  } catch {
    // Sin almacenamiento disponible: no se recuerda el nombre, nada más.
  }
}

function enviarPedido(evento) {
  evento.preventDefault();
  const formulario = evento.currentTarget;
  const datos = new FormData(formulario);
  const cliente = {
    nombre: datos.get('nombre') || '',
    entrega: datos.get('entrega') || 'retiro',
    direccion: datos.get('direccion') || '',
    pago: datos.get('pago') || '',
    aclaracion: datos.get('aclaracion') || '',
  };

  const errores = validarCliente(cliente, {
    envio: Boolean(local.envio && local.envio.habilitado),
    pago: Array.isArray(local.pagos) && local.pagos.length > 0,
  });
  ['nombre', 'entrega', 'direccion', 'pago'].forEach(limpiarError);
  const campos = Object.keys(errores);
  if (campos.length) {
    campos.forEach((campo) => {
      const error = $(`e-${campo}`);
      if (error) error.textContent = errores[campo];
      $(`f-${campo}`)?.setAttribute('aria-invalid', 'true');
    });
    const primero = campos[0];
    const destino = $(`f-${primero}`) || formulario.querySelector(`[name="${primero}"]`);
    destino?.focus();
    avisar(errores[primero]);
    return;
  }

  const { lineas } = resumen();
  if (!lineas.length) return;
  guardarCliente({ nombre: cliente.nombre.trim(), pago: cliente.pago });

  const enlace = enlaceWhatsApp(local.whatsapp, armarMensaje(lineas, cliente));
  const ventana = window.open(enlace, '_blank');
  if (ventana) ventana.opener = null;
  else window.location.href = enlace;

  enviado = enlace;
  pintarHoja();
  $('hoja-cuerpo').scrollTop = 0;
}

function abrirHoja() {
  const hoja = $('hoja');
  if (hoja.open) return;
  enviado = null;
  pintarHoja();
  hoja.showModal();
  $('titulo-hoja').focus();
  $('hoja-cuerpo').scrollTop = 0;
  history.pushState({ hoja: true }, '');
}

function cerrarHoja() {
  const hoja = $('hoja');
  if (hoja.open) hoja.close();
}

/* ---------- El local ---------- */

function pintarLocal() {
  const hoy = ahoraEn(local.horarios.zona).dia;
  const conHoras = tieneHoras(local.horarios);
  $('horarios').innerHTML = horariosPorDia(local.horarios)
    .map((d) => {
      const esHoy = d.dia === hoy;
      let turnos = '<span class="sin-turno">Cerrado</span>';
      if (d.turnos.length) turnos = d.turnos.map((t) => `${t.desde} – ${t.hasta}`).join(' · ');
      else if (!conHoras && d.abre) turnos = 'Abren';
      return `<div class="dia${esHoy ? ' hoy' : ''}"><dt>${capitalizar(d.nombre)}</dt><dd>${turnos}</dd>${
        esHoy ? '<span class="marca-hoy">Hoy</span>' : '<span></span>'
      }</div>`;
    })
    .join('');
  // Mientras no haya horas cargadas, el horario se consulta por WhatsApp.
  $('nota-horario').hidden = conHoras || !local.whatsapp;

  $('direccion').innerHTML = `${escapar(local.direccion)}<span>${escapar(
    [local.referencia, local.ciudad].filter(Boolean).join(' · ')
  )}</span>`;
  $('donde').firstChild.textContent = local.donde || local.direccion;

  const destino = local.mapa.enlace || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(local.mapa.busqueda)}`;
  $('como-llegar').href = destino;

  $('mapa-cargar').addEventListener('click', () => {
    const marco = document.createElement('iframe');
    marco.src = `https://www.google.com/maps?q=${encodeURIComponent(local.mapa.busqueda)}&output=embed`;
    marco.title = `Mapa: ${local.nombre}, ${local.direccion}`;
    marco.loading = 'lazy';
    marco.referrerPolicy = 'no-referrer-when-downgrade';
    $('mapa').replaceChildren(marco);
  });

  const contactos = [];
  if (local.whatsapp) contactos.push([`https://wa.me/${String(local.whatsapp).replace(/\D/g, '')}`, 'WhatsApp']);
  if (local.telefono) contactos.push([`tel:${String(local.telefono).replace(/[^\d+]/g, '')}`, `Llamar · ${local.telefono}`]);
  if (local.instagram) contactos.push([`https://instagram.com/${String(local.instagram).replace(/^@/, '')}`, 'Instagram']);
  if (local.facebook) contactos.push([local.facebook, 'Facebook']);
  if (contactos.length) {
    $('contacto').innerHTML = contactos
      .map(([href, texto]) => `<li><a href="${escapar(href)}" target="_blank" rel="noopener">${escapar(texto)}${icono('flecha')}</a></li>`)
      .join('');
    $('contacto-bloque').hidden = false;
  }
}

/* ---------- Eventos ---------- */

function conectarEventos() {
  document.addEventListener('click', (e) => {
    const boton = e.target.closest('[data-accion]');
    if (!boton) return;
    const accion = boton.dataset.accion;

    if (accion === 'vaciar') {
      carrito.vaciar();
      avisar('Pedido vacío');
      return;
    }
    if (accion === 'nuevo') {
      enviado = null;
      carrito.vaciar();
      cerrarHoja();
      avisar('Pedido vacío. Se puede armar uno nuevo.');
      return;
    }

    const celda = boton.closest('[data-clave]');
    if (!celda) return;
    const clave = celda.dataset.clave;
    const item = indice.get(clave);
    if (accion === 'agregar' || accion === 'sumar') carrito.sumar(clave, 1);
    if (accion === 'restar') carrito.sumar(clave, -1);

    const { total } = resumen();
    const cantidad = carrito.cantidad(clave);
    avisar(
      cantidad
        ? `${item.nombre}: ${cantidad}. Total ${precio(total)}.`
        : `${item.nombre} quitado del pedido. Total ${precio(total)}.`
    );
  });

  $('barra').addEventListener('click', abrirHoja);
  $('cerrar-hoja').addEventListener('click', cerrarHoja);

  const hoja = $('hoja');
  hoja.addEventListener('click', (e) => {
    if (e.target === hoja) cerrarHoja();
  });
  hoja.addEventListener('close', () => {
    if (history.state && history.state.hoja) history.back();
    $('barra').focus({ preventScroll: true });
  });
  window.addEventListener('popstate', () => {
    if (hoja.open) hoja.close();
  });
}
