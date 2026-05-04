/**
 * js/journal.js
 * Календарь мероприятий на базе FullCalendar.
 * Зависит от глобального api() из api.js.
 */

let calendar = null; // глобально, чтобы другие модули могли вызвать refetchEvents

// ── Точка входа для секции «Журнал» ──────────────────────────────────────────
function loadJournalSection() {
    if (!calendar) initCalendar();
    else {
        calendar.refetchEvents();
        applyDayColors();
    }
}

// ── Инициализация FullCalendar ────────────────────────────────────────────────
function initCalendar() {
    const el = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(el, {
        initialView: 'dayGridMonth',
        locale: 'ru',
        firstDay: 1,
        headerToolbar: {
            left:   'prev,next today',
            center: 'title',
            right:  ''
        },
        contentHeight: 'auto',
        events: async (info, success, fail) => {
            try {
                const events = await api('events');
                const mapped = events.map(e => ({
                    id:              e.id,
                    title:           e.title,
                    start:           e.date,
                    backgroundColor: colorByStatus(e.status),
                    textColor:       '#000',
                    extendedProps: {
                        responsible: e.responsible,
                        direction:   e.direction,
                        participants: e.participants
                    }
                }));
                success(mapped);
                setTimeout(applyDayColors, 100);
            } catch (err) { fail(err); }
        },
        eventClick: info => editEvent(info.event.id),
        dateClick:  info => showDayEvents(info.dateStr),
        datesSet:   ()   => applyDayColors()
    });
    calendar.render();
}

// ── Подсветка ячеек по статусу ────────────────────────────────────────────────
function colorByStatus(status) {
    if (status === 'conducted') return '#6bcf7f';
    if (status === 'cancelled') return '#dc3545';
    return '#ffc107';
}

async function applyDayColors() {
    await new Promise(r => setTimeout(r, 50));
    const events = await api('events');

    document.querySelectorAll('.fc-daygrid-day').forEach(el => {
        el.style.backgroundColor = '';
        el.style.opacity = '1';
    });

    events.forEach(e => {
        const cell = document.querySelector(`.fc-daygrid-day[data-date="${e.date}"]`);
        if (cell) {
            cell.style.backgroundColor = colorByStatus(e.status);
            cell.style.opacity = '0.3';
        }
    });
}

// ── Список мероприятий на конкретный день ─────────────────────────────────────
async function showDayEvents(dateStr) {
    const events    = await api('events');
    const dayEvents = events.filter(e => e.date === dateStr);

    document.getElementById('dayDate').textContent =
        new Date(dateStr + 'T00:00:00').toLocaleDateString('ru-RU',
            { day: 'numeric', month: 'long', year: 'numeric' });

    const list = document.getElementById('dayEventsList');
    if (!dayEvents.length) {
        list.innerHTML = '<p>Нет запланированных мероприятий</p>';
    } else {
        list.innerHTML = '<ul>' + dayEvents.map(e => `
            <li>
                <b>${e.title}</b> (${e.status})<br>
                <small>Ответственный: ${e.responsible || '—'}, направление: ${e.direction || '—'}</small>
            </li>`).join('') + '</ul>';
    }
    openModal('dayEventsModal');
}

// ── Редактирование мероприятия ────────────────────────────────────────────────
async function editEvent(id) {
    const events = await api('events');
    const e = events.find(ev => ev.id == id);
    if (!e) return;

    document.getElementById('editTitle').value        = e.title;
    document.getElementById('editDate').value         = e.date;
    document.getElementById('editStatus').value       = e.status;
    document.getElementById('editSuccess').value      = e.success;
    document.getElementById('editParticipants').value = e.participants;
    document.getElementById('editComment').value      = e.comment || '';

    const form = document.getElementById('eventEditForm');
    form.style.display        = 'block';
    form.dataset.eventId      = id;
}

async function saveEvent() {
    const form         = document.getElementById('eventEditForm');
    const id           = form.dataset.eventId;
    const participants = parseInt(document.getElementById('editParticipants').value) || 0;

    if (participants < 0) { alert('Количество участников не может быть отрицательным'); return; }

    await api('update_event', 'POST', {
        id,
        status:       document.getElementById('editStatus').value,
        success:      document.getElementById('editSuccess').value,
        participants,
        comment:      document.getElementById('editComment').value
    });

    form.style.display = 'none';
    calendar.refetchEvents();
    applyDayColors();
    notify('Изменения сохранены');
}
