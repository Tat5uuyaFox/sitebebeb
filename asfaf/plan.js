/**
 * js/plan.js
 * Всё, что связано с «Годовым планом воспитательной работы»:
 * рендер секции, CRUD строк, модальное окно модуля, библиотека шаблонов.
 */

// ── Отрисовка секции «План» ───────────────────────────────────────────────────
function loadPlanSection() {
    document.getElementById('plan').innerHTML = `
        <div class="card">
            <h3>Годовой план воспитательной работы</h3>
            <p><b>Куратор:</b> <span id="curatorName">Загрузка...</span></p>
            <select id="groupSelect"><option>ПО-41</option><option>ИС-32</option></select>
            <input id="planYear" value="2025-2026" placeholder="Учебный год">
            <button onclick="createPlan()">Создать план</button>
        </div>
        <div class="card">
            <h4>Пояснительная записка</h4>
            <textarea id="planDescription" class="large" rows="4" placeholder="Опишите цели и задачи..."></textarea>
        </div>
        <div class="card">
            <h4>Целевой раздел</h4>
            <textarea id="planGoals" class="large" rows="4" placeholder="Основные направления воспитательной работы..."></textarea>
        </div>
        <div class="card">
            <h4>Организационный раздел (модули)</h4>
            <table id="planTable">
                <thead><tr>
                    <th>Модуль</th><th>Сроки</th><th>Ответственные</th>
                    <th>Участники</th><th>Направление воспитания</th><th></th>
                </tr></thead>
                <tbody></tbody>
            </table>
            <button onclick="openModuleModal()">+ Добавить строку</button>
            <button onclick="openLibraryModal()" class="library-btn">📚 Из библиотеки</button>
            <span id="warningMsg" style="color:#e67e22"></span>
        </div>
        <div class="card">
            <button onclick="savePlanMeta()">💾 Сохранить описание</button>
            <button onclick="saveDraft()">💾 Сохранить черновик</button>
            <button onclick="markReady()">✅ Готов к сдаче</button>
            <button onclick="exportPlan()">📤 Экспорт плана в DOCX</button>
        </div>`;

    loadLastPlan();
    loadCuratorName();
}

async function loadCuratorName() {
    try {
        const user = await api('me');
        document.getElementById('curatorName').textContent = user.full_name || user.login;
    } catch (e) {}
}

async function loadLastPlan() {
    const res = await api('get_my_last_plan');
    if (res.plan) {
        currentPlanId = res.plan.id;
        document.getElementById('groupSelect').value = res.plan.group_name || 'ПО-41';
        document.getElementById('planYear').value    = res.plan.year        || '2025-2026';
        if (res.plan.description) document.getElementById('planDescription').value = res.plan.description;
        if (res.plan.goals)       document.getElementById('planGoals').value       = res.plan.goals;
        loadPlanRows();
    } else {
        currentPlanId = null;
        document.querySelector('#planTable tbody').innerHTML = '<tr><td colspan="6">План ещё не создан.</td></tr>';
    }
}

async function createPlan() {
    const group = document.getElementById('groupSelect').value;
    const year  = document.getElementById('planYear').value;
    const res   = await api('create_plan', 'POST', { group, year });
    if (res.ok) {
        currentPlanId = res.plan_id;
        loadPlanRows();
        if (calendar) calendar.refetchEvents();
        notify('План создан');
    }
}

async function loadPlanRows() {
    if (!currentPlanId) return;
    const rows = await api('load_plan&plan_id=' + currentPlanId);
    if (Array.isArray(rows) && rows.length) {
        const html = rows.map(r => `
            <tr>
                <td>${r.module}</td>
                <td>${r.deadline}</td>
                <td>${r.responsible}</td>
                <td>${r.participants}</td>
                <td>${r.direction}</td>
                <td><button onclick="deleteRow(${r.id})">×</button></td>
            </tr>`).join('');
        document.querySelector('#planTable tbody').innerHTML = html;
        checkDirections(rows);
    } else {
        document.querySelector('#planTable tbody').innerHTML =
            '<tr><td colspan="6">Пока нет модулей. Добавьте первый.</td></tr>';
    }
}

