// Calendario Dinámico - Carga eventos desde objeto literal
const actividades = {
    // Eventos puntuales (fecha específica)
    '2026-02-15': { titulo: 'Reapertura', tipo: 'comunidad', descripcion: 'Inicio de actividades' },
    '2026-02-19': { titulo: 'Preparación de nudos', tipo: 'formacion', descripcion: 'Entrenamiento de técnicas de nudos' },
    '2026-02-20': { titulo: 'Encuentro espiritual con club Emannuel', tipo: 'espiritual', descripcion: 'Primer encuentro con club amigo' },
    '2026-02-21': { titulo: 'Especialidad de Santuario', tipo: 'formacion', descripcion: 'Capacitación en conocimiento de santuario' },
    '2026-02-22': { titulo: 'Organización estructural/Pruebas físicas', tipo: 'preparacion', descripcion: 'Preparación para campamento' },
    '2026-02-25': { titulo: 'Entrenamiento de Voleibol', tipo: 'deportes', descripcion: 'Práctica de voleibol' },
    '2026-02-26': { titulo: 'Entrenamiento de marchas', tipo: 'formacion', descripcion: 'Ejercicio de marchas' },
    '2026-02-28': { titulo: 'Evaluación pruebas espirituales', tipo: 'espiritual', descripcion: 'Culto joven y evaluación' },
    '2026-03-01': { titulo: 'Feria de Guías Mayores', tipo: 'evento', descripcion: 'Participación en feria' },
    '2026-03-05': { titulo: 'Entrenamiento de marcha', tipo: 'formacion', descripcion: 'Ejercicio técnico' },
    '2026-03-07': { titulo: 'Especialidad de prédica (virtual)', tipo: 'formacion', descripcion: 'Capacitación a distancia' },
    '2026-03-08': { titulo: 'Amarras', tipo: 'formacion', descripcion: 'Práctica de nudos y amarras' },
    '2026-03-14': { titulo: 'Competencia de prédica (HOMILÉTICA)', tipo: 'evento', descripcion: 'Concurso de predicación' },
    '2026-03-15': { titulo: 'Pruebas de nudos vs G12', tipo: 'evento', descripcion: 'Prueba de rally y nudos' },
    '2026-03-22': { titulo: 'Inspección de uniformes', tipo: 'preparacion', descripcion: 'Revisión de uniformes' },
    '2026-03-28': { titulo: 'Especialidad intercesor con G12', tipo: 'espiritual', descripcion: 'Formación espiritual' },
    '2026-03-29': { titulo: 'Organización de Arte de acampar', tipo: 'preparacion', descripcion: 'Preparación campamento' },
    '2026-04-01': { titulo: 'Campamento de Guías Mayores', tipo: 'evento', descripcion: 'Campamento principal', rango: { inicio: '2026-04-01', fin: '2026-04-05' } },
    '2026-04-11': { titulo: 'Impacto misionero libro del año', tipo: 'misionero', descripcion: 'Actividad misionera' },
    '2026-04-19': { titulo: 'Socialización de campamento', tipo: 'evento', descripcion: 'Reflexión y compartición' },
    '2026-04-25': { titulo: 'Especialidad de excursionismo', tipo: 'formacion', descripcion: 'Capacitación técnica' },
    '2026-04-26': { titulo: 'Excursión cerro tres cruces', tipo: 'evento', descripcion: 'Senderismo a larga distancia' },
    '2026-05-02': { titulo: 'Adelanto de investidura', tipo: 'preparacion', descripcion: 'Preparación para investidura', rango: { inicio: '2026-05-02', fin: '2026-05-03' } },
    '2026-05-09': { titulo: 'Proyecto misionero', tipo: 'misionero', descripcion: 'Actividad de servicio' },
    '2026-05-10': { titulo: 'Especialidad código de semáforo', tipo: 'formacion', descripcion: 'Aprendizaje de códigos' },
    '2026-05-16': { titulo: 'Día del aventurero', tipo: 'evento', descripcion: 'Celebración especial' },
    '2026-05-17': { titulo: 'Adelanto de investidura', tipo: 'preparacion', descripcion: 'Continuación de preparación' },
    '2026-05-23': { titulo: 'Reunión "Volviendo al propósito"', tipo: 'espiritual', descripcion: 'Reflexión comunitaria', rango: { inicio: '2026-05-23', fin: '2026-05-24' } },
    '2026-05-31': { titulo: 'Despedida de semestre', tipo: 'evento', descripcion: 'Cierre de actividades' },
    '2026-06-01': { titulo: 'Vacaciones del club', tipo: 'descanso', descripcion: 'Período de receso', rango: { inicio: '2026-06-01', fin: '2026-06-23' } },
    '2026-06-24': { titulo: 'Campamento de Conquistadores', tipo: 'evento', descripcion: 'Campamento principal', rango: { inicio: '2026-06-24', fin: '2026-06-28' } },
    '2026-07-25': { titulo: 'Reapertura ministerio juvenil UNAC', tipo: 'evento', descripcion: 'Reinicio de actividades', rango: { inicio: '2026-07-25', fin: '2026-07-26' } },
    '2026-08-01': { titulo: 'Inicio de club/Especialidad apreciación del sábado', tipo: 'formacion', descripcion: 'Reapertura del club' },
    '2026-08-02': { titulo: 'Rally de apertura', tipo: 'evento', descripcion: 'Evento de bienvenida' },
    '2026-08-08': { titulo: 'Retiro espiritual parque Arvi', tipo: 'espiritual', descripcion: 'Retiro en la naturaleza' },
    '2026-08-15': { titulo: 'Especialidad Arte Culinario', tipo: 'formacion', descripcion: 'Capacitación culinaria' },
    '2026-08-16': { titulo: 'Masterchef Élite', tipo: 'evento', descripcion: 'Competencia gastronómica' },
    '2026-08-22': { titulo: 'Adelanto de investidura', tipo: 'preparacion', descripcion: 'Preparación', rango: { inicio: '2026-08-22', fin: '2026-08-23' } },
    '2026-08-29': { titulo: 'Celebración de cumpleaños', tipo: 'evento', descripcion: 'Fiesta comunitaria' },
    '2026-09-05': { titulo: 'Especialidad de Agricultura', tipo: 'formacion', descripcion: 'Capacitación agrícola', rango: { inicio: '2026-09-05', fin: '2026-09-06' } },
    '2026-09-12': { titulo: 'Adelanto de investidura', tipo: 'preparacion', descripcion: 'Preparación', rango: { inicio: '2026-09-12', fin: '2026-09-13' } },
    '2026-09-19': { titulo: 'Día del conquistador', tipo: 'evento', descripcion: 'Celebración importante' },
    '2026-09-20': { titulo: 'Amigo secreto', tipo: 'comunidad', descripcion: 'Actividad de convivencia' },
    '2026-09-26': { titulo: 'Adelanto de investidura', tipo: 'preparacion', descripcion: 'Preparación', rango: { inicio: '2026-09-26', fin: '2026-09-27' } },
    '2026-10-03': { titulo: 'Preparación mini campamento', tipo: 'preparacion', descripcion: 'Preparativos', rango: { inicio: '2026-10-03', fin: '2026-10-04' } },
    '2026-10-09': { titulo: 'Mini campamento de supervivencia', tipo: 'evento', descripcion: 'Campamento especial', rango: { inicio: '2026-10-09', fin: '2026-10-11' } },
    '2026-10-24': { titulo: 'Revisión final carpeta de investidura', tipo: 'preparacion', descripcion: 'Última revisión', rango: { inicio: '2026-10-24', fin: '2026-10-25' } },
    '2026-11-07': { titulo: 'Investidura', tipo: 'evento', descripcion: 'Ceremonia de investidura' },
    '2026-11-08': { titulo: 'Despedida de semestre', tipo: 'evento', descripcion: 'Cierre de año' },
    // Evento de rango múltiple: Semana de oración juvenil (21-28 marzo) + Entrenamiento de marchas (16-28 marzo)
    '2026-03-16': { titulo: 'Entrenamiento de marchas', tipo: 'formacion', descripcion: 'Preparación hasta el 28', rango: { inicio: '2026-03-16', fin: '2026-03-28' } },
    '2026-03-21': { titulo: 'GYD - Día Mundial de la Juventud', tipo: 'evento', descripcion: 'Celebración mundial' },
    '2026-semana-oracion': { titulo: 'Semana de oración juvenil', tipo: 'espiritual', descripcion: 'Semana especial de oración y reflexión', rango: { inicio: '2026-03-21', fin: '2026-03-28' } }
};

