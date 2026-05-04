/**
 * js/report.js
 * Итоговый отчёт куратора: генерация, сохранение, AI-анализ, экспорт.
 */

let chart = null; // Chart.js инстанс

function loadReportSection() {
    // Секция рендерится статично в HTML; никакой ленивой загрузки не требуется.
}

// ── Вспомогательная функция построения диаграммы ─────────────────────────────
function renderDirectionsChart(directions) {
    if (chart && typeof chart.destroy === 'function') chart.destroy();
    chart = new Chart(document.getElementById('chart'), {
        type: 'bar',
        data: {
            labels:   Object.keys(directions),
            datasets: [{ label: 'Мероприятия', data: Object.values(directions) }]
        }
    });
}

// ── Вспомогательная функция план-факт таблицы ────────────────────────────────
function renderPlanFact(planFact) {
    const rows = planFact.map(r =>
        `<tr><td>${r.module}</td><td>${r.planned}</td><td>${r.fact}</td><td>${r.percent}%</td></tr>`
    ).join('');
    document.getElementById('planFactContainer').innerHTML =
        `<table><tr><th>Модуль</th><th>План</th><th>Факт</th><th>%</th></tr>${rows}</table>`;
}

// ── Сформировать черновик ─────────────────────────────────────────────────────
async function generateFullReport() {
    const period = document.getElementById('reportPeriod').value;
    const report = await api('generate_report');

    document.getElementById('selfAnalysisFull').value = report.text;

    // Подтянуть ранее сохранённые поля, если есть
    const saved = await api('get_my_full_report&period=' + period);
    if (saved && saved.self_analysis)    document.getElementById('selfAnalysisFull').value = saved.self_analysis;
    if (saved && saved.group_evaluation) document.getElementById('groupEvaluation').value  = saved.group_evaluation;

    renderDirectionsChart(report.directions);
    renderPlanFact(report.planFact);
    fullReportData = report;
}

// ── Загрузить сохранённый ─────────────────────────────────────────────────────
async function loadSavedFullReport() {
    const period = document.getElementById('reportPeriod').value;
    const saved  = await api('get_my_full_report&period=' + period);

    if (saved && saved.id) {
        document.getElementById('selfAnalysisFull').value = saved.self_analysis    || '';
        document.getElementById('groupEvaluation').value  = saved.group_evaluation || '';

        const report = await api('generate_report');
        renderDirectionsChart(report.directions);
        renderPlanFact(report.planFact);
        fullReportData = report;
    } else {
        alert('Сохранённый отчёт не найден');
    }
}

// ── Сохранить весь отчёт ─────────────────────────────────────────────────────
async function saveFullReport() {
    const period          = document.getElementById('reportPeriod').value;
    const selfAnalysis    = document.getElementById('selfAnalysisFull').value;
    const groupEvaluation = document.getElementById('groupEvaluation').value;

    const res = await api('save_full_report', 'POST',
        { period, self_analysis: selfAnalysis, group_evaluation: groupEvaluation });
    if (res.ok) notify('Отчёт сохранён');
}

// ── AI-анализ ─────────────────────────────────────────────────────────────────
async function generateAIReport() {
    const events = await api('events');
    const res = await fetch('api.php?action=ai_report', {
        method:  'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body:    JSON.stringify({ events })
    });
    const data = await res.json();
    document.getElementById('selfAnalysisFull').value = data.report;
    notify('AI-анализ добавлен в самоанализ');
}

// ── Экспорт ───────────────────────────────────────────────────────────────────
async function exportDOCX() {
    if (!fullReportData) return;
    const params = `action=export_report_docx&period=2025-2026` +
        `&text=${encodeURIComponent(fullReportData.text)}` +
        `&planFact=${encodeURIComponent(JSON.stringify(fullReportData.planFact))}`;
    const res  = await fetch('api.php?' + params, { headers: { 'Authorization': 'Bearer ' + token } });
    const blob = await res.blob();
    triggerDownload(blob, 'report.docx');
}

async function exportPDF() {
    if (!fullReportData) return;
    const params = `action=export_pdf&text=${encodeURIComponent(fullReportData.text)}`;
    const res  = await fetch('api.php?' + params, { headers: { 'Authorization': 'Bearer ' + token } });
    const blob = await res.blob();
    triggerDownload(blob, 'report.pdf');
}

async function exportSummaryExcel() {
    const res  = await fetch('api.php?action=export_summary_excel',
        { headers: { 'Authorization': 'Bearer ' + token } });
    const blob = await res.blob();
    triggerDownload(blob, 'summary.csv');
}