function checkDirections(rows) {
    const required = ['Гражданское','Патриотическое','Физическое','Духовное',
                      'Трудовое','Эстетическое','Экологическое','ЗОЖ'];
    const present  = new Set(rows.map(r => r.direction));
    const missing  = required.filter(d => !present.has(d));
    const warning  = document.getElementById('warningMsg');
    warning.textContent = missing.length
        ? '⚠️ Не охвачены направления: ' + missing.join(', ')
        : '✅ Все направления охвачены';
}

async function deleteRow(id) {
    if (!confirm('Удалить модуль? Связанное мероприятие также будет удалено.')) return;
    await api('delete_plan_row', 'POST', { id });
    loadPlanRows();
    if (calendar) calendar.refetchEvents();
    notify('Модуль удалён');
}

async function savePlanMeta() {
    if (!currentPlanId) return;
    const description = document.getElementById('planDescription').value;
    const goals       = document.getElementById('planGoals').value;
    await api('save_plan_meta', 'POST', { plan_id: currentPlanId, description, goals });
    notify('Описание сохранено');
}

function saveDraft() { notify('Черновик сохранён'); }

async function markReady() {
    if (!currentPlanId) return;
    await api('mark_plan_ready', 'POST', { plan_id: currentPlanId });
    notify('План отмечен как готовый');
}

async function exportPlan() {
    if (!currentPlanId) return;
    window.open(`api.php?action=export_plan_docx&plan_id=${currentPlanId}&token=${token}`, '_blank');
}

// ── Модальное окно добавления модуля ─────────────────────────────────────────
async function openModuleModal() {
    if (!currentPlanId) {
        const group = document.getElementById('groupSelect').value;
        const year  = document.getElementById('planYear').value;
        const res   = await api('create_plan', 'POST', { group, year });
        if (res.ok) {
            currentPlanId = res.plan_id;
            if (calendar) calendar.refetchEvents();
            notify('План автоматически создан');
        } else {
            alert('Не удалось создать план');
            return;
        }
    }
    await loadTeachers();
    openModal('moduleModal');
}

async function submitModule() {
    const module       = document.getElementById('modTitle').value.trim();
    const deadline     = document.getElementById('modDeadline').value;
    const responsible  = document.getElementById('modResponsible').value;
    const participants = parseInt(document.getElementById('modParticipants').value) || 0;
    const direction    = document.getElementById('modDirection').value;

    if (!module || !deadline || !responsible) { alert('Заполните обязательные поля'); return; }
    if (participants < 0) { alert('Количество участников не может быть отрицательным'); return; }

    await api('add_plan_row', 'POST',
        { plan_id: currentPlanId, module, deadline, responsible, participants, direction });
    closeModal('moduleModal');
    loadPlanRows();
    if (calendar) calendar.refetchEvents();
    notify('Модуль добавлен');
}

// ── Библиотека шаблонов ───────────────────────────────────────────────────────
async function openLibraryModal() {
    const templates = await api('get_templates');
    const listDiv   = document.getElementById('libraryList');
    if (!templates.length) {
        listDiv.innerHTML = '<p>Библиотека пуста</p>';
        openModal('libraryModal');
        return;
    }
    listDiv.innerHTML = '<ul style="list-style:none;padding:0">' +
        templates.map(t =>
            `<li style="padding:10px;border-bottom:1px solid #ddd;cursor:pointer"
                 onclick="useTemplate(${t.id})">${t.name || t.content}</li>`
        ).join('') +
        '</ul>';
    openModal('libraryModal');
}

async function useTemplate(tplId) {
    const templates = await api('get_templates');
    const tpl = templates.find(t => t.id == tplId);
    if (!tpl) return;
    document.getElementById('modTitle').value        = tpl.name        || tpl.content || '';
    document.getElementById('modDeadline').value     = tpl.date        || '';
    document.getElementById('modResponsible').value  = tpl.responsible || '';
    document.getElementById('modParticipants').value = tpl.participants || 0;
    document.getElementById('modDirection').value    = tpl.direction   || 'Гражданское';
    closeLibraryModal();
    await loadTeachers();
    openModal('moduleModal');
}

async function loadTeachers() {
    const teachers = await api('get_teachers');
    const sel = document.getElementById('modResponsible');
    sel.innerHTML = teachers.map(t =>
        `<option value="${t.login}">${t.login}</option>`).join('');
}
