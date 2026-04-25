<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Куратор.План — Дашборд</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;500;700&display=swap" rel="stylesheet">
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Montserrat',sans-serif;overflow:hidden;height:100vh}
        .wrapper{display:flex;height:100vh}
        .left{
            width:280px;background:#0c1f16;color:#fff;padding:30px 20px;
            display:flex;flex-direction:column;z-index:10;box-shadow:2px 0 20px rgba(0,0,0,0.5);
        }
        .left h2{font-size:24px;margin-bottom:25px;text-align:center;color:#6bcf7f;cursor:pointer}
        .sidebar-btn{
            display:block;width:100%;padding:12px 15px;margin:4px 0;background:transparent;
            border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;text-align:left;
            cursor:pointer;font-size:14px;transition:0.3s;
        }
        .sidebar-btn:hover{background:#1e3b2a;border-color:#6bcf7f}
        .sidebar-btn.active{background:#6bcf7f;color:#0c1f16;font-weight:600}
        .right{flex:1;position:relative;overflow:hidden}
        .bg-video{position:absolute;inset:0;object-fit:cover;width:100%;height:100%;z-index:0}
        .blur-overlay{position:absolute;inset:0;backdrop-filter:blur(0px);transition:backdrop-filter 0.3s;z-index:1}
        .blur-overlay.active{backdrop-filter:blur(8px)}
        .content{position:relative;z-index:2;padding:40px;height:100%;overflow-y:auto}
        .card{
            background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);border-radius:16px;
            padding:25px;margin-bottom:20px;box-shadow:0 10px 30px rgba(0,0,0,0.3);color:#1a1a1a;
            max-width:900px;margin-left:auto;margin-right:auto;
        }
        .card h3{margin-bottom:15px}
        input, select, textarea, button{
            padding:10px;margin:5px;border-radius:8px;border:1px solid #ccc;font-family:inherit;
        }
        button{background:#6bcf7f;border:none;cursor:pointer;font-weight:600}
        button:hover{background:#4ea861}
        table{width:100%;border-collapse:collapse;margin-top:10px}
        td,th{padding:10px;border-bottom:1px solid #ddd;text-align:left}
        .section{display:none}
        .section.active{display:block}
        #toast{
            position:fixed;top:20px;right:20px;background:#6bcf7f;color:#fff;
            padding:12px 20px;border-radius:8px;z-index:9999;opacity:0;transition:0.3s;
        }
        #toast.show{opacity:1}
    </style>
</head>
<body>
<div class="wrapper">
    <div class="left" id="sidebar">
        <h2 onclick="showSection('dashboard')">Куратор.План</h2>
    </div>
    <div class="right">
        <video class="bg-video" autoplay muted loop>
            <source src="video/forest.mp4" type="video/mp4">
        </video>
        <div class="blur-overlay" id="blurOverlay"></div>
        <div class="content">
            <div id="dashboard" class="section active"><div class="card"><h3>Добро пожаловать</h3><p>Загрузка...</p></div></div>
            <div id="plan" class="section"></div>
            <div id="journal" class="section"></div>
            <div id="report" class="section"></div>
            <div id="summary" class="section"></div>
            <div id="admin" class="section"></div>
        </div>
    </div>
</div>
<div id="toast"></div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
const token = localStorage.getItem('token');
if (!token) window.location = 'login.php';

let currentRole = '';
let currentUserId = 0;
let currentPlanId = null;

async function api(action, method='GET', body=null){
    const headers = {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
    const opts = {method, headers};
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch('api.php?action='+action, opts);
    return res.json();
}

function notify(msg){
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
}

function setupBlur(){
    document.querySelectorAll('.sidebar-btn').forEach(b => {
        b.addEventListener('mouseenter', () => document.getElementById('blurOverlay').classList.add('active'));
        b.addEventListener('mouseleave', () => document.getElementById('blurOverlay').classList.remove('active'));
    });
}

function showSection(id){
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    if (id === 'plan') loadPlanSection();
    else if (id === 'journal') loadJournalSection();
    else if (id === 'report') loadReportSection();
    else if (id === 'summary') loadSummarySection();
    else if (id === 'admin') loadAdminSection();
}

async function initRole(){
    try {
        const user = await api('me');
        currentRole = user.role;
        currentUserId = user.id;
        const sidebar = document.getElementById('sidebar');
        const menuItems = [
            ['dashboard', '🏠 Главная'],
            ['plan', '📋 План'],
            ['journal', '📅 Журнал'],
            ['report', '📊 Отчёт']
        ];
        if (currentRole === 'organizer' || currentRole === 'admin') {
            menuItems.push(['summary', '📈 Сводка']);
        }
        if (currentRole === 'admin') {
            menuItems.push(['admin', '⚙️ Администрирование']);
        }
        menuItems.forEach(([id, label]) => {
            const btn = document.createElement('button');
            btn.className = 'sidebar-btn';
            if (id === 'dashboard') btn.classList.add('active');
            btn.textContent = label;
            btn.onclick = () => showSection(id);
            sidebar.appendChild(btn);
        });
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'sidebar-btn';
        logoutBtn.textContent = '🚪 Выход';
        logoutBtn.style.marginTop = 'auto';
        logoutBtn.style.background = 'rgba(255,80,80,0.2)';
        logoutBtn.style.borderColor = '#ff5050';
        logoutBtn.onclick = () => { localStorage.removeItem('token'); location='login.php'; };
        sidebar.appendChild(logoutBtn);
        setupBlur();
        // Загрузить приветствие
        document.querySelector('#dashboard .card').innerHTML = `<h3>Добро пожаловать, ${user.login}!</h3><p>Роль: ${currentRole}</p>`;
    } catch(e) {
        alert('Ошибка авторизации');
        location = 'login.php';
    }
}

function loadPlanSection(){
    const html = `
        <div class="card">
            <h3>Годовой план воспитательной работы</h3>
            <select id="groupSelect"><option>ПО-41</option><option>ИС-32</option></select>
            <input id="planYear" value="2025-2026" placeholder="Учебный год">
            <button onclick="createPlan()">Создать план</button>
        </div>
        <div class="card">
            <h4>Таблица модулей</h4>
            <table id="planTable"><thead><tr><th>Модуль</th><th>Сроки</th><th>Ответственный</th><th>Участники</th><th>Направление</th><th></th></tr></thead><tbody></tbody></table>
            <button onclick="addRow()">+ Добавить строку</button>
            <button onclick="addFromLibrary()">📚 Из библиотеки</button>
            <span style="color:#e67e22" id="warningMsg"></span>
        </div>
        <div class="card">
            <button onclick="saveDraft()">Сохранить черновик</button>
            <button onclick="markReady()">Готов к сдаче</button>
            <button onclick="exportPlan()">Экспорт DOCX</button>
        </div>
    `;
    document.getElementById('plan').innerHTML = html;
    loadLastPlan();
}

async function loadLastPlan(){
    const plans = await api('summary_data'); 
    currentPlanId = 1; 
    if (currentPlanId) loadPlanRows();
}

async function createPlan(){
    const group = document.getElementById('groupSelect').value;
    const year = document.getElementById('planYear').value;
    const res = await api('create_plan', 'POST', {group, year});
    if (res.ok) {
        currentPlanId = res.plan_id;
        loadPlanRows();
        notify('План создан');
    }
}

async function loadPlanRows(){
    if (!currentPlanId) return;
    const rows = await api('load_plan?plan_id=' + currentPlanId);
    let html = '';
    rows.forEach(r => {
        html += `<tr>
            <td>${r.module}</td><td>${r.deadline}</td><td>${r.responsible}</td>
            <td>${r.participants}</td><td>${r.direction}</td>
            <td><button onclick="deleteRow(${r.id})">×</button></td>
        </tr>`;
    });
    document.querySelector('#planTable tbody').innerHTML = html;
    checkDirections(rows);
}

function checkDirections(rows){
    const required = ['Гражданское','Патриотическое','Физическое','Духовное','Трудовое','Эстетическое','Экологическое','ЗОЖ'];
    const present = new Set(rows.map(r => r.direction));
    const missing = required.filter(d => !present.has(d));
    document.getElementById('warningMsg').textContent = missing.length ? 'Не охвачены направления: '+missing.join(', ') : '';
}

async function addRow(){
    if (!currentPlanId) return;
    const module = prompt('Название модуля');
    if (!module) return;
    const deadline = prompt('Сроки (например, 15.12.2025)','');
    const responsible = prompt('Ответственный');
    const participants = prompt('Участники');
    const direction = prompt('Направление');
    await api('add_plan_row','POST',{plan_id:currentPlanId, module, deadline, responsible, participants, direction});
    loadPlanRows();
}

async function addFromLibrary(){
    const templates = await api('get_templates');
    if (!templates.length) return alert('Библиотека пуста');
    const list = templates.map(t => t.content).join('\n');
    const chosen = prompt('Введите мероприятие из библиотеки:\n'+list);
    if (!chosen) return;
    await api('add_plan_row','POST',{plan_id:currentPlanId, module:chosen, deadline:'01.01.2026', responsible:'', participants:'', direction:'Гражданское'});
    loadPlanRows();
}

async function saveDraft(){ notify('Черновик сохранён'); }
async function markReady(){
    if (!currentPlanId) return;
    await api('mark_plan_ready','POST',{plan_id:currentPlanId});
    notify('План отмечен как готовый');
}
function exportPlan(){
    window.open('api.php?action=export_report_docx&text=План работы&planFact='+encodeURIComponent(JSON.stringify([])), '_blank');
}

function loadJournalSection(){
    const html = `
        <div class="card">
            <h3>Календарь мероприятий</h3>
            <input type="month" id="journalMonth" onchange="loadJournal()">
            <div id="journalCalendar"></div>
        </div>
        <div class="card" id="eventEditForm" style="display:none">
            <h4>Редактирование мероприятия</h4>
            <input id="editTitle" placeholder="Название">
            <input type="date" id="editDate">
            <select id="editStatus"><option>planned</option><option>conducted</option><option>postponed</option><option>cancelled</option></select>
            <select id="editSuccess"><option>neutral</option><option>good</option><option>bad</option></select>
            <input type="number" id="editParticipants" placeholder="Участников">
            <textarea id="editComment" placeholder="Комментарий"></textarea>
            <button onclick="saveEvent()">Сохранить</button>
        </div>
        <div class="card">
            <h4>Социальный паспорт группы</h4>
            <textarea id="socialPassport" rows="6"></textarea>
            <button onclick="saveSocialPassport()">Сохранить</button>
        </div>
    `;
    document.getElementById('journal').innerHTML = html;
    loadJournal();
    loadSocialPassport();
}

async function loadJournal(){
    const month = document.getElementById('journalMonth')?.value || '';
    const events = await api('events');
    let html = '';
    events.forEach(e => {
        if (!month || e.date.startsWith(month)) {
            html += `<div class="card" style="margin:5px 0; cursor:pointer" onclick="editEvent(${e.id})">
                <b>${e.title}</b><br>📅 ${e.date} | Статус: ${e.status}
            </div>`;
        }
    });
    document.getElementById('journalCalendar').innerHTML = html || 'Нет мероприятий';
}

async function editEvent(id){
    const events = await api('events');
    const e = events.find(ev => ev.id == id);
    if (!e) return;
    document.getElementById('editTitle').value = e.title;
    document.getElementById('editDate').value = e.date;
    document.getElementById('editStatus').value = e.status;
    document.getElementById('editSuccess').value = e.success;
    document.getElementById('editParticipants').value = e.participants;
    document.getElementById('editComment').value = e.comment || '';
    document.getElementById('eventEditForm').style.display = 'block';
    document.getElementById('eventEditForm').dataset.eventId = id;
}

async function saveEvent(){
    const id = document.getElementById('eventEditForm').dataset.eventId;
    const data = {
        id: id,
        status: document.getElementById('editStatus').value,
        success: document.getElementById('editSuccess').value,
        participants: document.getElementById('editParticipants').value,
        comment: document.getElementById('editComment').value
    };
    await api('update_event','POST', data);
    document.getElementById('eventEditForm').style.display = 'none';
    loadJournal();
    notify('Изменения сохранены');
}

async function loadSocialPassport(){
    const res = await api('get_social_passport');
    document.getElementById('socialPassport').value = res.text || '';
}
async function saveSocialPassport(){
    const text = document.getElementById('socialPassport').value;
    await api('save_social_passport','POST',{text});
    notify('Паспорт сохранён');
}

let chart;
function loadReportSection(){
    const html = `
        <div class="card">
            <h3>Итоговый отчёт</h3>
            <input id="reportPeriod" value="2025-2026">
            <button onclick="generateReport()">Сформировать</button>
        </div>
        <div class="card"><h4>План-факт</h4><table id="planFactTable"></table></div>
        <div class="card"><canvas id="chart" style="max-height:250px"></canvas></div>
        <div class="card">
            <h4>Самоанализ</h4>
            <textarea id="selfAnalysis" rows="10"></textarea>
            <button onclick="exportDOCX()">Экспорт DOCX</button>
            <button onclick="exportPDF()">Экспорт PDF</button>
        </div>
    `;
    document.getElementById('report').innerHTML = html;
}

async function generateReport(){
    const period = document.getElementById('reportPeriod').value;
    const report = await api('generate_report');
    document.getElementById('selfAnalysis').value = report.text;

    const labels = Object.keys(report.directions);
    const values = Object.values(report.directions);
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('chart'),{
        type:'bar',
        data:{labels, datasets:[{label:"Мероприятия",data:values}]}
    });

    let html = '<tr><th>Модуль</th><th>План</th><th>Факт</th><th>%</th></tr>';
    report.planFact.forEach(r => {
        html += `<tr><td>${r.module}</td><td>${r.planned}</td><td>${r.fact}</td><td>${r.percent}%</td></tr>`;
    });
    document.getElementById('planFactTable').innerHTML = html;
    window._lastReport = report;
}

function exportDOCX(){
    const report = window._lastReport;
    if (!report) return;
    const params = `action=export_report_docx&period=2025-2026&text=${encodeURIComponent(report.text)}&planFact=${encodeURIComponent(JSON.stringify(report.planFact))}`;
    window.open('api.php?'+params, '_blank');
}
function exportPDF(){
    const report = window._lastReport;
    if (!report) return;
    const params = `action=export_report_pdf&period=2025-2026&text=${encodeURIComponent(report.text)}&planFact=${encodeURIComponent(JSON.stringify(report.planFact))}`;
    window.open('api.php?'+params, '_blank');
}

async function loadSummarySection(){
    const html = `
        <div class="card">
            <h3>Сводная отчётность</h3>
            <table id="summaryTable"></table>
            <button onclick="exportSummaryExcel()">Экспорт Excel</button>
        </div>
    `;
    document.getElementById('summary').innerHTML = html;
    const data = await api('summary_data');
    let rows = '<tr><th>Куратор</th><th>Группа</th><th>Статус</th><th>Год</th></tr>';
    data.forEach(r => rows += `<tr><td>${r.login}</td><td>${r.group_name}</td><td>${r.status}</td><td>${r.year}</td></tr>`);
    document.getElementById('summaryTable').innerHTML = rows;
}
function exportSummaryExcel(){
    window.open('api.php?action=export_summary_excel', '_blank');
}

async function loadAdminSection(){
    const html = `
        <div class="card">
            <h3>Управление пользователями</h3>
            <div id="userList"></div>
            <input id="newLogin" placeholder="Логин"><input id="newPass" placeholder="Пароль"><input id="newRole" placeholder="Роль"><button onclick="addUser()">Добавить</button>
        </div>
        <div class="card">
            <h3>Библиотека мероприятий</h3>
            <textarea id="tplContent" rows="3"></textarea>
            <button onclick="saveTemplate()">Сохранить шаблон</button>
        </div>
    `;
    document.getElementById('admin').innerHTML = html;
    loadUsers();
}

async function loadUsers(){
    const users = await api('users');
    let html = '';
    users.forEach(u => {
        html += `<div>${u.login} (${u.role}) <button onclick="changeRole(${u.id},'curator')">Сделать куратором</button> <button onclick="changeRole(${u.id},'organizer')">Сделать организатором</button></div>`;
    });
    document.getElementById('userList').innerHTML = html;
}
async function changeRole(id, role){
    await api('set_role','POST',{id, role});
    loadUsers();
    notify('Роль обновлена');
}
async function saveTemplate(){
    const content = document.getElementById('tplContent').value;
    await api('save_template','POST',{content});
    notify('Шаблон сохранён');
}

initRole();
</script>
</body>
</html>