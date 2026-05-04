/**
 * js/admin.js
 * Администрирование: пользователи, группы, логи, шаблоны, импорт Excel.
 */

// ── Точка входа ───────────────────────────────────────────────────────────────
async function loadAdminSection() {
    await Promise.all([
        loadUsers(),
        loadGroups(),
        loadLogs(),
        loadTemplates(),
        loadGroupCuratorsForSelector()
    ]);
}

// ══════════════════════════════════════════════════════
// ПОЛЬЗОВАТЕЛИ
// ══════════════════════════════════════════════════════
async function loadUsers() {
    const users = await api('users');

    const rows = users.map(u => `
        <tr>
            <td>${u.login}</td>
            <td>${u.role}</td>
            <td>${u.dnevnik_token ? '••••••' : 'не задан'}</td>
            <td><button onclick="deleteUser(${u.id})">❌ Удалить</button></td>
        </tr>`).join('');

    document.getElementById('userList').innerHTML =
        `<table><tr><th>Логин</th><th>Роль</th><th>Токен Дневник.ру</th><th>Действия</th></tr>
         ${rows}</table>`;

    const sel = document.getElementById('tokenUserSelect');
    sel.innerHTML = users.map(u =>
        `<option value="${u.id}">${u.login}</option>`).join('');
}

async function addUser() {
    const login    = document.getElementById('newLogin').value.trim();
    const password = document.getElementById('newPass').value.trim();
    const role     = document.getElementById('newRole').value;
    if (!login || !password) return alert('Заполните логин и пароль');

    await api('add_user', 'POST', { login, password, role });
    document.getElementById('newLogin').value = '';
    document.getElementById('newPass').value  = '';
    loadUsers();
    notify('Пользователь добавлен');
}

async function deleteUser(id) {
    if (!confirm('Удалить пользователя безвозвратно?')) return;
    await api('delete_user', 'POST', { id });
    loadUsers();
    notify('Пользователь удалён');
}

async function setUserToken() {
    const userId   = document.getElementById('tokenUserSelect').value;
    const tokenVal = document.getElementById('dnevnikTokenInput').value.trim();
    if (!userId || !tokenVal) return alert('Выберите пользователя и введите токен');

    await api('set_dnevnik_token', 'POST', { user_id: userId, token: tokenVal });
    document.getElementById('dnevnikTokenInput').value = '';
    notify('Токен установлен');
}

// ══════════════════════════════════════════════════════
// ГРУППЫ
// ══════════════════════════════════════════════════════
async function loadGroups() {
    const groups = await api('get_groups');

    const rows = groups.map(g => `
        <tr>
            <td>${g.group_name}</td>
            <td>${g.curator_login || '—'}</td>
            <td>
                <button onclick="editGroup(${g.id}, '${g.group_name}', '${g.curator_id}')">✏️</button>
                <button onclick="deleteGroup(${g.id})">🗑️</button>
            </td>
        </tr>`).join('');

    document.getElementById('groupList').innerHTML =
        `<table><tr><th>Название</th><th>Куратор</th><th>Действия</th></tr>
         ${rows}</table>`;
}

function editGroup(id, name, curatorId) {
    document.getElementById('groupName').value                   = name;
    document.getElementById('groupCuratorSelector').value        = curatorId || '';
    document.getElementById('groupCuratorSelector').dataset.editId = id;
}

async function saveGroup() {
    const name      = document.getElementById('groupName').value.trim();
    const curatorId = document.getElementById('groupCuratorSelector').value;
    const editId    = document.getElementById('groupCuratorSelector').dataset.editId;
    if (!name) return alert('Введите название группы');

    if (editId) {
        await api('update_group', 'POST', { id: editId, group_name: name, curator_id: curatorId });
    } else {
        await api('add_group', 'POST', { group_name: name, curator_id: curatorId });
    }

    document.getElementById('groupName').value                   = '';
    document.getElementById('groupCuratorSelector').value        = '';
    document.getElementById('groupCuratorSelector').dataset.editId = '';
    loadGroups();
    notify('Группа сохранена');
}

async function deleteGroup(id) {
    if (!confirm('Удалить группу?')) return;
    await api('delete_group', 'POST', { id });
    loadGroups();
    notify('Группа удалена');
}

async function loadGroupCuratorsForSelector() {
    const users = await api('users');
    const sel   = document.getElementById('groupCuratorSelector');
    sel.innerHTML = '<option value="">Без куратора</option>' +
        users
            .filter(u => u.role === 'curator')
            .map(u => `<option value="${u.id}">${u.login}</option>`)
            .join('');
}