class CalendarioActividades {
    constructor() {
        this.mesActual = new Date().getMonth();
        this.anioActual = new Date().getFullYear();
        this.eventos = actividades;
        this.inicializar();
    }

    inicializar() {
        this.actualizarCalendario();
        this.asignarEventos();
    }

    asignarEventos() {
        const btnPrevio = document.getElementById('prevMonth');
        const btnProximo = document.getElementById('nextMonth');

        if (btnPrevio) {
            btnPrevio.addEventListener('click', () => this.mesAnterior());
        }
        if (btnProximo) {
            btnProximo.addEventListener('click', () => this.mesSiguiente());
        }
    }

    mesAnterior() {
        this.mesActual--;
        if (this.mesActual < 0) {
            this.mesActual = 11;
            this.anioActual--;
        }
        this.actualizarCalendario();
    }

    mesSiguiente() {
        this.mesActual++;
        if (this.mesActual > 11) {
            this.mesActual = 0;
            this.anioActual++;
        }
        this.actualizarCalendario();
    }

    actualizarCalendario() {
        this.actualizarTitulo();
        this.generarDias();
    }

    actualizarTitulo() {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const titulo = document.getElementById('monthTitle');
        if (titulo) {
            titulo.textContent = `${meses[this.mesActual]} ${this.anioActual}`;
        }
    }

