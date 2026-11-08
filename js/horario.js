// Calcula si el local está abierto según sus turnos y la zona horaria del local.
// Los días van de 0 (domingo) a 6 (sábado). Un turno que termina a una hora
// menor o igual a la de inicio (por ejemplo 20:00 a 00:00) cruza la medianoche.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DIA_CORTO = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MIN_DIA = 1440;
const MIN_SEMANA = 7 * MIN_DIA;

const aMinutos = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Día de la semana y minutos desde la medianoche en la zona indicada. */
export function ahoraEn(zona, fecha = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(fecha);
  const valor = (tipo) => partes.find((p) => p.type === tipo).value;
  return {
    dia: DIA_CORTO.indexOf(valor('weekday')),
    minutos: Number(valor('hour')) * 60 + Number(valor('minute')),
  };
}

/** Convierte los turnos en intervalos [inicio, fin) medidos en minutos de la semana. */
function intervalos(turnos) {
  const lista = [];
  for (const turno of turnos) {
    for (const dia of turno.dias) {
      const inicio = dia * MIN_DIA + aMinutos(turno.desde);
      let fin = dia * MIN_DIA + aMinutos(turno.hasta);
      if (fin <= inicio) fin += MIN_DIA;
      lista.push({ inicio, fin, dia, turno });
    }
  }
  return lista;
}

/**
 * Estado del local en un momento dado.
 * Abierto:  { abierto: true, cierra: '15:00', minutosParaCerrar }
 * Cerrado:  { abierto: false, abre: '20:00', minutosParaAbrir, cuando: 'hoy' | 'mañana' | 'el lunes' }
 * Sin turnos cargados: { abierto: false, abre: null }
 */
export function estadoLocal(horarios, fecha = new Date()) {
  const { dia, minutos } = ahoraEn(horarios.zona, fecha);
  const ahora = dia * MIN_DIA + minutos;
  const lista = intervalos(horarios.turnos || []);

  for (const tramo of lista) {
    // El segundo valor cubre turnos que cruzan del sábado al domingo.
    for (const t of [ahora, ahora + MIN_SEMANA]) {
      if (t >= tramo.inicio && t < tramo.fin) {
        return { abierto: true, cierra: tramo.turno.hasta, minutosParaCerrar: tramo.fin - t };
      }
    }
  }

  let proximo = null;
  for (const tramo of lista) {
    let falta = tramo.inicio - ahora;
    if (falta <= 0) falta += MIN_SEMANA;
    if (!proximo || falta < proximo.falta) proximo = { falta, tramo };
  }
  if (!proximo) return { abierto: false, abre: null };

  const diasDeDistancia = Math.floor((minutos + proximo.falta) / MIN_DIA);
  const cuando =
    diasDeDistancia === 0 ? 'hoy' : diasDeDistancia === 1 ? 'mañana' : `el ${DIAS[proximo.tramo.dia]}`;
  return {
    abierto: false,
    abre: proximo.tramo.turno.desde,
    minutosParaAbrir: proximo.falta,
    cuando,
  };
}

/* ---------- Sin horas cargadas: solo los días que abre ---------- */

const DIA_ABREVIADO = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const desdeLunes = (dia) => (dia + 6) % 7;

/** true si hay turnos con hora; si no, la página trabaja solo con los días. */
export const tieneHoras = (horarios) => Array.isArray(horarios.turnos) && horarios.turnos.length > 0;

/**
 * Con solo los días cargados no se puede saber si está abierto en este momento.
 * Abre hoy:    { abreHoy: true }
 * No abre hoy: { abreHoy: false, cuando: 'mañana' | 'el viernes' }
 * Sin días:    null
 */
export function estadoPorDias(horarios, fecha = new Date()) {
  const dias = horarios.dias || [];
  if (!dias.length) return null;
  const { dia } = ahoraEn(horarios.zona, fecha);
  if (dias.includes(dia)) return { abreHoy: true };
  for (let i = 1; i <= 7; i++) {
    const siguiente = (dia + i) % 7;
    if (dias.includes(siguiente)) return { abreHoy: false, cuando: i === 1 ? 'mañana' : `el ${DIAS[siguiente]}` };
  }
  return null;
}

/** [5, 6, 0] -> "vie, sáb y dom" */
export function listaDeDias(dias) {
  const nombres = [...dias].sort((a, b) => desdeLunes(a) - desdeLunes(b)).map((d) => DIA_ABREVIADO[d]);
  return nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}` : nombres.join('');
}

/** Turnos agrupados por día, para mostrar la tabla de horarios de lunes a domingo. */
export function horariosPorDia(horarios) {
  const orden = [1, 2, 3, 4, 5, 6, 0];
  const dias = horarios.dias || [];
  return orden.map((dia) => ({
    dia,
    nombre: DIAS[dia],
    abre: dias.includes(dia),
    turnos: (horarios.turnos || [])
      .filter((t) => t.dias.includes(dia))
      .map((t) => ({ desde: t.desde, hasta: t.hasta }))
      .sort((a, b) => aMinutos(a.desde) - aMinutos(b.desde)),
  }));
}