// ══════════════════════════════════════════════════════
// ЛОГИ
// ══════════════════════════════════════════════════════
async function loadLogs() {
    const tbody = document.querySelector('#logTable tbody');
    tbody.innerHTML = '<tr><td colspan="3">Загрузка...</td></tr>';
    try {
        const logs = await api('get_logs');
        if (Array.isArray(logs) && logs.length) {
            tbody.innerHTML = logs.map(log => `
                <tr>
                    <td>${log.timestamp  || ''}</td>
                    <td>${log.user_login || 'система'}</td>
                    <td>${log.action}</td>
                </tr>`).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="3">Логи пока пусты</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3">Ошибка загрузки логов</td></tr>';
    }
}

// ══════════════════════════════════════════════════════
// ШАБЛОНЫ (БИБЛИОТЕКА)
// ══════════════════════════════════════════════════════
async function loadTemplates() {
    const templates = await api('get_templates');
    const rows = templates.map(t => `
        <tr>
            <td>${t.name || t.content}</td>
            <td>${t.module      || ''}</td>
            <td>${t.date        || ''}</td>
            <td>${t.responsible || ''}</td>
            <td>${t.direction   || ''}</td>
            <td>
                <button onclick="editTemplate(${t.id})">✏️</button>
                <button onclick="deleteTemplate(${t.id})">🗑️</button>
            </td>
        </tr>`).join('');

    document.getElementById('templatesList').innerHTML =
        `<table><tr>
            <th>Название</th><th>Модуль</th><th>Дата</th>
            <th>Ответственный</th><th>Направление</th><th>Действия</th>
         </tr>${rows}</table>`;
}

async function editTemplate(id) {
    const templates = await api('get_templates');
    const tpl = templates.find(t => t.id == id);
    if (!tpl) return;
    document.getElementById('tplName').value        = tpl.name        || '';
    document.getElementById('tplModule').value      = tpl.module      || '';
    document.getElementById('tplDate').value        = tpl.date        || '';
    document.getElementById('tplResponsible').value = tpl.responsible || '';
    document.getElementById('tplDirection').value   = tpl.direction   || '';
    document.getElementById('tplEditId').value      = id;
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
}

function cancelEditTemplate() {
    ['tplName','tplModule','tplDate','tplResponsible','tplEditId'].forEach(id =>
        { document.getElementById(id).value = ''; });
    document.getElementById('tplDirection').value = '';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

async function saveTemplate() {
    const name = document.getElementById('tplName').value.trim();
    if (!name) return alert('Введите название');

    const data = {
        name,
        module:      document.getElementById('tplModule').value.trim(),
        date:        document.getElementById('tplDate').value,
        responsible: document.getElementById('tplResponsible').value.trim(),
        direction:   document.getElementById('tplDirection').value
    };
    const editId = document.getElementById('tplEditId').value;

    if (editId) {
        data.id = editId;
        await api('update_template', 'POST', data);
    } else {
        await api('save_template', 'POST', data);
    }
    cancelEditTemplate();
    loadTemplates();
    notify('Шаблон сохранён');
}

async function deleteTemplate(id) {
    if (!confirm('Удалить шаблон?')) return;
    await api('delete_template', 'POST', { id });
    loadTemplates();
    notify('Шаблон удалён');
}

// ══════════════════════════════════════════════════════
// ИМПОРТ EXCEL
// ══════════════════════════════════════════════════════
async function importExcel() {
    const file = document.getElementById('excelFile').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const wb   = XLSX.read(data, { type: 'array' });
        const sh   = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sh, { header: 1 });

        for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            if (!r || r.length < 2) continue;
            await api('add_event', 'POST', {
                title:        r[0] || 'Без названия',
                date:         r[1],
                direction:    r[2] || '',
                participants: parseInt(r[3]) || 0,
                status:       r[4] || 'planned'
            });
        }
        notify('Импорт завершён');
        if (calendar) calendar.refetchEvents();
        document.getElementById('excelFile').value = '';
    };
    reader.readAsArrayBuffer(file);
}

// ══════════════════════════════════════════════════════
// ПРОЧЕЕ
// ══════════════════════════════════════════════════════
async function clearAllData() {
    if (!confirm('Удалить ВСЕ планы, мероприятия и отчёты? Это необратимо!')) return;
    await api('clear_all', 'POST');
    notify('Все данные очищены');
    if (calendar) calendar.refetchEvents();
}
