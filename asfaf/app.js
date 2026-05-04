/**
 * js/app.js
 * Точка входа приложения.
 * Инициализирует роль пользователя, строит sidebar, загружает дашборд.
 */

async function initRole() {
    try {
        const user = await api('me');
        currentRole   = user.role;
        currentUserId = user.id;

        buildSidebar(user);
        setupBlur();
        loadDashboardHome(user);
    } catch (e) {
        alert('Ошибка авторизации');
        location = 'login.php';
    }
}

// ── Построение бокового меню ──────────────────────────────────────────────────
function buildSidebar(user) {
    const sidebar = document.getElementById('sidebar');

    const items = [
        ['dashboard', '🏠 Главная'],
        ['plan',      '📋 План'],
        ['journal',   '📅 Календарь'],
        ['report',    '📊 Отчёт']
    ];

    if (user.dnevnik_token) items.push(['grades', '📘 Успеваемость']);
    if (['organizer','admin'].includes(currentRole)) items.push(['summary', '📈 Сводка']);
    if (currentRole === 'admin') items.push(['admin', '⚙️ Админ']);

    items.forEach(([id, label]) => {
        const btn = document.createElement('button');
        btn.className = 'sidebar-btn';
        if (id === 'dashboard') btn.classList.add('active');
        btn.textContent = label;
        btn.onclick = () => showSection(id);
        sidebar.appendChild(btn);
    });

    // Кнопка выхода
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'sidebar-btn';
    logoutBtn.textContent = '🚪 Выход';
    logoutBtn.style.marginTop   = 'auto';
    logoutBtn.style.background  = 'rgba(255,80,80,0.2)';
    logoutBtn.style.borderColor = '#ff5050';
    logoutBtn.onclick = () => { localStorage.removeItem('token'); location = 'login.php'; };
    sidebar.appendChild(logoutBtn);
}

// ── Главная страница (дашборд) ────────────────────────────────────────────────
async function loadDashboardHome(user) {
    const card = document.querySelector('#dashboard .card');

    let percentDone = 0, planStatus = 'не сдан', reportStatus = 'не сдан';
    try {
        const summary = await api('summary_data');
        if (summary && summary.length) {
            const my = summary.find(s => s.user_id == currentUserId);
            if (my) {
                planStatus   = my.plan_status   || 'не сдан';
                reportStatus = my.report_status || 'не сдан';
                percentDone  = my.percent_done  || 0;
            }
        }
    } catch (e) {}

    const planBadge   = planStatus === 'ready'     ? 'success' : 'warning';
    const reportBadge = reportStatus === 'submitted' ? 'success' : 'danger';

    card.innerHTML = `
        <h3>Добро пожаловать, ${user.login}!</h3>
        <p>Роль: ${currentRole}</p>
        <div style="margin:15px 0;">
            <h4>Выполнение плана</h4>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width:${percentDone}%;"></div>
            </div>
            <span>${percentDone}% (выполнено / запланировано)</span>
        </div>
        <div>
            План: <span class="status-badge ${planBadge}">${planStatus}</span>
            Отчёт: <span class="status-badge ${reportBadge}">${reportStatus}</span>
        </div>
        <div style="margin-top:15px;">
            <button onclick="showSection('plan')">📋 План на год</button>
            <button onclick="showSection('journal')">📅 Журнал</button>
            <button onclick="showSection('report')">📊 Отчёт</button>
        </div>`;

    // Ближайшие мероприятия
    try {
        const events = await api('events&upcoming=true');
        if (events.length) {
            card.innerHTML += '<h4>📌 Ближайшие мероприятия</h4>' +
                events.slice(0, 5).map(e =>
                    `<p><b>${e.title}</b> – ${e.date} (${e.status})</p>`
                ).join('');
        }
    } catch (e) {}
}

// ── Старт ─────────────────────────────────────────────────────────────────────
initRole();