/** Программный клик по временной ссылке для скачивания blob. */
function triggerDownload(blob, filename) {
    const a  = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
}

// ── Сводка (M1-M3) ───────────────────────────────────────────────────────────
async function loadSummarySection() {
    document.getElementById('summary').innerHTML = `
        <div class="card">
            <h3>Сводная отчётность</h3>
            <button onclick="exportSummaryExcel()" style="margin-bottom:15px;">📊 Экспорт в Excel</button>
            <table id="summaryTable">
                <thead><tr>
                    <th>Куратор</th><th>Группа</th><th>Статус плана</th>
                    <th>Статус отчёта</th><th>План</th><th>Отчёт</th>
                </tr></thead>
                <tbody></tbody>
            </table>
        </div>`;

    const data = await api('summary_data');
    const rows = data.map(r => `
        <tr>
            <td>${r.login}</td>
            <td>${r.group_name}</td>
            <td>${r.plan_status   || '—'}</td>
            <td>${r.report_status || '—'}</td>
            <td><button onclick="viewCuratorPlan(${r.user_id}, '${r.year}')">📋 Открыть</button></td>
            <td><button onclick="viewCuratorReportModal(${r.user_id}, '${r.year}')">📄 Открыть</button></td>
        </tr>`).join('');

    document.querySelector('#summaryTable tbody').innerHTML =
        rows || '<tr><td colspan="6">Нет данных</td></tr>';
}

async function viewCuratorPlan(userId, year) {
    const res = await api('get_user_plan_details&user_id=' + userId + '&year=' + year);
    const modalContent = document.getElementById('planViewContent');

    if (!res || !res.plan) {
        modalContent.innerHTML = '<p>План не найден</p>';
    } else {
        const plan = res.plan;
        let html = `
            <p><b>Группа:</b> ${plan.group_name || '—'}</p>
            <p><b>Год:</b> ${plan.year}</p>
            <p><b>Пояснительная записка:</b> ${plan.description || '—'}</p>
            <p><b>Целевой раздел:</b> ${plan.goals || '—'}</p>
            <h4>Модули</h4>`;

        if (res.rows && res.rows.length) {
            html += '<table><tr><th>Модуль</th><th>Сроки</th><th>Ответственные</th><th>Направление</th></tr>' +
                res.rows.map(row =>
                    `<tr><td>${row.module}</td><td>${row.deadline}</td>
                         <td>${row.responsible}</td><td>${row.direction}</td></tr>`
                ).join('') +
                '</table>';
        } else {
            html += '<p>Модули отсутствуют</p>';
        }
        modalContent.innerHTML = html;
    }
    openModal('planViewModal');
}

async function viewCuratorReportModal(userId, period) {
    const report = await api('get_user_full_report&user_id=' + userId + '&period=' + period);
    const modalContent = document.getElementById('reportModalContent');

    modalContent.innerHTML = (!report || !report.id)
        ? '<p>Отчёт ещё не подготовлен</p>'
        : `<p><b>Самоанализ:</b> ${report.self_analysis || '—'}</p>
           <p><b>Оценка группы:</b> ${report.group_evaluation || '—'}</p>`;

    openModal('reportModal');
}

// ── Успеваемость (Дневник.ру) ─────────────────────────────────────────────────
function loadDnevnikSection() {}   // секция статична, данные грузятся по кнопке

async function loadDnevnikGrades() {
    const container = document.getElementById('dnevnikTableContainer');
    try {
        const res  = await fetch('api.php?action=get_my_dnevnik_grades',
            { headers: { 'Authorization': 'Bearer ' + token } });
        const data = await res.json();

        if (data.error) {
            container.innerHTML = `<p style="color:red">${data.error}</p>`;
            return;
        }

        if (data.students && data.students.length) {
            const rows = data.students.map(s => {
                const subs = s.subjects.map(sub =>
                    `${sub.subject}: ${sub.marks.join(', ')} (ср. ${sub.average})`
                ).join('<br>');
                return `<tr><td>${s.name}</td><td>${subs}</td></tr>`;
            }).join('');
            container.innerHTML =
                `<table><thead><tr><th>Студент</th><th>Предметы (оценки)</th></tr></thead>
                 <tbody>${rows}</tbody></table>`;
        } else {
            container.innerHTML = '<p>Нет данных</p>';
        }
    } catch (e) {
        container.innerHTML = '<p style="color:red">Не удалось загрузить данные</p>';
    }
}