    generarDias() {
        const primerDia = new Date(this.anioActual, this.mesActual, 1);
        const ultimoDia = new Date(this.anioActual, this.mesActual + 1, 0);
        const diasEnMes = ultimoDia.getDate();
        const diaInicio = primerDia.getDay();

        const contenedor = document.getElementById('calendarEvents');
        if (!contenedor) return;

        contenedor.innerHTML = '';

        // Crear tabla del calendario
        let html = '<table class="calendar-grid"><tr>';
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

        // Encabezados de días de la semana
        diasSemana.forEach(dia => {
            html += `<th class="calendar-header-day">${dia}</th>`;
        });
        html += '</tr><tr>';

        // Días vacíos al inicio
        for (let i = 0; i < diaInicio; i++) {
            html += '<td class="calendar-empty"></td>';
        }

        // Días del mes
        for (let dia = 1; dia <= diasEnMes; dia++) {
            const fecha = `${this.anioActual}-${String(this.mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
            const eventospuntuales = this.obtenerEventosPuntuales(fecha);
            const eventosRango = this.obtenerEventosRango(fecha);
            const esHoy = this.esHoy(dia);

            let clases = 'calendar-day';
            let contenidoEventos = '';
            let tieneEventos = eventospuntuales.length > 0 || eventosRango.length > 0;

            // Procesar eventos de rango primero (como fondo)
            if (eventosRango.length > 0) {
                clases += ' has-range-event';
                // Usar el tipo del primer evento de rango para el color de fondo
                const tipoRango = eventosRango[0].tipo;
                clases += ` tipo-${tipoRango}`;
            }

            // Procesar eventos puntuales
            if (eventospuntuales.length > 0) {
                clases += ' has-event';
                eventospuntuales.forEach((evento, idx) => {
                    contenidoEventos += `
                        <div class="event-badge-punctual tipo-${evento.tipo}" title="${evento.descripcion}">
                            <i class="fas fa-circle-dot"></i>
                            <span class="event-title">${evento.titulo}</span>
                        </div>
                    `;
                });
            }

            // Procesar eventos de rango (mostrar solo uno o indicador)
            if (eventosRango.length > 0) {
                eventosRango.forEach((evento, idx) => {
                    const posicion = this.getPosicionEnRango(fecha, evento);
                    let indicador = '';
                    if (posicion === 'inicio') {
                        indicador = '↪';
                    } else if (posicion === 'fin') {
                        indicador = '↩';
                    } else {
                        indicador = '→';
                    }
                    
                    contenidoEventos += `
                        <div class="event-badge-range tipo-${evento.tipo}" title="${evento.descripcion}: ${this.formatearFecha(evento.rango.inicio)} - ${this.formatearFecha(evento.rango.fin)}">
                            <span class="range-indicator">${indicador}</span>
                            <span class="event-title">${evento.titulo}</span>
                        </div>
                    `;
                });
            }

            if (esHoy) {
                clases += ' today';
            }

            html += `
                <td class="${clases}" data-fecha="${fecha}">
                    <span class="day-number">${dia}</span>
                    ${contenidoEventos}
                </td>
            `;

            // Nueva fila cada domingo
            if ((diaInicio + dia) % 7 === 0 && dia < diasEnMes) {
                html += '</tr><tr>';
            }
        }

        // Completar última fila
        const diasUltFila = (diaInicio + diasEnMes) % 7;
        if (diasUltFila !== 0) {
            for (let i = diasUltFila; i < 7; i++) {
                html += '<td class="calendar-empty"></td>';
            }
        }

        html += '</tr></table>';
        contenedor.innerHTML = html;

        // Agregar eventos de click a días con eventos
        this.asignarEventosDias();
    }

    obtenerEventosPuntuales(fecha) {
        const evento = this.eventos[fecha];
        if (evento && !evento.rango) {
            return [evento];
        }
        return [];
    }

    obtenerEventosRango(fecha) {
        const eventosEnRango = [];
        for (const clave in this.eventos) {
            const evento = this.eventos[clave];
            if (evento.rango) {
                if (this.estaEnRango(fecha, evento.rango)) {
                    eventosEnRango.push(evento);
                }
            }
        }
        return eventosEnRango;
    }

    estaEnRango(fecha, rango) {
        const fechaDate = new Date(fecha + 'T00:00:00');
        const inicioDate = new Date(rango.inicio + 'T00:00:00');
        const finDate = new Date(rango.fin + 'T00:00:00');
        return fechaDate >= inicioDate && fechaDate <= finDate;
    }

    getPosicionEnRango(fecha, evento) {
        if (fecha === evento.rango.inicio) return 'inicio';
        if (fecha === evento.rango.fin) return 'fin';
        return 'medio';
    }

    asignarEventosDias() {
        document.querySelectorAll('.calendar-day.has-event, .calendar-day.has-range-event').forEach(dia => {
            dia.addEventListener('click', (e) => {
                const fecha = e.currentTarget.dataset.fecha;
                const eventospuntuales = this.obtenerEventosPuntuales(fecha);
                const eventosRango = this.obtenerEventosRango(fecha);
                
                if (eventospuntuales.length > 0 || eventosRango.length > 0) {
                    this.mostrarDetallesEventos(eventospuntuales, eventosRango, fecha);
                }
            });
            dia.style.cursor = 'pointer';
        });
    }

    mostrarDetallesEventos(eventospuntuales, eventosRango, fecha) {
        let contenidoEventos = '';

        // Mostrar eventos puntuales
        eventospuntuales.forEach(evento => {
            contenidoEventos += `
                <div class="event-item evento-puntual">
                    <div class="event-header tipo-${evento.tipo}">
                        <i class="fas fa-calendar-day"></i>
                        <h4>${evento.titulo}</h4>
                    </div>
                    <div class="event-details">
                        <p><strong>Fecha:</strong> ${this.formatearFecha(fecha)}</p>
                        <p><strong>Descripción:</strong> ${evento.descripcion}</p>
                        <p><strong>Tipo:</strong> <span class="badge-tipo">${evento.tipo}</span></p>
                    </div>
                </div>
            `;
        });

        // Mostrar eventos de rango
        eventosRango.forEach(evento => {
            contenidoEventos += `
                <div class="event-item evento-rango">
                    <div class="event-header tipo-${evento.tipo}">
                        <i class="fas fa-calendar-range"></i>
                        <h4>${evento.titulo}</h4>
                    </div>
                    <div class="event-details">
                        <p><strong>Período:</strong> ${this.formatearFecha(evento.rango.inicio)} - ${this.formatearFecha(evento.rango.fin)}</p>
                        <p><strong>Descripción:</strong> ${evento.descripcion}</p>
                        <p><strong>Tipo:</strong> <span class="badge-tipo">${evento.tipo}</span></p>
                    </div>
                </div>
            `;
        });

        const modal = document.createElement('div');
        modal.className = 'event-modal';
        modal.innerHTML = `
            <div class="event-modal-content">
                <button class="close-event-modal" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
                <div class="modal-events-container">
                    ${contenidoEventos}
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Cerrar con Escape
        const cerrarConEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', cerrarConEscape);
            }
        };
        document.addEventListener('keydown', cerrarConEscape);
    }

    esHoy(dia) {
        const hoy = new Date();
        return dia === hoy.getDate() &&
            this.mesActual === hoy.getMonth() &&
            this.anioActual === hoy.getFullYear();
    }

    formatearFecha(fecha) {
        const date = new Date(fecha + 'T00:00:00');
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new CalendarioActividades());
} else {
    new CalendarioActividades();
}
